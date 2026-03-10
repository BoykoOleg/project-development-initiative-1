"""
Интеграция с МОБИЛОН ВАТС: история звонков по дням, запись разговоров.
API: https://connect.mobilon.ru/api/call/journal?token={token}&date={date}&format=xml
"""
import json
import os
import urllib.request
import urllib.parse
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta
from concurrent.futures import ThreadPoolExecutor, as_completed

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token, X-Session-Id',
    'Access-Control-Max-Age': '86400',
}

TIMEOUT = 8  # секунд на каждый HTTP-запрос к МОБИЛОН


def safe_urlencode(params):
    parts = []
    for k, v in params.items():
        parts.append(f"{urllib.parse.quote(str(k), safe='')}={urllib.parse.quote(str(v), safe=':/@')}")
    return '&'.join(parts)


def get_mobilon_base():
    domain = os.environ.get('MOBILON_DOMAIN', 'connect.mobilon.ru').strip().rstrip('/')
    return f'https://{domain}/api/call'


def resp(status, body):
    return {
        'statusCode': status,
        'headers': {**CORS_HEADERS, 'Content-Type': 'application/json'},
        'body': json.dumps(body, default=str, ensure_ascii=False),
    }


def mobilon_request(path, params):
    base = get_mobilon_base()
    qs = safe_urlencode(params)
    url = f'{base}/{path}?{qs}'
    req = urllib.request.Request(url, headers={'Accept': 'application/json, text/xml'})
    with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
        raw = r.read().decode('utf-8')
    return raw


def parse_xml_calls(xml_str):
    """Парсим XML-ответ от Мобилон в список словарей."""
    root = ET.fromstring(xml_str)
    calls = []
    elements = root.findall('call') if root.tag == 'calls' else [root]
    for c in elements:
        calls.append({tag: (c.find(tag).text or '') for tag in [
            'callid', 'status', 'record_url', 'has_record',
            'duration', 'from', 'direction', 'to', 'time',
            'operator_id', 'subscriber_id'
        ] if c.find(tag) is not None})
    return calls


def normalize_direction(raw_direction, status, duration):
    """OUTGOING → out, INCOMING → in, пропущенный если статус не ANSWERED."""
    d = str(raw_direction).upper()
    s = str(status).upper()
    dur = int(duration) if str(duration).isdigit() else 0

    if s in ('NOANSWER', 'NO ANSWER', 'BUSY', 'FAILED', 'CANCEL') or (dur == 0 and s != 'ANSWERED'):
        return 'missed'
    if d == 'OUTGOING':
        return 'out'
    return 'in'


def format_call(c, token):
    direction = normalize_direction(
        c.get('direction', ''),
        c.get('status', ''),
        c.get('duration', 0),
    )
    duration = int(c.get('duration', 0)) if str(c.get('duration', 0)).isdigit() else 0
    phone = c.get('to', '') if direction == 'out' else c.get('from', '')

    record_url = None
    if c.get('has_record') == '1' and c.get('callid'):
        # API возвращает относительный путь вида /api/call/record?token=...&callid=...
        # Берём его и достраиваем хост, либо строим сами если поле пустое
        raw_record = c.get('record_url', '')
        domain = os.environ.get('MOBILON_DOMAIN', 'connect.mobilon.ru').strip().rstrip('/')
        if raw_record and raw_record.startswith('/'):
            record_url = f"https://{domain}{raw_record}"
        else:
            record_url = f"https://{domain}/api/call/record?token={token}&callid={c['callid']}"

    return {
        'id': c.get('callid', ''),
        'phone': phone,
        'src': c.get('from', ''),
        'dst': c.get('to', ''),
        'direction': direction,
        'duration': duration,
        'started_at': c.get('time', ''),
        'status': c.get('status', ''),
        'record_url': record_url,
        'has_record': c.get('has_record') == '1',
        'operator_id': c.get('operator_id', ''),
    }


def get_journal_for_date(token, date_str):
    """Получаем звонки за один день."""
    params = {'token': token, 'date': date_str, 'format': 'xml'}
    raw = mobilon_request('journal', params)
    return parse_xml_calls(raw)


def handler(event: dict, context) -> dict:
    """Обработчик звонков МОБИЛОН ВАТС."""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    params = event.get('queryStringParameters') or {}

    # ── Вебхук от МОБИЛОН ────────────────────────────────────────────────
    webhook_events = {'callStart', 'callEnd', 'callAnswer', 'callHold', 'callTransfer',
                      'call_start', 'call_end', 'call_answer', 'call_hold'}
    is_webhook = (
        params.get('event') in webhook_events
        or params.get('callid') is not None
        or params.get('call_id') is not None
    )
    if is_webhook:
        print(f"[MOBILON WEBHOOK] {json.dumps(params, ensure_ascii=False)}")
        return {
            'statusCode': 200,
            'headers': {**CORS_HEADERS, 'Content-Type': 'text/plain'},
            'body': 'ok',
        }

    token = os.environ.get('MOBILON_API_TOKEN', '')
    userkey = os.environ.get('MOBILON_USER_KEY', '')

    if not token or not userkey:
        return resp(200, {
            'calls': [], 'error': 'not_configured',
            'stats': {'total': 0, 'incoming': 0, 'outgoing': 0, 'missed': 0}
        })

    action = params.get('action', 'list')

    # ── Ping ──────────────────────────────────────────────────────────────
    if action == 'ping':
        today = datetime.now().strftime('%Y-%m-%d')
        token_preview = f"{token[:6]}...{token[-4:]}" if len(token) > 10 else f"[{len(token)} символов]"
        base = get_mobilon_base()
        domain = os.environ.get('MOBILON_DOMAIN', 'connect.mobilon.ru').strip().rstrip('/')

        results = []

        # Тест 1: CallToSubscriber — проверяем userkey
        call_url = f"{base}/CallToSubscriber"
        call_params = {'key': userkey, 'outboundNumber': '00000000000'}
        qs = safe_urlencode(call_params)
        full_url = f"{call_url}?{qs}"
        safe_url = full_url.replace(userkey, f"{userkey[:3]}***")
        try:
            req = urllib.request.Request(full_url, headers={'Accept': 'application/json'})
            with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
                http_status = r.status
                raw = r.read().decode('utf-8')
            is_html = raw.strip().lower().startswith('<!doctype') or raw.strip().lower().startswith('<html')
            try:
                parsed = json.loads(raw)
                result_code = parsed.get('code', '')
                result_val = parsed.get('result', '')
                ok_codes = ('0', '1', '3', '4', '5')
                key_valid = str(result_code) in ok_codes
            except Exception:
                parsed = {}
                result_code = ''
                result_val = ''
                key_valid = False
            results.append({
                'name': 'CallToSubscriber (key check)',
                'url': safe_url,
                'http_status': http_status,
                'is_json': not is_html,
                'key_valid': key_valid,
                'result': result_val,
                'code': str(result_code),
                'preview': raw[:300],
            })
        except urllib.error.HTTPError as e:
            body = e.read().decode('utf-8') if e.fp else ''
            results.append({'name': 'CallToSubscriber (key check)', 'url': safe_url,
                            'http_status': e.code, 'is_json': False, 'key_valid': False,
                            'error': f"HTTP {e.code}: {e.reason}", 'preview': body[:200]})
        except Exception as e:
            results.append({'name': 'CallToSubscriber (key check)', 'url': safe_url,
                            'http_status': None, 'is_json': False, 'key_valid': False,
                            'error': str(e), 'preview': ''})

        # Тест 2: journal — проверяем token
        journal_url = f"{base}/journal"
        journal_params = {'token': token, 'date': today, 'format': 'xml', 'limit': '1'}
        qs2 = safe_urlencode(journal_params)
        full_url2 = f"{journal_url}?{qs2}"
        safe_url2 = full_url2.replace(token, f"{token[:6]}***")
        try:
            req2 = urllib.request.Request(full_url2, headers={'Accept': '*/*'})
            with urllib.request.urlopen(req2, timeout=TIMEOUT) as r2:
                http_status2 = r2.status
                raw2 = r2.read().decode('utf-8')
            is_html2 = raw2.strip().lower().startswith('<!doctype') or raw2.strip().lower().startswith('<html')
            results.append({'name': 'journal (token check)', 'url': safe_url2,
                            'http_status': http_status2, 'is_xml': not is_html2,
                            'preview': raw2[:300]})
        except Exception as e:
            results.append({'name': 'journal (token check)', 'url': safe_url2,
                            'http_status': None, 'is_xml': False, 'error': str(e), 'preview': ''})

        r0 = results[0] if results else {}
        api_ok = r0.get('is_json', False)
        key_ok = r0.get('key_valid', False)

        return resp(200, {
            'ok': api_ok,
            'key_valid': key_ok,
            'is_xml': any(r.get('is_xml', False) for r in results),
            'results': results,
            'debug': {
                'token_preview': token_preview,
                'token_len': len(token),
                'userkey': userkey,
                'date': today,
                'domain': domain,
                'base_url': base,
            }
        })

    # ── Call info by callid ───────────────────────────────────────────────
    if action == 'info':
        callid = params.get('callid', '')
        if not callid:
            return resp(400, {'error': 'callid required'})
        try:
            raw = mobilon_request('info', {'token': token, 'callid': callid, 'format': 'xml'})
            calls = parse_xml_calls(raw)
            return resp(200, {'call': format_call(calls[0], token) if calls else None})
        except Exception as e:
            return resp(200, {'error': str(e)})

    # ── List calls by date range (параллельные запросы) ───────────────────
    date_from = params.get('date_from', '')
    date_to = params.get('date_to', '')

    if not date_from:
        date_from = (datetime.now() - timedelta(days=6)).strftime('%Y-%m-%d')
    if not date_to:
        date_to = datetime.now().strftime('%Y-%m-%d')

    try:
        # Собираем список дат
        dates = []
        d = datetime.strptime(date_from, '%Y-%m-%d')
        d_end = datetime.strptime(date_to, '%Y-%m-%d')
        while d <= d_end:
            dates.append(d.strftime('%Y-%m-%d'))
            d += timedelta(days=1)

        # Запрашиваем все дни параллельно (макс 7 потоков)
        all_raw = []
        with ThreadPoolExecutor(max_workers=min(len(dates), 7)) as executor:
            futures = {executor.submit(get_journal_for_date, token, date): date for date in dates}
            for future in as_completed(futures):
                try:
                    all_raw.extend(future.result())
                except Exception:
                    pass

        all_raw.sort(key=lambda c: c.get('time', ''), reverse=True)

        calls = [format_call(c, token) for c in all_raw]

        total = len(calls)
        incoming = sum(1 for c in calls if c['direction'] == 'in')
        outgoing = sum(1 for c in calls if c['direction'] == 'out')
        missed = sum(1 for c in calls if c['direction'] == 'missed')

        return resp(200, {
            'calls': calls,
            'stats': {'total': total, 'incoming': incoming, 'outgoing': outgoing, 'missed': missed},
            'date_from': date_from,
            'date_to': date_to,
        })

    except Exception as e:
        return resp(200, {
            'error': str(e),
            'calls': [],
            'stats': {'total': 0, 'incoming': 0, 'outgoing': 0, 'missed': 0},
        })
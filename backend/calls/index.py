"""
Интеграция с МОБИЛОН ВАТС: история звонков по дням, запись разговоров.
API: https://connect.mobilon.ru/api/call/journal?token={token}&date={date}&format=json
"""
import json
import os
import urllib.request
import urllib.parse
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token, X-Session-Id',
    'Access-Control-Max-Age': '86400',
}

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
    qs = urllib.parse.urlencode(params)
    url = f'{base}/{path}?{qs}'
    req = urllib.request.Request(url, headers={'Accept': 'application/json, text/xml'})
    with urllib.request.urlopen(req, timeout=15) as r:
        raw = r.read().decode('utf-8')
    return raw


def parse_xml_calls(xml_str):
    """Парсим XML-ответ от Мобилон в список словарей."""
    root = ET.fromstring(xml_str)
    calls = []
    # root может быть <calls> или сам <call>
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

    # Запись: строим полный URL если есть
    record_url = None
    if c.get('has_record') == '1' and c.get('callid'):
        record_url = f"{MOBILON_BASE}/record?token={token}&callid={c['callid']}"

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


def get_journal_for_date(token, date_str, limit=None, offset=None):
    """Получаем звонки за один день."""
    params = {'token': token, 'date': date_str, 'format': 'xml'}
    if limit:
        params['limit'] = str(limit)
    if offset:
        params['offset'] = str(offset)
    raw = mobilon_request('journal', params)
    return parse_xml_calls(raw)


def handler(event: dict, context) -> dict:
    """Обработчик звонков МОБИЛОН ВАТС."""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    token = os.environ.get('MOBILON_API_TOKEN', '')
    userkey = os.environ.get('MOBILON_USER_KEY', '')

    if not token or not userkey:
        return resp(200, {
            'calls': [], 'error': 'not_configured',
            'stats': {'total': 0, 'incoming': 0, 'outgoing': 0, 'missed': 0}
        })

    params = event.get('queryStringParameters') or {}
    action = params.get('action', 'list')

    # ── Ping ──────────────────────────────────────────────────────────────
    if action == 'ping':
        today = datetime.now().strftime('%Y-%m-%d')
        token_preview = f"{token[:6]}...{token[-4:]}" if len(token) > 10 else f"[{len(token)} символов]"

        results = []
        base = get_mobilon_base()
        domain = os.environ.get('MOBILON_DOMAIN', 'connect.mobilon.ru').strip().rstrip('/')

        # Пробуем несколько вариантов — journal за сегодня и за вчера, callinfo
        yesterday = (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d')
        variants = [
            ('journal today',     f"{base}/journal", {'token': token, 'date': today,     'format': 'xml', 'limit': '1'}),
            ('journal yesterday', f"{base}/journal", {'token': token, 'date': yesterday, 'format': 'xml', 'limit': '1'}),
            ('callinfo test',     f"{base}/info",    {'token': token, 'callid': 'test',  'format': 'xml'}),
        ]

        for name, base_url, vparams in variants:
            qs = urllib.parse.urlencode(vparams)
            full_url = f"{base_url}?{qs}"
            safe_url = full_url.replace(token, f"{token[:6]}***")
            try:
                req = urllib.request.Request(full_url, headers={'Accept': '*/*'})
                with urllib.request.urlopen(req, timeout=10) as r:
                    http_status = r.status
                    raw = r.read().decode('utf-8')
                is_html = raw.strip().lower().startswith('<!doctype') or raw.strip().lower().startswith('<html')
                results.append({
                    'name': name,
                    'url': safe_url,
                    'http_status': http_status,
                    'is_xml': not is_html,
                    'preview': raw[:200],
                })
            except urllib.error.HTTPError as e:
                body = e.read().decode('utf-8') if e.fp else ''
                results.append({
                    'name': name,
                    'url': safe_url,
                    'http_status': e.code,
                    'is_xml': False,
                    'preview': body[:200],
                    'error': f"HTTP {e.code}: {e.reason}",
                })
            except Exception as e:
                results.append({
                    'name': name,
                    'url': safe_url,
                    'http_status': None,
                    'is_xml': False,
                    'preview': '',
                    'error': str(e),
                })

        any_xml = any(r['is_xml'] for r in results)
        return resp(200, {
            'ok': True,
            'is_xml': any_xml,
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

    # ── List calls by date range ──────────────────────────────────────────
    date_from = params.get('date_from', '')
    date_to = params.get('date_to', '')

    if not date_from:
        date_from = (datetime.now() - timedelta(days=6)).strftime('%Y-%m-%d')
    if not date_to:
        date_to = datetime.now().strftime('%Y-%m-%d')

    try:
        # Перебираем каждый день в диапазоне и собираем звонки
        all_raw = []
        d = datetime.strptime(date_from, '%Y-%m-%d')
        d_end = datetime.strptime(date_to, '%Y-%m-%d')
        while d <= d_end:
            try:
                day_calls = get_journal_for_date(token, d.strftime('%Y-%m-%d'))
                all_raw.extend(day_calls)
            except Exception:
                pass
            d += timedelta(days=1)

        # Сортируем по времени (новые первые)
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
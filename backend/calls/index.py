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

MOBILON_BASE = 'https://connect.mobilon.ru/api/call'


def resp(status, body):
    return {
        'statusCode': status,
        'headers': {**CORS_HEADERS, 'Content-Type': 'application/json'},
        'body': json.dumps(body, default=str, ensure_ascii=False),
    }


def mobilon_request(path, params):
    qs = urllib.parse.urlencode(params)
    url = f'{MOBILON_BASE}/{path}?{qs}'
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
        userkey_val = userkey

        # Строим точный URL для диагностики
        test_params = {'token': token, 'date': today, 'format': 'xml', 'limit': '1'}
        qs = urllib.parse.urlencode(test_params)
        debug_url = f"{MOBILON_BASE}/journal?{qs}"
        safe_url = debug_url.replace(token, f"{token[:6]}***")

        try:
            raw = mobilon_request('journal', test_params)
            is_html = raw.strip().startswith('<!')
            return resp(200, {
                'ok': True,
                'is_xml': not is_html,
                'raw_preview': raw[:300],
                'debug': {
                    'url': safe_url,
                    'token_preview': token_preview,
                    'token_len': len(token),
                    'userkey': userkey_val,
                    'date': today,
                }
            })
        except Exception as e:
            return resp(200, {
                'ok': False,
                'error': str(e),
                'debug': {
                    'url': safe_url,
                    'token_preview': token_preview,
                    'token_len': len(token),
                    'userkey': userkey_val,
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
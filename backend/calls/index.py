"""
Интеграция с МОБИЛОН ВАТС: история звонков, запись разговоров.
"""
import json
import os
import urllib.request
import urllib.parse
from datetime import datetime, timedelta

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token, X-Session-Id',
    'Access-Control-Max-Age': '86400',
}

MOBILON_BASE = 'https://lk.mobilon.ru/api'


def resp(status, body):
    return {
        'statusCode': status,
        'headers': {**CORS_HEADERS, 'Content-Type': 'application/json'},
        'body': json.dumps(body, default=str, ensure_ascii=False),
    }


def mobilon_get(path, params=None):
    token = os.environ.get('MOBILON_API_TOKEN', '')
    userkey = os.environ.get('MOBILON_USER_KEY', '')
    base_params = {'token': token, 'userkey': userkey}
    if params:
        base_params.update(params)
    qs = urllib.parse.urlencode(base_params)
    url = f'{MOBILON_BASE}/{path}?{qs}'
    req = urllib.request.Request(url, headers={'Accept': 'application/json'})
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read().decode('utf-8'))


def normalize_direction(call):
    """Определяем направление звонка по полям Мобилон."""
    # Мобилон: type=1 входящий, type=2 исходящий, disposition=NOANSWER — пропущенный
    disposition = str(call.get('disposition', '')).upper()
    if disposition in ('NOANSWER', 'NO ANSWER', 'BUSY', 'FAILED'):
        return 'missed'
    call_type = str(call.get('type', call.get('calltype', '')))
    if call_type == '2':
        return 'out'
    return 'in'


def format_call(c):
    duration_raw = c.get('duration', c.get('billsec', 0))
    try:
        duration = int(duration_raw)
    except (TypeError, ValueError):
        duration = 0

    # Время начала: Мобилон возвращает unix timestamp или строку
    started_raw = c.get('calldate', c.get('start', c.get('starttime', '')))
    try:
        ts = int(started_raw)
        started_at = datetime.utcfromtimestamp(ts).isoformat()
    except (TypeError, ValueError):
        started_at = str(started_raw)

    direction = normalize_direction(c)
    if direction != 'missed' and duration == 0:
        direction = 'missed'

    src = str(c.get('src', c.get('caller', c.get('from', ''))))
    dst = str(c.get('dst', c.get('called', c.get('to', ''))))
    phone = dst if direction == 'out' else src

    record_file = c.get('recordfile', c.get('record', c.get('recording', '')))

    return {
        'id': str(c.get('uniqueid', c.get('id', c.get('callid', '')))),
        'phone': phone,
        'src': src,
        'dst': dst,
        'direction': direction,
        'duration': duration,
        'started_at': started_at,
        'record_file': str(record_file) if record_file else None,
        'disposition': str(c.get('disposition', '')),
    }


def handler(event: dict, context) -> dict:
    """Обработчик звонков МОБИЛОН."""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    token = os.environ.get('MOBILON_API_TOKEN', '')
    userkey = os.environ.get('MOBILON_USER_KEY', '')

    if not token or not userkey:
        return resp(200, {'calls': [], 'error': 'not_configured', 'message': 'Мобилон не настроен'})

    params = event.get('queryStringParameters') or {}
    action = params.get('action', 'list')

    if action == 'ping':
        # Проверяем соединение с API
        try:
            data = mobilon_get('info')
            return resp(200, {'ok': True, 'data': data})
        except Exception as e:
            return resp(200, {'ok': False, 'error': str(e)})

    if action == 'record':
        # Получаем ссылку на запись звонка
        record_file = params.get('file', '')
        if not record_file:
            return resp(400, {'error': 'file required'})
        try:
            data = mobilon_get('cdr/record', {'file': record_file})
            return resp(200, data)
        except Exception as e:
            return resp(500, {'error': str(e)})

    # action == 'list' — история звонков
    date_from = params.get('date_from', '')
    date_to = params.get('date_to', '')

    if not date_from:
        date_from = (datetime.now() - timedelta(days=7)).strftime('%Y-%m-%d')
    if not date_to:
        date_to = datetime.now().strftime('%Y-%m-%d')

    try:
        data = mobilon_get('cdr', {
            'date_from': date_from,
            'date_to': date_to,
            'limit': params.get('limit', '200'),
        })

        # Мобилон может вернуть список напрямую или в поле data/calls/records
        raw_calls = []
        if isinstance(data, list):
            raw_calls = data
        elif isinstance(data, dict):
            for key in ('data', 'calls', 'records', 'cdr', 'items'):
                if key in data and isinstance(data[key], list):
                    raw_calls = data[key]
                    break

        calls = [format_call(c) for c in raw_calls]

        # Статистика
        total = len(calls)
        incoming = sum(1 for c in calls if c['direction'] == 'in')
        outgoing = sum(1 for c in calls if c['direction'] == 'out')
        missed = sum(1 for c in calls if c['direction'] == 'missed')

        return resp(200, {
            'calls': calls,
            'stats': {
                'total': total,
                'incoming': incoming,
                'outgoing': outgoing,
                'missed': missed,
            },
            'date_from': date_from,
            'date_to': date_to,
            'raw_sample': data if total == 0 else None,
        })

    except Exception as e:
        return resp(200, {'error': str(e), 'calls': [], 'stats': {'total': 0, 'incoming': 0, 'outgoing': 0, 'missed': 0}})
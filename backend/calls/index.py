"""
Локальный HTTP-сервер для интеграции с МОБИЛОН ВАТС.

Запуск:
    python index.py

Переменные окружения (создай файл .env рядом или задай в системе):
    DATABASE_URL        — строка подключения к PostgreSQL
    MOBILON_API_TOKEN   — токен для journal API Мобилон
    MOBILON_USER_KEY    — ключ для CallToSubscriber API
    MOBILON_DOMAIN      — домен Мобилон (по умолчанию connect.mobilon.ru)
    OPENAI_API_KEY      — ключ OpenAI для расшифровки звонков
    PORT                — порт сервера (по умолчанию 5173)

URL для вебхука в настройках Мобилон:
    http://<ВАШ_БЕЛЫЙ_IP>:5173/
"""

import json
import os
import re
import io
import ssl
import urllib.request
import urllib.parse
import urllib.error
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta
from concurrent.futures import ThreadPoolExecutor, as_completed
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

# ── .env поддержка ────────────────────────────────────────────────────────────
_env_path = os.path.join(os.path.dirname(__file__), '.env')
if os.path.exists(_env_path):
    with open(_env_path, encoding='utf-8') as _f:
        for _line in _f:
            _line = _line.strip()
            if _line and not _line.startswith('#') and '=' in _line:
                _k, _v = _line.split('=', 1)
                os.environ.setdefault(_k.strip(), _v.strip())

# ── SSL context (fixes Windows cert verify) ────────────────────────────────────

_SSL_CTX = ssl._create_unverified_context()
ssl._create_default_https_context = ssl._create_unverified_context

TIMEOUT = 8
SCHEMA = 't_p82967824_project_development_'
PORT = int(os.environ.get('PORT', 5173))


def _urlopen(req, timeout=TIMEOUT):
    """SSL-safe urllib wrapper — disables cert verify for Windows compat."""
    return urllib.request.urlopen(req, timeout=timeout,
        context=_SSL_CTX if req.get_full_url().startswith('https') else None)


def _urlopen(req, timeout=TIMEOUT):
    """SSL-safe urllib wrapper — disables cert verify for Windows compat."""
    return urllib.request.urlopen(req, timeout=timeout,
        context=_SSL_CTX if req.get_full_url().startswith('https') else None)


CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token, X-Session-Id',
    'Access-Control-Max-Age': '86400',
}

SCHEMA = 't_p82967824_project_development_'
PORT = int(os.environ.get('PORT', 5173))


# ── DB ────────────────────────────────────────────────────────────────────────

def get_db():
    import psycopg2
    return psycopg2.connect(os.environ['DATABASE_URL'])


# ── Mobilon helpers ───────────────────────────────────────────────────────────

def safe_urlencode(params):
    parts = []
    for k, v in params.items():
        parts.append(f"{urllib.parse.quote(str(k), safe='')}={urllib.parse.quote(str(v), safe=':/@')}")
    return '&'.join(parts)


def get_mobilon_base():
    domain = os.environ.get('MOBILON_DOMAIN', 'connect.mobilon.ru').strip().rstrip('/')
    return f'https://{domain}/api/call'


def mobilon_request(path, params):
    base = get_mobilon_base()
    qs = safe_urlencode(params)
    url = f'{base}/{path}?{qs}'
    req = urllib.request.Request(url, headers={'Accept': 'application/json, text/xml'})
    with _urlopen(req, timeout=TIMEOUT) as r:
        return r.read().decode('utf-8')


def parse_xml_calls(xml_str):
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
    d = str(raw_direction).upper()
    s = str(status).upper()
    dur = int(duration) if str(duration).isdigit() else 0
    if s in ('NOANSWER', 'NO ANSWER', 'BUSY', 'FAILED', 'CANCEL') or (dur == 0 and s != 'ANSWERED'):
        return 'missed'
    if d in ('OUTGOING', 'EXTERNAL'):
        return 'out'
    return 'in'


def format_call(c, token):
    direction = normalize_direction(c.get('direction', ''), c.get('status', ''), c.get('duration', 0))
    duration = int(c.get('duration', 0)) if str(c.get('duration', 0)).isdigit() else 0
    phone = c.get('to', '') if direction == 'out' else c.get('from', '')
    record_url = None
    if c.get('has_record') == '1' and c.get('callid'):
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
    params = {'token': token, 'date': date_str, 'format': 'xml'}
    raw = mobilon_request('journal', params)
    return parse_xml_calls(raw)


# ── Webhook → DB ──────────────────────────────────────────────────────────────

def save_webhook_to_db(data: dict):
    """Сохраняет или обновляет вебхук-событие в таблице calls."""
    mobilon_id = data.get('baseid') or data.get('callid') or data.get('uuid')
    if not mobilon_id:
        return

    phone_from = data.get('from', '')
    phone_to = data.get('to', '')
    direction_raw = data.get('direction', 'incoming').lower()
    state = data.get('state', '').upper()
    callstatus = data.get('callstatus', '').upper()
    duration_raw = data.get('duration', '0')
    duration = int(duration_raw) if str(duration_raw).isdigit() else 0
    started_at = data.get('time')
    started_at = int(started_at) if started_at and str(started_at).isdigit() else None
    uuid = data.get('uuid', '')
    subid = data.get('subid', '')
    userkey = data.get('userkey', '')

    is_internal_number = lambda n: bool(re.fullmatch(r'\d{1,3}', str(n).strip()))
    if is_internal_number(phone_from) and is_internal_number(phone_to):
        print(f"[WEBHOOK] skip internal-to-internal: from={phone_from} to={phone_to}")
        return
    if direction_raw == 'internal':
        print(f"[WEBHOOK] skip internal direction: from={phone_from} to={phone_to}")
        return

    is_final = state in ('HANGUP', 'END')

    if direction_raw in ('outgoing', 'external'):
        direction = 'out'
        phone = phone_to
    elif direction_raw == 'incoming':
        direction = 'missed' if is_final and callstatus != 'ANSWER' else 'in'
        phone = phone_from
    else:
        direction = 'in'
        phone = phone_from

    print(f"[WEBHOOK] mobilon_id={mobilon_id} raw_dir={direction_raw} state={state} callstatus={callstatus} dur={duration} -> direction={direction} phone={phone}")

    conn = get_db()
    try:
        cur = conn.cursor()
        cur.execute(f"""
            INSERT INTO {SCHEMA}.calls
                (mobilon_id, phone, src, dst, direction, duration, started_at, state, uuid, subid, userkey, raw)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (mobilon_id) DO UPDATE SET
                state = EXCLUDED.state,
                duration = EXCLUDED.duration,
                direction = EXCLUDED.direction,
                phone = EXCLUDED.phone,
                raw = EXCLUDED.raw
        """, (
            mobilon_id, phone, phone_from, phone_to,
            direction, duration, started_at,
            state, uuid, subid, userkey,
            json.dumps(data, ensure_ascii=False)
        ))
        conn.commit()
    finally:
        conn.close()

    if is_final and direction == 'in' and duration and duration > 10:
        record_url = data.get('recordUrl') or data.get('record_url')
        if record_url:
            import threading
            threading.Thread(target=auto_transcribe, args=(mobilon_id, record_url), daemon=True).start()


# ── Transcription ─────────────────────────────────────────────────────────────

def _make_ai_client(api_key: str):
    from openai import OpenAI
    import httpx
    http = httpx.Client(verify=False)
    return OpenAI(api_key=api_key, base_url='https://api.laozhang.ai/v1', http_client=http)


def auto_transcribe(mobilon_id: str, record_url: str):
    openai_key = os.environ.get('OPENAI_API_KEY', '')
    if not openai_key:
        print(f"[AUTO TRANSCRIBE] OPENAI_API_KEY not set, skip")
        return

    conn = get_db()
    try:
        cur = conn.cursor()
        cur.execute(f"SELECT transcript_status FROM {SCHEMA}.calls WHERE mobilon_id = %s LIMIT 1", (mobilon_id,))
        row = cur.fetchone()
        if row and row[0] == 'done':
            return
        cur.execute(f"UPDATE {SCHEMA}.calls SET transcript_status = 'pending' WHERE mobilon_id = %s", (mobilon_id,))
        conn.commit()
    finally:
        conn.close()

    print(f"[AUTO TRANSCRIBE] starting for {mobilon_id}")
    try:
        req = urllib.request.Request(record_url, headers={'User-Agent': 'Mozilla/5.0'})
        with _urlopen(req, timeout=30) as r:
            audio_data = r.read()
    except Exception as e:
        print(f"[AUTO TRANSCRIBE] download failed: {e}")
        return

    ai_client = _make_ai_client(openai_key)
    try:
        result = ai_client.audio.transcriptions.create(
            model='whisper-1',
            file=('call.mp3', io.BytesIO(audio_data), 'audio/mpeg'),
            language='ru',
        )
        text = result.text.strip()
    except Exception as e:
        print(f"[AUTO TRANSCRIBE] whisper failed: {e}")
        return

    if not text:
        return

    structured = structure_transcript(text, openai_key)

    conn2 = get_db()
    try:
        cur2 = conn2.cursor()
        cur2.execute(
            f"UPDATE {SCHEMA}.calls SET transcript = %s, transcript_status = 'done' WHERE mobilon_id = %s",
            (text, mobilon_id)
        )
        cur2.execute(f"""
            SELECT id FROM {SCHEMA}.calls WHERE mobilon_id = %s LIMIT 1
        """, (mobilon_id,))
        row = cur2.fetchone()
        if row:
            cur2.execute(f"""
                INSERT INTO {SCHEMA}.call_transcripts
                    (call_id, mobilon_id, transcript_raw, transcript_structured)
                VALUES (%s, %s, %s, %s)
                ON CONFLICT DO NOTHING
            """, (row[0], mobilon_id, text, json.dumps(structured, ensure_ascii=False)))
        conn2.commit()
        print(f"[AUTO TRANSCRIBE] done for {mobilon_id}, len={len(text)}")
    finally:
        conn2.close()


def structure_transcript(text: str, openai_key: str) -> list:
    ai = _make_ai_client(openai_key)
    prompt = (
        "Перед тобой расшифровка телефонного разговора между оператором автосервиса и клиентом.\n"
        "Раздели текст на реплики. Для каждой реплики определи: кто говорит (оператор или клиент).\n\n"
        "Верни JSON массив объектов в формате:\n"
        '[{"speaker":"Оператор","role":"operator","text":"..."},{"speaker":"Клиент","role":"client","text":"..."}]\n\n'
        "Правила:\n"
        "- role: 'operator' для сотрудника автосервиса, 'client' для клиента\n"
        "- Не меняй слова, только разбей на реплики\n"
        "- Если не можешь определить кто говорит — role: 'unknown', speaker: 'Неизвестно'\n"
        "- Верни ТОЛЬКО JSON массив, без пояснений\n\n"
        f"Текст разговора:\n{text}"
    )
    try:
        r = ai.chat.completions.create(
            model='gpt-4o-mini',
            messages=[{'role': 'user', 'content': prompt}],
            temperature=0.1,
            max_tokens=4000,
        )
        raw = r.choices[0].message.content.strip()
        if raw.startswith('```'):
            raw = raw.split('```')[1]
            if raw.startswith('json'):
                raw = raw[4:]
        return json.loads(raw)
    except Exception as e:
        print(f"[structure_transcript] error: {e}")
        return []


# ── DB query helpers ──────────────────────────────────────────────────────────

def db_calls_to_list(rows):
    result = []
    for r in rows:
        raw = r[10] or {}
        record_url = raw.get('recordUrl') or raw.get('record_url') or None
        has_record = bool(record_url)
        structured = r[14] if len(r) > 14 and r[14] else None
        result.append({
            'id': r[1] or str(r[0]),
            'phone': r[2] or '',
            'src': r[3] or '',
            'dst': r[4] or '',
            'direction': r[5] or 'in',
            'duration': r[6] or 0,
            'started_at': str(r[7]) if r[7] else '',
            'state': r[8] or '',
            'uuid': r[9] or '',
            'source': 'webhook',
            'has_record': has_record,
            'record_url': record_url,
            'status': r[8] or '',
            'operator_id': '',
            'client_name': r[11] or None,
            'transcript': r[12] or None,
            'transcript_status': r[13] or 'none',
            'transcript_structured': structured,
        })
    return result


# ── Action handlers ───────────────────────────────────────────────────────────

def handle_list_db(params: dict) -> dict:
    date_from = params.get('date_from', '')
    date_to = params.get('date_to', '')
    if not date_from:
        date_from = (datetime.now() - timedelta(days=6)).strftime('%Y-%m-%d')
    if not date_to:
        date_to = datetime.now().strftime('%Y-%m-%d')

    ts_from = int(datetime.strptime(date_from, '%Y-%m-%d').timestamp())
    ts_to = int((datetime.strptime(date_to, '%Y-%m-%d') + timedelta(days=1)).timestamp())

    conn = get_db()
    try:
        cur = conn.cursor()
        cur.execute(f"""
            SELECT c.id, c.mobilon_id, c.phone, c.src, c.dst, c.direction, c.duration,
                   c.started_at, c.state, c.uuid, c.raw,
                   cl.name AS client_name,
                   c.transcript, c.transcript_status,
                   ct.transcript_structured
            FROM {SCHEMA}.calls c
            LEFT JOIN {SCHEMA}.clients cl
                ON right(regexp_replace(cl.phone, '[^0-9]', '', 'g'), 10) =
                   right(regexp_replace(c.phone, '[^0-9]', '', 'g'), 10)
            LEFT JOIN {SCHEMA}.call_transcripts ct ON ct.mobilon_id = c.mobilon_id
            WHERE c.started_at >= {ts_from} AND c.started_at < {ts_to}
              AND NOT (c.src ~ '^\\d{{1,3}}$' AND c.dst ~ '^\\d{{1,3}}$')
              AND (c.raw->>'direction') != 'internal'
            ORDER BY c.started_at DESC
            LIMIT 500
        """)
        rows = cur.fetchall()
    finally:
        conn.close()

    calls = db_calls_to_list(rows)
    return {
        'calls': calls,
        'stats': {
            'total': len(calls),
            'incoming': sum(1 for c in calls if c['direction'] == 'in'),
            'outgoing': sum(1 for c in calls if c['direction'] == 'out'),
            'missed': sum(1 for c in calls if c['direction'] == 'missed'),
        },
        'date_from': date_from,
        'date_to': date_to,
        'source': 'db',
    }


def handle_active() -> dict:
    conn = get_db()
    try:
        cur = conn.cursor()
        cur.execute(f"""
            SELECT c.id, c.mobilon_id, c.phone, c.src, c.dst, c.direction,
                   c.state, c.started_at, c.raw,
                   cl.name AS client_name
            FROM {SCHEMA}.calls c
            LEFT JOIN {SCHEMA}.clients cl
                ON right(regexp_replace(cl.phone, '[^0-9]', '', 'g'), 10) =
                   right(regexp_replace(c.phone, '[^0-9]', '', 'g'), 10)
            WHERE c.created_at >= NOW() - INTERVAL '60 seconds'
              AND (c.raw->>'direction') = 'incoming'
              AND c.state NOT IN ('HANGUP', 'END')
              AND NOT (c.src ~ '^\\d{{1,3}}$' AND c.dst ~ '^\\d{{1,3}}$')
            ORDER BY c.created_at DESC
            LIMIT 1
        """)
        row = cur.fetchone()
    finally:
        conn.close()

    if row:
        return {
            'active': True,
            'call': {
                'id': row[1] or str(row[0]),
                'phone': row[2] or '',
                'src': row[3] or '',
                'dst': row[4] or '',
                'direction': row[5] or 'in',
                'state': row[6] or '',
                'started_at': str(row[7]) if row[7] else '',
                'client_name': row[9] or None,
            }
        }
    return {'active': False, 'call': None}


def handle_calls_by_phone(params: dict) -> dict:
    phone = params.get('phone', '').strip()
    if not phone:
        return {'error': 'phone is required'}
    conn = get_db()
    try:
        cur = conn.cursor()
        cur.execute(f"""
            SELECT c.id, c.mobilon_id, c.phone, c.src, c.dst, c.direction, c.duration,
                   c.started_at, c.state, c.uuid, c.raw,
                   NULL AS client_name,
                   c.transcript, c.transcript_status,
                   ct.transcript_structured
            FROM {SCHEMA}.calls c
            LEFT JOIN {SCHEMA}.call_transcripts ct ON ct.mobilon_id = c.mobilon_id
            WHERE right(regexp_replace(c.phone, '[^0-9]', '', 'g'), 10) =
                  right(regexp_replace(%s, '[^0-9]', '', 'g'), 10)
            ORDER BY c.started_at DESC
            LIMIT 100
        """, (phone,))
        rows = cur.fetchall()
    finally:
        conn.close()
    return {'calls': db_calls_to_list(rows)}


def handle_transcribe(params: dict) -> tuple:
    """Возвращает (status_code, body_dict)."""

    call_id = params.get('call_id', '').strip()
    if not call_id:
        return 400, {'error': 'call_id is required'}

    openai_key = os.environ.get('OPENAI_API_KEY', '')
    if not openai_key:
        return 500, {'error': 'OPENAI_API_KEY not configured'}

    conn = get_db()
    try:
        cur = conn.cursor()
        cur.execute(
            f"SELECT id, mobilon_id, phone, src, dst, direction, duration, started_at, raw, transcript, transcript_status "
            f"FROM {SCHEMA}.calls WHERE mobilon_id = %s LIMIT 1",
            (call_id,)
        )
        row = cur.fetchone()
        if not row:
            return 404, {'error': 'call not found'}
        db_id, mobilon_id, phone, src, dst, direction, duration, started_at, raw, transcript, transcript_status = row
        cur.execute(
            f"SELECT transcript_raw, transcript_structured FROM {SCHEMA}.call_transcripts WHERE mobilon_id = %s LIMIT 1",
            (mobilon_id,)
        )
        cached = cur.fetchone()
    finally:
        conn.close()

    if cached and cached[0]:
        structured = cached[1] if cached[1] else []
        return 200, {'transcript': cached[0], 'structured': structured, 'cached': True}

    if transcript and transcript_status == 'done':
        return 200, {'transcript': transcript, 'structured': [], 'cached': True}

    record_url = (raw or {}).get('recordUrl') or (raw or {}).get('record_url')
    if not record_url:
        return 400, {'error': 'no_record', 'message': 'Запись разговора недоступна'}

    try:
        req = urllib.request.Request(record_url, headers={'User-Agent': 'Mozilla/5.0'})
        with _urlopen(req, timeout=30) as r:
            audio_data = r.read()
    except Exception as e:
        return 502, {'error': 'download_failed', 'message': str(e)}

    ai_client = _make_ai_client(openai_key)
    try:
        result = ai_client.audio.transcriptions.create(
            model='whisper-1',
            file=('call.mp3', io.BytesIO(audio_data), 'audio/mpeg'),
            language='ru',
        )
        text = result.text.strip()
    except Exception as e:
        return 502, {'error': 'whisper_failed', 'message': str(e)}

    if not text:
        return 200, {'transcript': '', 'structured': [], 'error': 'empty_transcript'}

    structured = structure_transcript(text, openai_key)

    conn2 = get_db()
    try:
        cur2 = conn2.cursor()
        cur2.execute(
            f"UPDATE {SCHEMA}.calls SET transcript = %s, transcript_status = 'done' WHERE id = %s",
            (text, db_id)
        )
        cur2.execute(
            f"""INSERT INTO {SCHEMA}.call_transcripts
                (call_id, mobilon_id, phone, dst, direction, started_at, duration, transcript_raw, transcript_structured)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT DO NOTHING""",
            (db_id, mobilon_id, phone or src, dst, direction, started_at, duration,
             text, json.dumps(structured, ensure_ascii=False))
        )
        conn2.commit()
    finally:
        conn2.close()

    return 200, {'transcript': text, 'structured': structured, 'cached': False}


def handle_ping() -> dict:
    token = os.environ.get('MOBILON_API_TOKEN', '')
    userkey = os.environ.get('MOBILON_USER_KEY', '')
    today = datetime.now().strftime('%Y-%m-%d')
    token_preview = f"{token[:6]}...{token[-4:]}" if len(token) > 10 else f"[{len(token)} символов]"
    base = get_mobilon_base()
    domain = os.environ.get('MOBILON_DOMAIN', 'connect.mobilon.ru').strip().rstrip('/')
    results = []

    call_url = f"{base}/CallToSubscriber"
    call_params = {'key': userkey, 'outboundNumber': '00000000000'}
    qs = safe_urlencode(call_params)
    full_url = f"{call_url}?{qs}"
    safe_url = full_url.replace(userkey, f"{userkey[:3]}***")
    try:
        req = urllib.request.Request(full_url, headers={'Accept': 'application/json'})
        with _urlopen(req, timeout=TIMEOUT) as r:
            http_status = r.status
            raw = r.read().decode('utf-8')
        is_html = raw.strip().lower().startswith('<!doctype') or raw.strip().lower().startswith('<html')
        try:
            parsed = json.loads(raw)
            result_code = parsed.get('code', '')
            result_val = parsed.get('result', '')
            key_valid = str(result_code) in ('0', '1', '3', '4', '5')
        except Exception:
            parsed, result_code, result_val, key_valid = {}, '', '', False
        results.append({'name': 'CallToSubscriber (key check)', 'url': safe_url,
                        'http_status': http_status, 'is_json': not is_html,
                        'key_valid': key_valid, 'result': result_val, 'code': str(result_code), 'preview': raw[:300]})
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8') if e.fp else ''
        results.append({'name': 'CallToSubscriber (key check)', 'url': safe_url,
                        'http_status': e.code, 'is_json': False, 'key_valid': False,
                        'error': f"HTTP {e.code}: {e.reason}", 'preview': body[:200]})
    except Exception as e:
        results.append({'name': 'CallToSubscriber (key check)', 'url': safe_url,
                        'http_status': None, 'is_json': False, 'key_valid': False, 'error': str(e), 'preview': ''})

    journal_url = f"{base}/journal"
    journal_params = {'token': token, 'date': today, 'format': 'xml', 'limit': '1'}
    qs2 = safe_urlencode(journal_params)
    full_url2 = f"{journal_url}?{qs2}"
    safe_url2 = full_url2.replace(token, f"{token[:6]}***")
    try:
        req2 = urllib.request.Request(full_url2, headers={'Accept': '*/*'})
        with _urlopen(req2, timeout=TIMEOUT) as r2:
            http_status2 = r2.status
            raw2 = r2.read().decode('utf-8')
        is_html2 = raw2.strip().lower().startswith('<!doctype') or raw2.strip().lower().startswith('<html')
        is_xml = raw2.strip().startswith('<')
        try:
            parsed_calls = parse_xml_calls(raw2)
            token_valid = True
            call_count = len(parsed_calls)
        except Exception:
            token_valid = not is_html2 and is_xml
            call_count = 0
        results.append({'name': 'Journal API (token check)', 'url': safe_url2,
                        'http_status': http_status2, 'is_xml': is_xml,
                        'token_valid': token_valid, 'call_count_today': call_count, 'preview': raw2[:300]})
    except urllib.error.HTTPError as e:
        body2 = e.read().decode('utf-8') if e.fp else ''
        results.append({'name': 'Journal API (token check)', 'url': safe_url2,
                        'http_status': e.code, 'is_xml': False, 'token_valid': False,
                        'error': f"HTTP {e.code}: {e.reason}", 'preview': body2[:200]})
    except Exception as e:
        results.append({'name': 'Journal API (token check)', 'url': safe_url2,
                        'http_status': None, 'is_xml': False, 'token_valid': False, 'error': str(e), 'preview': ''})

    key_check = next((r for r in results if 'key_valid' in r), {})
    token_check = next((r for r in results if 'token_valid' in r), {})
    return {
        'ok': key_check.get('key_valid', False) or token_check.get('token_valid', False),
        'token_preview': token_preview,
        'date': today,
        'domain': domain,
        'base_url': base,
        'results': results,
    }


def handle_list_api(params: dict) -> dict:
    token = os.environ.get('MOBILON_API_TOKEN', '')
    if not token:
        return {'calls': [], 'error': 'not_configured',
                'stats': {'total': 0, 'incoming': 0, 'outgoing': 0, 'missed': 0}}

    date_from = params.get('date_from', '') or (datetime.now() - timedelta(days=6)).strftime('%Y-%m-%d')
    date_to = params.get('date_to', '') or datetime.now().strftime('%Y-%m-%d')

    dates = []
    d = datetime.strptime(date_from, '%Y-%m-%d')
    d_end = datetime.strptime(date_to, '%Y-%m-%d')
    while d <= d_end:
        dates.append(d.strftime('%Y-%m-%d'))
        d += timedelta(days=1)

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
    return {
        'calls': calls,
        'stats': {
            'total': len(calls),
            'incoming': sum(1 for c in calls if c['direction'] == 'in'),
            'outgoing': sum(1 for c in calls if c['direction'] == 'out'),
            'missed': sum(1 for c in calls if c['direction'] == 'missed'),
        },
        'date_from': date_from,
        'date_to': date_to,
    }


# ── HTTP Server ───────────────────────────────────────────────────────────────

def make_response(status: int, body: dict) -> tuple:
    return status, json.dumps(body, default=str, ensure_ascii=False)


class CallsHandler(BaseHTTPRequestHandler):

    def log_message(self, format, *args):
        print(f"[HTTP] {self.address_string()} {format % args}")

    def send_json(self, status: int, body):
        payload = json.dumps(body, default=str, ensure_ascii=False).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(payload)))
        for k, v in CORS_HEADERS.items():
            self.send_header(k, v)
        self.end_headers()
        self.wfile.write(payload)

    def send_text(self, status: int, text: str):
        payload = text.encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'text/plain; charset=utf-8')
        self.send_header('Content-Length', str(len(payload)))
        for k, v in CORS_HEADERS.items():
            self.send_header(k, v)
        self.end_headers()
        self.wfile.write(payload)

    def do_OPTIONS(self):
        self.send_response(200)
        for k, v in CORS_HEADERS.items():
            self.send_header(k, v)
        self.end_headers()

    def _read_body(self) -> bytes:
        length = int(self.headers.get('Content-Length', 0))
        return self.rfile.read(length) if length > 0 else b''

    def _parse_params(self, query_string: str) -> dict:
        qs = parse_qs(query_string, keep_blank_values=True)
        return {k: v[0] if len(v) == 1 else v for k, v in qs.items()}

    def do_GET(self):
        parsed = urlparse(self.path)
        params = self._parse_params(parsed.query)
        self._dispatch('GET', params, {})

    def do_POST(self):
        parsed = urlparse(self.path)
        params = self._parse_params(parsed.query)
        body_raw = self._read_body()
        body_json = {}
        if body_raw:
            try:
                body_json = json.loads(body_raw)
            except Exception:
                pass
        self._dispatch('POST', params, body_json)

    def _dispatch(self, method: str, params: dict, body: dict):
        # ── Входящий вебхук от Мобилон (POST JSON или GET с параметрами) ──
        merged = {**params, **body}

        is_webhook_post = method == 'POST' and ('state' in body or 'baseid' in body)
        is_webhook_get = method == 'GET' and (
            params.get('state') is not None and (
                params.get('baseid') is not None or
                params.get('uuid') is not None or
                params.get('callid') is not None
            )
        )

        if is_webhook_post or is_webhook_get:
            print(f"[MOBILON WEBHOOK {method}] {json.dumps(merged, ensure_ascii=False)}")
            try:
                save_webhook_to_db(merged)
            except Exception as e:
                print(f"[WEBHOOK] DB error: {e}")
            self.send_text(200, 'ok')
            return

        # ── API запросы от фронтенда ──────────────────────────────────────
        action = params.get('action', 'list_db')

        try:
            if action == 'list_db':
                self.send_json(200, handle_list_db(params))

            elif action == 'active':
                self.send_json(200, handle_active())

            elif action == 'calls_by_phone':
                self.send_json(200, handle_calls_by_phone(params))

            elif action == 'transcribe':
                code, body_resp = handle_transcribe(params)
                self.send_json(code, body_resp)

            elif action == 'ping':
                self.send_json(200, handle_ping())

            elif action == 'raw_request':
                token = os.environ.get('MOBILON_API_TOKEN', '')
                userkey = os.environ.get('MOBILON_USER_KEY', '')
                domain = os.environ.get('MOBILON_DOMAIN', 'connect.mobilon.ru').strip().rstrip('/')
                raw_url = body.get('url', '').strip()
                if not raw_url:
                    self.send_json(400, {'error': 'url required'})
                    return
                full_url = raw_url.replace('{TOKEN}', token).replace('{KEY}', userkey).replace('{DOMAIN}', domain)
                safe_url = full_url.replace(token, '{TOKEN}').replace(userkey, '{KEY}')
                try:
                    req = urllib.request.Request(full_url, headers={'Accept': 'application/json, text/xml, */*'})
                    with _urlopen(req, timeout=TIMEOUT) as r:
                        http_status = r.status
                        raw = r.read().decode('utf-8')
                    try:
                        parsed_json = json.loads(raw)
                        self.send_json(200, {'url': safe_url, 'http_status': http_status, 'format': 'json', 'response': parsed_json})
                        return
                    except Exception:
                        pass
                    try:
                        root = ET.fromstring(raw)
                        def xml_to_dict(el):
                            d = {}
                            for child in el:
                                if len(child):
                                    if child.tag in d:
                                        if not isinstance(d[child.tag], list):
                                            d[child.tag] = [d[child.tag]]
                                        d[child.tag].append(xml_to_dict(child))
                                    else:
                                        d[child.tag] = xml_to_dict(child)
                                else:
                                    d[child.tag] = child.text or ''
                            return d
                        self.send_json(200, {'url': safe_url, 'http_status': http_status, 'format': 'xml',
                                             'response': xml_to_dict(root), 'raw': raw[:2000]})
                        return
                    except Exception:
                        pass
                    self.send_json(200, {'url': safe_url, 'http_status': http_status, 'format': 'text', 'response': raw[:3000]})
                except urllib.error.HTTPError as e:
                    body_err = e.read().decode('utf-8') if e.fp else ''
                    self.send_json(200, {'url': safe_url, 'http_status': e.code,
                                         'error': f"HTTP {e.code}: {e.reason}", 'response': body_err[:1000]})
                except Exception as e:
                    self.send_json(200, {'url': safe_url, 'error': str(e)})

            else:
                # По умолчанию — список из Mobilon API
                self.send_json(200, handle_list_api(params))

        except Exception as e:
            print(f"[ERROR] action={action}: {e}")
            import traceback
            traceback.print_exc()
            self.send_json(500, {'error': str(e)})


# ── Entry point ───────────────────────────────────────────────────────────────

def handler(event: dict, context) -> dict:
    """Заглушка для совместимости с облачной платформой — не используется при локальном запуске."""
    return {'statusCode': 200, 'body': 'use local server'}


if __name__ == '__main__':
    import socket as _sock

    webhook_url = os.environ.get('WEBHOOK_URL', f'http://YOUR_IP:{PORT}/')

    class ReuseHTTPServer(HTTPServer):
        allow_reuse_address = True

        def server_bind(self):
            self.socket.setsockopt(_sock.SOL_SOCKET, _sock.SO_REUSEADDR, 1)
            super().server_bind()

    server = ReuseHTTPServer(('0.0.0.0', PORT), CallsHandler)

    print()
    print('=' * 55)
    print('  MOBILON CALLS SERVER - LOCAL NETWORK')
    print('=' * 55)
    print(f'  Port:       0.0.0.0:{PORT}')
    print(f'  Webhook:    {webhook_url}')
    print(f'  Ping:      http://0.0.0.0:{PORT}/?action=ping')
    print(f'  List:      http://0.0.0.0:{PORT}/?action=list_db')
    print('=' * 55)
    print('  Mobilon webhook URL:')
    print(f'  {webhook_url}')
    print('=' * 55)
    print()
    print(f'  [OK] DB:     {os.environ.get("DATABASE_URL", "")[:50]}...')
    print(f'  [OK] Domain:  {get_mobilon_base()}')
    print(f'  [OK] Token:   {os.environ.get("MOBILON_API_TOKEN", "")[:6]}...')
    print(f'  [OK] Stop:    Ctrl+C or python run_server.py stop')
    print()

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\n  Сервер остановлен.')
        server.server_close()
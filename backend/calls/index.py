"""
Интеграция с МОБИЛОН ВАТС: история звонков по дням, запись разговоров.
Вебхуки от Мобилона сохраняются в таблицу calls.
API: https://connect.mobilon.ru/api/call/journal?token={token}&date={date}&format=xml
"""
import json
import os
import urllib.request
import urllib.parse
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta
from concurrent.futures import ThreadPoolExecutor, as_completed
import psycopg2

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token, X-Session-Id',
    'Access-Control-Max-Age': '86400',
}

TIMEOUT = 8
SCHEMA = 't_p82967824_project_development_'


def get_db():
    return psycopg2.connect(os.environ['DATABASE_URL'])


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
    direction = normalize_direction(
        c.get('direction', ''),
        c.get('status', ''),
        c.get('duration', 0),
    )
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

    # Игнорируем внутренние звонки (короткие номера до 3 цифр: 101, 104, 105 и т.д.)
    import re
    is_internal_number = lambda n: bool(re.fullmatch(r'\d{1,3}', str(n).strip()))
    if is_internal_number(phone_from) and is_internal_number(phone_to):
        print(f"[WEBHOOK] skip internal-to-internal: from={phone_from} to={phone_to}")
        return
    if direction_raw == 'internal':
        print(f"[WEBHOOK] skip internal direction: from={phone_from} to={phone_to}")
        return

    # Финальные состояния — HANGUP или END
    is_final = state in ('HANGUP', 'END')

    if direction_raw in ('outgoing', 'external'):
        direction = 'out'
        phone = phone_to
    elif direction_raw == 'incoming':
        if is_final and duration == 0 and callstatus != 'ANSWER':
            # Входящий, завершён без разговора — пропущенный
            direction = 'missed'
        else:
            direction = 'in'
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


def normalize_phone_digits(phone):
    import re
    digits = re.sub(r'\D', '', str(phone))
    if len(digits) == 11 and digits[0] in ('7', '8'):
        return '7' + digits[1:]
    if len(digits) == 10:
        return '7' + digits
    return digits


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


def structure_transcript(text: str, openai_key: str) -> list:
    """Структурирует текст расшифровки через GPT: разбивает на реплики оператора и клиента."""
    from openai import OpenAI
    ai = OpenAI(api_key=openai_key, base_url='https://api.laozhang.ai/v1')
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


def handle_transcribe(params: dict) -> dict:
    """Скачивает запись звонка, расшифровывает через Whisper, структурирует через GPT, сохраняет в call_transcripts."""
    import io
    from openai import OpenAI

    call_id = params.get('call_id', '').strip()
    if not call_id:
        return resp(400, {'error': 'call_id is required'})

    openai_key = os.environ.get('OPENAI_API_KEY', '')
    if not openai_key:
        return resp(500, {'error': 'OPENAI_API_KEY not configured'})

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
            return resp(404, {'error': 'call not found'})

        db_id, mobilon_id, phone, src, dst, direction, duration, started_at, raw, transcript, transcript_status = row

        # Проверяем кэш в call_transcripts
        cur.execute(
            f"SELECT transcript_raw, transcript_structured FROM {SCHEMA}.call_transcripts WHERE mobilon_id = %s LIMIT 1",
            (mobilon_id,)
        )
        cached = cur.fetchone()
    finally:
        conn.close()

    if cached and cached[0]:
        structured = cached[1] if cached[1] else []
        return resp(200, {'transcript': cached[0], 'structured': structured, 'cached': True})

    if transcript and transcript_status == 'done':
        return resp(200, {'transcript': transcript, 'structured': [], 'cached': True})

    record_url = (raw or {}).get('recordUrl') or (raw or {}).get('record_url')
    if not record_url:
        return resp(400, {'error': 'no_record', 'message': 'Запись разговора недоступна'})

    try:
        req = urllib.request.Request(record_url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=30) as r:
            audio_data = r.read()
    except Exception as e:
        return resp(502, {'error': 'download_failed', 'message': str(e)})

    ai_client = OpenAI(api_key=openai_key, base_url='https://api.laozhang.ai/v1')
    try:
        result = ai_client.audio.transcriptions.create(
            model='whisper-1',
            file=('call.mp3', io.BytesIO(audio_data), 'audio/mpeg'),
            language='ru',
        )
        text = result.text.strip()
    except Exception as e:
        return resp(502, {'error': 'whisper_failed', 'message': str(e)})

    if not text:
        return resp(200, {'transcript': '', 'structured': [], 'error': 'empty_transcript'})

    # Структурируем через GPT
    structured = structure_transcript(text, openai_key)

    # Сохраняем в calls и call_transcripts
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

    return resp(200, {'transcript': text, 'structured': structured, 'cached': False})


def handler(event: dict, context) -> dict:
    """Обработчик звонков МОБИЛОН ВАТС."""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    params = event.get('queryStringParameters') or {}

    # ── Вебхук от МОБИЛОН (POST с JSON-телом) ────────────────────────────
    # Мобилон шлёт: {"from":..., "to":..., "baseid":..., "state":..., "direction":..., ...}
    body_raw = event.get('body') or ''
    webhook_data = None
    if body_raw:
        try:
            webhook_data = json.loads(body_raw)
        except Exception:
            pass

    # Также проверяем query-параметры (некоторые версии Мобилон шлют через GET)
    query_is_webhook = (
        params.get('state') is not None and (
            params.get('baseid') is not None or
            params.get('uuid') is not None or
            params.get('callid') is not None
        )
    )

    if webhook_data and ('state' in webhook_data or 'baseid' in webhook_data):
        print(f"[MOBILON WEBHOOK] {json.dumps(webhook_data, ensure_ascii=False)}")
        save_webhook_to_db(webhook_data)
        return {
            'statusCode': 200,
            'headers': {**CORS_HEADERS, 'Content-Type': 'text/plain'},
            'body': 'ok',
        }

    if query_is_webhook:
        print(f"[MOBILON WEBHOOK GET] {json.dumps(params, ensure_ascii=False)}")
        save_webhook_to_db(params)
        return {
            'statusCode': 200,
            'headers': {**CORS_HEADERS, 'Content-Type': 'text/plain'},
            'body': 'ok',
        }

    token = os.environ.get('MOBILON_API_TOKEN', '')
    userkey = os.environ.get('MOBILON_USER_KEY', '')

    action = params.get('action', 'list')

    # ── Список звонков из БД (вебхуки) ───────────────────────────────────
    if action == 'list_db':
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
                  AND NOT (c.src ~ '^\d{{1,3}}$' AND c.dst ~ '^\d{{1,3}}$')
                  AND (c.raw->>'direction') != 'internal'
                ORDER BY c.started_at DESC
                LIMIT 500
            """)
            rows = cur.fetchall()
        finally:
            conn.close()

        calls = db_calls_to_list(rows)
        total = len(calls)
        incoming = sum(1 for c in calls if c['direction'] == 'in')
        outgoing = sum(1 for c in calls if c['direction'] == 'out')
        missed = sum(1 for c in calls if c['direction'] == 'missed')

        return resp(200, {
            'calls': calls,
            'stats': {'total': total, 'incoming': incoming, 'outgoing': outgoing, 'missed': missed},
            'date_from': date_from,
            'date_to': date_to,
            'source': 'db',
        })

    if action == 'active':
        # Возвращает активный входящий звонок (RINGING/ANSWER), обновлённый за последние 30 секунд
        import time
        now_ts = int(time.time())
        cutoff = now_ts - 30
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
                WHERE c.state IN ('RINGING', 'ANSWER')
                  AND c.created_at >= NOW() - INTERVAL '30 seconds'
                  AND (c.raw->>'direction') = 'incoming'
                  AND NOT (c.src ~ '^\\d{{1,3}}$' AND c.dst ~ '^\\d{{1,3}}$')
                ORDER BY c.created_at DESC
                LIMIT 1
            """)
            row = cur.fetchone()
        finally:
            conn.close()
        if row:
            raw = row[8] or {}
            return resp(200, {
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
            })
        return resp(200, {'active': False, 'call': None})

    if action == 'transcribe':
        return handle_transcribe(params)

    if action == 'calls_by_phone':
        phone = params.get('phone', '').strip()
        if not phone:
            return resp(400, {'error': 'phone is required'})
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
        calls = db_calls_to_list(rows)
        return resp(200, {'calls': calls})

    if not token or not userkey:
        return resp(200, {
            'calls': [], 'error': 'not_configured',
            'stats': {'total': 0, 'incoming': 0, 'outgoing': 0, 'missed': 0}
        })

    # ── Ping ──────────────────────────────────────────────────────────────
    if action == 'ping':
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
            is_xml = raw2.strip().startswith('<')
            try:
                parsed_calls = parse_xml_calls(raw2)
                token_valid = True
                call_count = len(parsed_calls)
            except Exception:
                token_valid = not is_html2 and is_xml
                call_count = 0
            results.append({
                'name': 'Journal API (token check)',
                'url': safe_url2,
                'http_status': http_status2,
                'is_xml': is_xml,
                'token_valid': token_valid,
                'call_count_today': call_count,
                'preview': raw2[:300],
            })
        except urllib.error.HTTPError as e:
            body2 = e.read().decode('utf-8') if e.fp else ''
            results.append({'name': 'Journal API (token check)', 'url': safe_url2,
                            'http_status': e.code, 'is_xml': False, 'token_valid': False,
                            'error': f"HTTP {e.code}: {e.reason}", 'preview': body2[:200]})
        except Exception as e:
            results.append({'name': 'Journal API (token check)', 'url': safe_url2,
                            'http_status': None, 'is_xml': False, 'token_valid': False,
                            'error': str(e), 'preview': ''})

        key_check = next((r for r in results if 'key_valid' in r), {})
        token_check = next((r for r in results if 'token_valid' in r), {})
        overall_ok = key_check.get('key_valid', False) or token_check.get('token_valid', False)

        return resp(200, {
            'ok': overall_ok,
            'token_preview': token_preview,
            'date': today,
            'domain': domain,
            'base_url': base,
            'results': results,
        })

    # ── Raw request ───────────────────────────────────────────────────────
    if action == 'raw_request':
        body = json.loads(event.get('body') or '{}')
        raw_url = body.get('url', '').strip()
        if not raw_url:
            return resp(400, {'error': 'url required'})
        full_url = raw_url.replace('{TOKEN}', token).replace('{KEY}', userkey)
        domain = os.environ.get('MOBILON_DOMAIN', 'connect.mobilon.ru').strip().rstrip('/')
        full_url = full_url.replace('{DOMAIN}', domain)
        safe_url = full_url.replace(token, '{TOKEN}').replace(userkey, '{KEY}')
        try:
            req = urllib.request.Request(full_url, headers={'Accept': 'application/json, text/xml, */*'})
            with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
                http_status = r.status
                raw = r.read().decode('utf-8')
            try:
                parsed = json.loads(raw)
                return resp(200, {'url': safe_url, 'real_url': full_url, 'http_status': http_status, 'format': 'json', 'response': parsed})
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
                parsed_xml = xml_to_dict(root)
                return resp(200, {'url': safe_url, 'real_url': full_url, 'http_status': http_status, 'format': 'xml', 'response': parsed_xml, 'raw': raw[:2000]})
            except Exception:
                pass
            return resp(200, {'url': safe_url, 'real_url': full_url, 'http_status': http_status, 'format': 'text', 'response': raw[:3000]})
        except urllib.error.HTTPError as e:
            body_err = e.read().decode('utf-8') if e.fp else ''
            return resp(200, {'url': safe_url, 'real_url': full_url, 'http_status': e.code, 'error': f"HTTP {e.code}: {e.reason}", 'response': body_err[:1000]})
        except Exception as e:
            return resp(200, {'url': safe_url, 'error': str(e)})

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

    # ── List calls from Mobilon API ───────────────────────────────────────
    date_from = params.get('date_from', '')
    date_to = params.get('date_to', '')

    if not date_from:
        date_from = (datetime.now() - timedelta(days=6)).strftime('%Y-%m-%d')
    if not date_to:
        date_to = datetime.now().strftime('%Y-%m-%d')

    try:
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
"""Синхронизация сообщений из Авито в заявки"""
import json
import os
import re
import psycopg2
import psycopg2.extras
import urllib.request
import urllib.parse
import urllib.error

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token, X-Session-Id',
    'Access-Control-Max-Age': '86400',
}


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def resp(status_code, body):
    return {
        'statusCode': status_code,
        'headers': {**CORS_HEADERS, 'Content-Type': 'application/json'},
        'body': json.dumps(body, default=str, ensure_ascii=False),
    }


def normalize_phone(phone):
    digits = re.sub(r'\D', '', phone)
    if len(digits) == 11 and digits[0] in ('7', '8'):
        digits = '7' + digits[1:]
    elif len(digits) == 10:
        digits = '7' + digits
    if len(digits) != 11:
        return phone.strip()
    return f"+7 ({digits[1:4]}) {digits[4:7]}-{digits[7:9]}-{digits[9:11]}"


def avito_api(method, path, token, body=None):
    url = f"https://api.avito.ru{path}"
    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header('Authorization', f'Bearer {token}')
    req.add_header('Content-Type', 'application/json')
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read().decode())


def get_avito_token():
    client_id = os.environ.get('AVITO_CLIENT_ID', '')
    client_secret = os.environ.get('AVITO_CLIENT_SECRET', '')
    if not client_id or not client_secret:
        return None

    data = urllib.parse.urlencode({
        'grant_type': 'client_credentials',
        'client_id': client_id,
        'client_secret': client_secret,
    }).encode()

    req = urllib.request.Request('https://api.avito.ru/token', data=data, method='POST')
    req.add_header('Content-Type', 'application/x-www-form-urlencoded')
    with urllib.request.urlopen(req) as r:
        result = json.loads(r.read().decode())
    return result.get('access_token')


def get_user_id(token):
    result = avito_api('GET', '/core/v1/accounts/self', token)
    return str(result.get('id', ''))


def get_chats(token, user_id):
    result = avito_api('GET', f'/messenger/v2/accounts/{user_id}/chats?unread_only=false&limit=50', token)
    return result.get('chats', [])


def get_messages(token, user_id, chat_id):
    result = avito_api('GET', f'/messenger/v3/accounts/{user_id}/chats/{chat_id}/messages/?limit=20', token)
    return result.get('messages', [])


def extract_phone_from_messages(messages):
    for msg in messages:
        text = msg.get('content', {}).get('text', '')
        phone_match = re.search(r'[\+]?[78][\s\-\(]?\d{3}[\s\-\)]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}', text)
        if phone_match:
            return phone_match.group(0)
    return ''


def extract_first_user_message(messages, user_id):
    user_messages = [m for m in reversed(messages) if str(m.get('author_id')) != user_id]
    if user_messages:
        return user_messages[0].get('content', {}).get('text', '')[:500]
    return ''


def sync_chats(token, user_id, conn):
    chats = get_chats(token, user_id)
    created = 0
    skipped = 0

    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        for chat in chats:
            chat_id = chat.get('id', '')
            if not chat_id:
                continue

            cur.execute("SELECT id FROM avito_synced_chats WHERE chat_id = %s", (str(chat_id),))
            if cur.fetchone():
                skipped += 1
                continue

            context = chat.get('context', {})
            item_name = context.get('value', {}).get('title', '')

            users = chat.get('users', [])
            client_name = 'Клиент Авито'
            avito_user_id_chat = ''
            for u in users:
                if str(u.get('id')) != user_id:
                    client_name = u.get('name', 'Клиент Авито')
                    avito_user_id_chat = str(u.get('id', ''))
                    break

            messages = get_messages(token, user_id, chat_id)
            phone = extract_phone_from_messages(messages)
            first_message = extract_first_user_message(messages, user_id)

            service = item_name if item_name else 'Запрос с Авито'
            comment_parts = []
            if first_message:
                comment_parts.append(first_message)
            comment_parts.append(f'[Авито чат #{chat_id}]')
            comment = '\n'.join(comment_parts)

            cur.execute(
                """INSERT INTO orders (client_name, phone, car_info, service, status, comment, source)
                   VALUES (%s, %s, '', %s, 'new', %s, 'avito') RETURNING id""",
                (client_name, normalize_phone(phone) if phone else '', service, comment),
            )
            order = cur.fetchone()
            order_id = order['id']

            cur.execute(
                """INSERT INTO avito_synced_chats (chat_id, avito_user_id, order_id, last_message_id)
                   VALUES (%s, %s, %s, %s)""",
                (str(chat_id), avito_user_id_chat, order_id,
                 messages[0].get('id', '') if messages else ''),
            )
            created += 1

    conn.commit()
    return created, skipped


def handler(event, context):
    """Синхронизация чатов Авито с заявками"""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    method = event.get('httpMethod', 'GET')

    if method == 'POST':
        token = get_avito_token()
        if not token:
            return resp(400, {'error': 'Не удалось получить токен Авито. Проверьте ключи AVITO_CLIENT_ID и AVITO_CLIENT_SECRET.'})

        user_id = get_user_id(token)
        if not user_id:
            return resp(400, {'error': 'Не удалось определить ID аккаунта Авито'})

        conn = get_conn()
        try:
            created, skipped = sync_chats(token, user_id, conn)
            return resp(200, {
                'success': True,
                'created': created,
                'skipped': skipped,
                'message': f'Создано {created} новых заявок, {skipped} чатов уже были обработаны',
            })
        except urllib.error.HTTPError as e:
            error_body = e.read().decode() if hasattr(e, 'read') else str(e)
            return resp(e.code, {'error': f'Ошибка Авито API: {error_body}'})
        finally:
            conn.close()

    if method == 'GET':
        conn = get_conn()
        try:
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                cur.execute("SELECT COUNT(*) as total FROM avito_synced_chats")
                total = cur.fetchone()['total']
                cur.execute("SELECT synced_at FROM avito_synced_chats ORDER BY synced_at DESC LIMIT 1")
                last = cur.fetchone()
                return resp(200, {
                    'total_synced': total,
                    'last_sync': last['synced_at'] if last else None,
                })
        finally:
            conn.close()

    return resp(405, {'error': 'Method not allowed'})

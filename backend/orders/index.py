"""API для управления заявками установочного центра"""
import json
import os
import re
import psycopg2
import psycopg2.extras
from openai import OpenAI

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token, X-Session-Id',
    'Access-Control-Max-Age': '86400',
}

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 'public')


def t(name):
    return f'{SCHEMA}.{name}'


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


def find_or_create_client(cur, name, phone, email='', car_data=None):
    normalized = normalize_phone(phone) if phone else ''
    raw_digits = re.sub(r'\D', '', normalized)

    if raw_digits:
        cur.execute(f"SELECT * FROM {t('clients')} ORDER BY id")
        clients = cur.fetchall()
        for c in clients:
            c_digits = re.sub(r'\D', '', c['phone'] or '')
            if c_digits and c_digits == raw_digits:
                if car_data and car_data.get('brand'):
                    cur.execute(
                        f"INSERT INTO {t('cars')} (client_id, brand, model, year, vin, license_plate) VALUES (%s, %s, %s, %s, %s, %s)",
                        (c['id'], car_data.get('brand', ''), car_data.get('model', ''),
                         car_data.get('year', ''), car_data.get('vin', ''), car_data.get('license_plate', '').upper()),
                    )
                return c['id'], normalized

    cur.execute(
        f"INSERT INTO {t('clients')} (name, phone, email) VALUES (%s, %s, %s) RETURNING *",
        (name, normalized, email),
    )
    new_client = cur.fetchone()

    if car_data and car_data.get('brand'):
        cur.execute(
            f"INSERT INTO {t('cars')} (client_id, brand, model, year, vin, license_plate) VALUES (%s, %s, %s, %s, %s, %s)",
            (new_client['id'], car_data.get('brand', ''), car_data.get('model', ''),
             car_data.get('year', ''), car_data.get('vin', ''), car_data.get('license_plate', '').upper()),
        )

    return new_client['id'], normalized


def get_orders():
    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(f"SELECT * FROM {t('orders')} ORDER BY created_at DESC")
            rows = cur.fetchall()
            orders = []
            for r in rows:
                orders.append({
                    'id': r['id'],
                    'number': f"З-{str(r['id']).zfill(4)}",
                    'date': r['created_at'].strftime('%d.%m.%Y') if r['created_at'] else '',
                    'client': r['client_name'],
                    'client_id': r['client_id'],
                    'phone': r['phone'] or '',
                    'car': r['car_info'] or '',
                    'service': r['service'] or '',
                    'status': r['status'],
                    'comment': r['comment'] or '',
                    'source': r['source'] or 'manual',
                })
            return resp(200, {'orders': orders})
    finally:
        conn.close()


def create_order(data):
    client_name = data.get('client', '').strip()
    phone = data.get('phone', '').strip()
    car_info = data.get('car', '').strip()
    service = data.get('service', '').strip()
    comment = data.get('comment', '').strip()
    client_id = data.get('client_id')
    source = data.get('source', 'manual')

    if not client_name:
        return resp(400, {'error': 'client is required'})

    car_data = data.get('car_data')

    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            if not client_id:
                client_id, phone = find_or_create_client(cur, client_name, phone, car_data=car_data)
            else:
                phone = normalize_phone(phone) if phone else ''

            cur.execute(
                f"""INSERT INTO {t('orders')} (client_id, client_name, phone, car_info, service, status, comment, source)
                   VALUES (%s, %s, %s, %s, %s, 'new', %s, %s) RETURNING *""",
                (client_id, client_name, phone, car_info, service, comment, source),
            )
            r = cur.fetchone()
            conn.commit()
            return resp(201, {
                'order': {
                    'id': r['id'],
                    'number': f"З-{str(r['id']).zfill(4)}",
                    'date': r['created_at'].strftime('%d.%m.%Y') if r['created_at'] else '',
                    'client': r['client_name'],
                    'client_id': r['client_id'],
                    'phone': r['phone'] or '',
                    'car': r['car_info'] or '',
                    'service': r['service'] or '',
                    'status': r['status'],
                    'comment': r['comment'] or '',
                    'source': r['source'] or 'manual',
                }
            })
    finally:
        conn.close()


def update_order_status(data):
    order_id = data.get('order_id')
    status = data.get('status', '')

    if not order_id or status not in ('new', 'contacted', 'approved', 'rejected'):
        return resp(400, {'error': 'order_id and valid status are required'})

    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(f"UPDATE {t('orders')} SET status = %s WHERE id = %s", (status, order_id))
            conn.commit()
            return resp(200, {'success': True})
    finally:
        conn.close()


def update_order(data):
    order_id = data.get('order_id')
    if not order_id:
        return resp(400, {'error': 'order_id is required'})

    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            updates = []
            params = []

            if 'client' in data and data['client'].strip():
                updates.append("client_name = %s")
                params.append(data['client'].strip())

            if 'phone' in data and data['phone'].strip():
                updates.append("phone = %s")
                params.append(normalize_phone(data['phone'].strip()))

            if 'car' in data:
                updates.append("car_info = %s")
                params.append(data['car'].strip())

            if 'service' in data:
                updates.append("service = %s")
                params.append(data['service'].strip())

            if 'comment' in data:
                updates.append("comment = %s")
                params.append(data['comment'].strip())

            if 'status' in data:
                valid = ('new', 'contacted', 'approved', 'rejected')
                if data['status'] not in valid:
                    return resp(400, {'error': f'status must be one of {valid}'})
                updates.append("status = %s")
                params.append(data['status'])

            if not updates:
                return resp(400, {'error': 'Nothing to update'})

            params.append(order_id)
            cur.execute(
                f"UPDATE {t('orders')} SET {', '.join(updates)} WHERE id = %s RETURNING *",
                params,
            )
            r = cur.fetchone()
            if not r:
                return resp(404, {'error': 'Order not found'})

            conn.commit()
            return resp(200, {
                'order': {
                    'id': r['id'],
                    'number': f"З-{str(r['id']).zfill(4)}",
                    'date': r['created_at'].strftime('%d.%m.%Y') if r['created_at'] else '',
                    'client': r['client_name'],
                    'client_id': r['client_id'],
                    'phone': r['phone'] or '',
                    'car': r['car_info'] or '',
                    'service': r['service'] or '',
                    'status': r['status'],
                    'comment': r['comment'] or '',
                }
            })
    finally:
        conn.close()


def delete_order(data):
    order_id = data.get('order_id')
    if not order_id:
        return resp(400, {'error': 'order_id is required'})

    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(f"DELETE FROM {t('orders')} WHERE id = %s", (order_id,))
            conn.commit()
            return resp(200, {'success': True})
    finally:
        conn.close()


def recognize_photo(data):
    image_b64 = data.get('image', '')
    if not image_b64:
        return resp(400, {'error': 'Изображение не передано'})

    mime = 'image/jpeg'
    if image_b64.startswith('data:'):
        match = re.match(r'data:(image/\w+);base64,(.+)', image_b64, re.DOTALL)
        if match:
            mime = match.group(1)
            image_b64 = match.group(2)

    openai_key = os.environ.get('OPENAI_API_KEY', '')
    ai_client = OpenAI(api_key=openai_key, base_url='https://api.laozhang.ai/v1', timeout=30.0)

    vision_prompt = (
        'Ты — точный OCR-ассистент для российских автодокументов. '
        'На фото может быть СТС (свидетельство о регистрации ТС), ПТС, страховой полис или водительское удостоверение.\n\n'
        'ЗАДАЧА: дословно прочитай текст на документе и заполни JSON. '
        'Читай ТОЛЬКО то, что видно на фото — не додумывай и не исправляй.\n\n'
        'ПРАВИЛА для каждого поля:\n'
        '- client_name: ФИО владельца точно как написано (кириллица). '
        'В СТС это строка "ВЛАДЕЛЕЦ" или "СОБСТВЕННИК". Формат: ФАМИЛИЯ ИМЯ ОТЧЕСТВО\n'
        '- brand: марка ТС как написано (например TOYOTA, LADA, BMW, VOLKSWAGEN). '
        'В СТС поле "МАРКА"\n'
        '- model: модель как написано (например CAMRY, VESTA, X5). '
        'В СТС поле "МОДЕЛЬ"\n'
        '- year: год выпуска — ровно 4 цифры. В СТС поле "ГОД ИЗГОТОВЛЕНИЯ"\n'
        '- vin: VIN строго 17 символов (латиница+цифры, без пробелов). '
        'В СТС поле "VIN" или "ИДЕНТИФИКАЦИОННЫЙ НОМЕР". '
        'Если символов не 17 — пропусти поле.\n'
        '- gos_number: госномер в формате А000АА000 (кириллица+цифры). '
        'В СТС верхняя строка или поле "РЕГИСТРАЦИОННЫЙ ЗНАК". '
        'Пиши только сам номер без пробелов и флагов.\n'
        '- color: цвет кузова одним словом (БЕЛЫЙ, ЧЕРНЫЙ, СЕРЕБРИСТЫЙ и т.д.)\n'
        '- phone: телефон, только если явно указан на документе\n\n'
        'ВАЖНО:\n'
        '- Если поле не видно или нечитаемо — НЕ включай его в JSON\n'
        '- Не путай VIN с номером кузова или другими кодами\n'
        '- Не включай лишние символы, пробелы в начале/конце\n'
        '- Ответь ТОЛЬКО JSON-объектом, без пояснений\n\n'
        'Пример правильного ответа:\n'
        '{"client_name": "ИВАНОВ ИВАН ИВАНОВИЧ", "brand": "TOYOTA", "model": "CAMRY", '
        '"year": "2019", "vin": "XW7BF4FKX0S149271", "gos_number": "А123БВ777", "color": "БЕЛЫЙ"}'
    )

    response = ai_client.chat.completions.create(
        model='gpt-4o',
        messages=[
            {
                'role': 'system',
                'content': 'Ты точный OCR для российских автодокументов. Отвечай строго JSON без markdown и пояснений.'
            },
            {
                'role': 'user',
                'content': [
                    {'type': 'text', 'text': vision_prompt},
                    {'type': 'image_url', 'image_url': {
                        'url': f'data:{mime};base64,{image_b64}',
                        'detail': 'high'
                    }},
                ]
            }
        ],
        max_tokens=600,
        temperature=0,
    )

    raw = response.choices[0].message.content.strip()
    print(f'[RECOGNIZE] raw: {raw[:400]}')

    # Убираем markdown-обёртку если есть
    raw = re.sub(r'^```(?:json)?\s*', '', raw)
    raw = re.sub(r'\s*```$', '', raw)

    json_match = re.search(r'\{.*\}', raw, re.DOTALL)
    if not json_match:
        return resp(200, {'recognized': {}, 'raw': raw})

    recognized = json.loads(json_match.group(0))

    # Постобработка: чистим поля
    if 'vin' in recognized:
        vin = re.sub(r'[^A-Z0-9]', '', str(recognized['vin']).upper())
        if len(vin) == 17:
            recognized['vin'] = vin
        else:
            del recognized['vin']

    if 'gos_number' in recognized:
        recognized['gos_number'] = str(recognized['gos_number']).strip().replace(' ', '')

    if 'year' in recognized:
        year_str = re.sub(r'\D', '', str(recognized['year']))
        if len(year_str) == 4 and 1900 <= int(year_str) <= 2030:
            recognized['year'] = year_str
        else:
            del recognized['year']

    if 'client_name' in recognized:
        name = str(recognized['client_name']).strip()
        if len(name) < 3:
            del recognized['client_name']
        else:
            recognized['client_name'] = name

    print(f'[RECOGNIZE] cleaned: {recognized}')
    return resp(200, {'recognized': recognized})


def get_order_tasks(order_id):
    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(f"SELECT * FROM {t('order_tasks')} WHERE order_id = %s ORDER BY id", (order_id,))
            rows = cur.fetchall()
            return resp(200, {'tasks': [dict(r) for r in rows]})
    finally:
        conn.close()


def upsert_order_task(data):
    order_id = data.get('order_id')
    assignee = data.get('assignee', '').strip()
    text = data.get('text', '').strip()
    done = bool(data.get('done', False))
    task_id = data.get('task_id')

    if not order_id or not assignee:
        return resp(400, {'error': 'order_id and assignee required'})

    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            if task_id:
                cur.execute(
                    f"UPDATE {t('order_tasks')} SET text = %s, done = %s, updated_at = NOW() WHERE id = %s AND order_id = %s RETURNING *",
                    (text, done, task_id, order_id)
                )
            else:
                cur.execute(
                    f"INSERT INTO {t('order_tasks')} (order_id, assignee, text, done) VALUES (%s, %s, %s, %s) RETURNING *",
                    (order_id, assignee, text, done)
                )
            r = cur.fetchone()
            conn.commit()
            return resp(200, {'task': dict(r)})
    finally:
        conn.close()


def get_order_messages(order_id):
    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(f"SELECT * FROM {t('order_messages')} WHERE order_id = %s ORDER BY created_at ASC", (order_id,))
            rows = cur.fetchall()
            return resp(200, {'messages': [dict(r) for r in rows]})
    finally:
        conn.close()


def add_order_message(data):
    order_id = data.get('order_id')
    text = (data.get('text') or '').strip()
    user_id = data.get('user_id')
    user_name = (data.get('user_name') or '').strip()

    if not order_id or not text:
        return resp(400, {'error': 'order_id and text required'})

    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                f"INSERT INTO {t('order_messages')} (order_id, user_id, user_name, text) VALUES (%s, %s, %s, %s) RETURNING *",
                (order_id, user_id or None, user_name, text)
            )
            r = cur.fetchone()
            conn.commit()
            return resp(200, {'message': dict(r)})
    finally:
        conn.close()


def handler(event, context):
    """API заявок установочного центра"""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    method = event.get('httpMethod', 'GET')

    if method == 'GET':
        params = event.get('queryStringParameters') or {}
        if params.get('action') == 'tasks' and params.get('order_id'):
            return get_order_tasks(int(params['order_id']))
        if params.get('action') == 'messages' and params.get('order_id'):
            return get_order_messages(int(params['order_id']))
        return get_orders()

    if method in ('POST', 'PUT'):
        body = json.loads(event.get('body', '{}'))
        action = body.get('action', '')

        if action == 'create':
            return create_order(body)
        elif action == 'update_status':
            return update_order_status(body)
        elif action == 'update':
            return update_order(body)
        elif action == 'delete':
            return delete_order(body)
        elif action == 'recognize_photo':
            return recognize_photo(body)
        elif action == 'upsert_task':
            return upsert_order_task(body)
        elif action == 'add_message':
            return add_order_message(body)

        return resp(400, {'error': 'Unknown action'})

    return resp(405, {'error': 'Method not allowed'})
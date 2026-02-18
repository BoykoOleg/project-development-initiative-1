"""API для управления заявками установочного центра"""
import json
import os
import re
import psycopg2
import psycopg2.extras

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
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


def find_or_create_client(cur, name, phone, email=''):
    normalized = normalize_phone(phone)
    raw_digits = re.sub(r'\D', '', normalized)

    cur.execute("SELECT * FROM clients ORDER BY id")
    clients = cur.fetchall()
    for c in clients:
        c_digits = re.sub(r'\D', '', c['phone'])
        if c_digits == raw_digits:
            return c['id'], normalized

    cur.execute(
        "INSERT INTO clients (name, phone, email) VALUES (%s, %s, %s) RETURNING *",
        (name, normalized, email),
    )
    new_client = cur.fetchone()
    return new_client['id'], normalized


def get_orders():
    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute("SELECT * FROM orders ORDER BY created_at DESC")
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

    if not client_name or not phone:
        return resp(400, {'error': 'client and phone are required'})

    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            if not client_id:
                client_id, phone = find_or_create_client(cur, client_name, phone)
            else:
                phone = normalize_phone(phone)

            cur.execute(
                """INSERT INTO orders (client_id, client_name, phone, car_info, service, status, comment)
                   VALUES (%s, %s, %s, %s, %s, 'new', %s) RETURNING *""",
                (client_id, client_name, phone, car_info, service, comment),
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
            cur.execute("UPDATE orders SET status = %s WHERE id = %s", (status, order_id))
            conn.commit()
            return resp(200, {'success': True})
    finally:
        conn.close()


def handler(event, context):
    """API заявок установочного центра"""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    method = event.get('httpMethod', 'GET')

    if method == 'GET':
        return get_orders()

    if method == 'POST':
        body = json.loads(event.get('body', '{}'))
        action = body.get('action', '')

        if action == 'create':
            return create_order(body)
        elif action == 'update_status':
            return update_order_status(body)

        return resp(400, {'error': 'Unknown action'})

    return resp(405, {'error': 'Method not allowed'})

"""API для управления заявками установочного центра"""
import json
import os
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

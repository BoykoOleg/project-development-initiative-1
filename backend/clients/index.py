"""API для управления клиентами и их автомобилями"""
import json
import os
import psycopg2
import psycopg2.extras

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token, X-Session-Id',
    'Access-Control-Max-Age': '86400',
}


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def response(status_code, body):
    return {
        'statusCode': status_code,
        'headers': {**CORS_HEADERS, 'Content-Type': 'application/json'},
        'body': json.dumps(body, default=str, ensure_ascii=False),
    }


def get_clients():
    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute("SELECT * FROM clients ORDER BY created_at DESC")
            clients = cur.fetchall()

            cur.execute("SELECT * FROM cars WHERE is_active = TRUE ORDER BY created_at DESC")
            cars = cur.fetchall()

            clients_list = []
            for c in clients:
                c_cars = [car for car in cars if car['client_id'] == c['id']]
                clients_list.append({
                    'id': c['id'],
                    'name': c['name'],
                    'phone': c['phone'],
                    'email': c['email'] or '',
                    'comment': c['comment'] or '',
                    'created_at': str(c['created_at']),
                    'cars': [
                        {
                            'id': car['id'],
                            'brand': car['brand'],
                            'model': car['model'],
                            'year': car['year'] or '',
                            'vin': car['vin'] or '',
                        }
                        for car in c_cars
                    ],
                })
            return response(200, {'clients': clients_list})
    finally:
        conn.close()


def create_client(data):
    name = data.get('name', '').strip()
    phone = data.get('phone', '').strip()
    email = data.get('email', '').strip()
    comment = data.get('comment', '').strip()

    if not name or not phone:
        return response(400, {'error': 'name and phone are required'})

    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                "INSERT INTO clients (name, phone, email, comment) VALUES (%s, %s, %s, %s) RETURNING *",
                (name, phone, email, comment),
            )
            client = cur.fetchone()
            conn.commit()
            return response(201, {
                'client': {
                    'id': client['id'],
                    'name': client['name'],
                    'phone': client['phone'],
                    'email': client['email'] or '',
                    'comment': client['comment'] or '',
                    'created_at': str(client['created_at']),
                    'cars': [],
                }
            })
    finally:
        conn.close()


def add_car(data):
    client_id = data.get('client_id')
    brand = data.get('brand', '').strip()
    model = data.get('model', '').strip()
    year = data.get('year', '').strip()
    vin = data.get('vin', '').strip().upper()

    if not client_id or not brand or not model:
        return response(400, {'error': 'client_id, brand and model are required'})

    if vin and len(vin) != 17:
        return response(400, {'error': 'VIN must be exactly 17 characters'})

    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                "INSERT INTO cars (client_id, brand, model, year, vin) VALUES (%s, %s, %s, %s, %s) RETURNING *",
                (client_id, brand, model, year, vin),
            )
            car = cur.fetchone()
            conn.commit()
            return response(201, {
                'car': {
                    'id': car['id'],
                    'brand': car['brand'],
                    'model': car['model'],
                    'year': car['year'] or '',
                    'vin': car['vin'] or '',
                }
            })
    finally:
        conn.close()


def delete_car(data):
    car_id = data.get('car_id')
    if not car_id:
        return response(400, {'error': 'car_id is required'})

    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("UPDATE cars SET is_active = FALSE WHERE id = %s", (car_id,))
            conn.commit()
            return response(200, {'success': True})
    finally:
        conn.close()


def handler(event, context):
    """API клиентов и автомобилей установочного центра"""
    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': CORS_HEADERS,
            'body': '',
        }

    method = event.get('httpMethod', 'GET')

    if method == 'GET':
        return get_clients()

    if method == 'POST':
        body = json.loads(event.get('body', '{}'))
        action = body.get('action', '')

        if action == 'create_client':
            return create_client(body)
        elif action == 'add_car':
            return add_car(body)
        elif action == 'delete_car':
            return delete_car(body)

        return response(400, {'error': 'Unknown action'})

    return response(405, {'error': 'Method not allowed'})
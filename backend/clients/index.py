"""API для управления клиентами и их автомобилями"""
import json
import os
import re
import psycopg2
import psycopg2.extras

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token, X-Session-Id',
    'Access-Control-Max-Age': '86400',
}

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 'public')


def t(name):
    return f'{SCHEMA}.{name}'


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
            cur.execute(f"SELECT * FROM {t('clients')} ORDER BY created_at DESC")
            clients = cur.fetchall()

            cur.execute(f"SELECT * FROM {t('cars')} WHERE is_active = TRUE ORDER BY created_at DESC")
            cars = cur.fetchall()

            clients_list = []
            for c in clients:
                c_cars = [car for car in cars if car['client_id'] == c['id']]
                clients_list.append({
                    'id': c['id'],
                    'name': c['name'],
                    'phone': c['phone'],
                    'email': c['email'] or '',
                    'inn': c['inn'] or '',
                    'comment': c['comment'] or '',
                    'created_at': str(c['created_at']),
                    'cars': [
                        {
                            'id': car['id'],
                            'brand': car['brand'],
                            'model': car['model'],
                            'year': car['year'] or '',
                            'vin': car['vin'] or '',
                            'license_plate': car['license_plate'] or '',
                        }
                        for car in c_cars
                    ],
                })
            return response(200, {'clients': clients_list})
    finally:
        conn.close()


def normalize_phone(phone):
    digits = re.sub(r'\D', '', phone)
    if len(digits) == 11 and digits[0] in ('7', '8'):
        digits = '7' + digits[1:]
    elif len(digits) == 10:
        digits = '7' + digits
    if len(digits) != 11:
        return phone.strip()
    return f"+7 ({digits[1:4]}) {digits[4:7]}-{digits[7:9]}-{digits[9:11]}"


def format_car(car):
    return {
        'id': car['id'],
        'brand': car['brand'],
        'model': car['model'],
        'year': car['year'] or '',
        'vin': car['vin'] or '',
        'license_plate': car['license_plate'] or '',
    }


def create_client(data):
    name = data.get('name', '').strip()
    phone = normalize_phone(data.get('phone', '').strip())
    email = data.get('email', '').strip()
    inn = data.get('inn', '').strip()
    comment = data.get('comment', '').strip()
    car_data = data.get('car')
    force = data.get('force', False)

    if not name or not phone:
        return response(400, {'error': 'name and phone are required'})

    vin = ''
    license_plate = ''
    if car_data:
        vin = car_data.get('vin', '').strip().upper()
        license_plate = car_data.get('license_plate', '').strip().upper()
        if vin and len(vin) != 17:
            vin = ''

    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            if not force:
                duplicates = []
                phone_digits = re.sub(r'\D', '', phone)

                cur.execute(f"SELECT id, name, phone FROM {t('clients')} ORDER BY id")
                all_clients = cur.fetchall()
                for c in all_clients:
                    c_digits = re.sub(r'\D', '', c['phone'])
                    if c_digits == phone_digits:
                        duplicates.append({'field': 'phone', 'client_id': c['id'], 'client_name': c['name'], 'client_phone': c['phone']})
                    elif c['name'].lower() == name.lower():
                        duplicates.append({'field': 'name', 'client_id': c['id'], 'client_name': c['name'], 'client_phone': c['phone']})

                if vin:
                    cur.execute(
                        f"SELECT ca.id, ca.vin, cl.id as client_id, cl.name as client_name, cl.phone as client_phone FROM {t('cars')} ca JOIN {t('clients')} cl ON cl.id = ca.client_id WHERE ca.vin = %s AND ca.is_active = TRUE",
                        (vin,)
                    )
                    vin_match = cur.fetchone()
                    if vin_match:
                        duplicates.append({'field': 'vin', 'client_id': vin_match['client_id'], 'client_name': vin_match['client_name'], 'client_phone': vin_match['client_phone'], 'vin': vin_match['vin']})

                if license_plate:
                    cur.execute(
                        f"SELECT ca.id, ca.license_plate, cl.id as client_id, cl.name as client_name, cl.phone as client_phone FROM {t('cars')} ca JOIN {t('clients')} cl ON cl.id = ca.client_id WHERE ca.license_plate = %s AND ca.is_active = TRUE",
                        (license_plate,)
                    )
                    plate_match = cur.fetchone()
                    if plate_match:
                        duplicates.append({'field': 'license_plate', 'client_id': plate_match['client_id'], 'client_name': plate_match['client_name'], 'client_phone': plate_match['client_phone'], 'license_plate': plate_match['license_plate']})

                if duplicates:
                    return response(409, {'error': 'duplicate', 'duplicates': duplicates})

            cur.execute(
                f"INSERT INTO {t('clients')} (name, phone, email, inn, comment) VALUES (%s, %s, %s, %s, %s) RETURNING *",
                (name, phone, email, inn, comment),
            )
            client = cur.fetchone()

            cars_list = []
            if car_data and car_data.get('brand', '').strip() and car_data.get('model', '').strip():
                brand = car_data['brand'].strip()
                model = car_data['model'].strip()
                year = car_data.get('year', '').strip()
                cur.execute(
                    f"INSERT INTO {t('cars')} (client_id, brand, model, year, vin, license_plate) VALUES (%s, %s, %s, %s, %s, %s) RETURNING *",
                    (client['id'], brand, model, year, vin, license_plate),
                )
                car = cur.fetchone()
                cars_list.append(format_car(car))

            conn.commit()
            return response(201, {
                'client': {
                    'id': client['id'],
                    'name': client['name'],
                    'phone': client['phone'],
                    'email': client['email'] or '',
                    'inn': client['inn'] or '',
                    'comment': client['comment'] or '',
                    'created_at': str(client['created_at']),
                    'cars': cars_list,
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
    license_plate = data.get('license_plate', '').strip().upper()

    if not client_id or not brand or not model:
        return response(400, {'error': 'client_id, brand and model are required'})

    if vin and len(vin) != 17:
        return response(400, {'error': 'VIN must be exactly 17 characters'})

    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                f"INSERT INTO {t('cars')} (client_id, brand, model, year, vin, license_plate) VALUES (%s, %s, %s, %s, %s, %s) RETURNING *",
                (client_id, brand, model, year, vin, license_plate),
            )
            car = cur.fetchone()
            conn.commit()
            return response(201, {'car': format_car(car)})
    finally:
        conn.close()


def update_car(data):
    car_id = data.get('car_id')
    brand = data.get('brand', '').strip()
    model = data.get('model', '').strip()
    year = data.get('year', '').strip()
    vin = data.get('vin', '').strip().upper()
    license_plate = data.get('license_plate', '').strip().upper()

    if not car_id or not brand or not model:
        return response(400, {'error': 'car_id, brand and model are required'})

    if vin and len(vin) != 17:
        return response(400, {'error': 'VIN must be exactly 17 characters'})

    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                f"UPDATE {t('cars')} SET brand=%s, model=%s, year=%s, vin=%s, license_plate=%s WHERE id=%s RETURNING *",
                (brand, model, year, vin, license_plate, car_id),
            )
            car = cur.fetchone()
            if not car:
                return response(404, {'error': 'Car not found'})

            car_info_parts = [brand, model]
            if year:
                car_info_parts.append(year)
            if license_plate:
                car_info_parts.append(license_plate)
            car_info = ' '.join(car_info_parts)

            cur.execute(
                f"UPDATE {t('work_orders')} SET car_info=%s WHERE car_id=%s",
                (car_info, car_id),
            )

            conn.commit()
            return response(200, {'car': format_car(car)})
    finally:
        conn.close()


def update_client(data):
    client_id = data.get('client_id')
    name = data.get('name', '').strip()
    phone = normalize_phone(data.get('phone', '').strip())
    email = data.get('email', '').strip()
    inn = data.get('inn', '').strip()
    comment = data.get('comment', '').strip()

    if not client_id or not name or not phone:
        return response(400, {'error': 'client_id, name and phone are required'})

    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                f"UPDATE {t('clients')} SET name=%s, phone=%s, email=%s, inn=%s, comment=%s WHERE id=%s RETURNING *",
                (name, phone, email, inn, comment, client_id),
            )
            client = cur.fetchone()
            if not client:
                return response(404, {'error': 'Client not found'})

            cur.execute(
                f"UPDATE {t('orders')} SET client_name=%s, phone=%s WHERE client_id=%s",
                (name, phone, client_id),
            )
            cur.execute(
                f"UPDATE {t('work_orders')} SET client_name=%s WHERE client_id=%s",
                (name, client_id),
            )
            cur.execute(
                f"UPDATE {t('work_orders')} SET payer_name=%s WHERE payer_client_id=%s",
                (name, client_id),
            )

            conn.commit()
            return response(200, {
                'client': {
                    'id': client['id'],
                    'name': client['name'],
                    'phone': client['phone'],
                    'email': client['email'] or '',
                    'inn': client['inn'] or '',
                    'comment': client['comment'] or '',
                    'created_at': str(client['created_at']),
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
            cur.execute(f"UPDATE {t('cars')} SET is_active = FALSE WHERE id = %s", (car_id,))
            conn.commit()
            return response(200, {'success': True})
    finally:
        conn.close()


def delete_client(data):
    client_id = data.get('client_id')
    if not client_id:
        return response(400, {'error': 'client_id is required'})

    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(f"UPDATE {t('cars')} SET is_active = FALSE WHERE client_id = %s", (client_id,))
            cur.execute(f"DELETE FROM {t('clients')} WHERE id = %s", (client_id,))
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
        elif action == 'update_client':
            return update_client(body)
        elif action == 'add_car':
            return add_car(body)
        elif action == 'update_car':
            return update_car(body)
        elif action == 'delete_car':
            return delete_car(body)
        elif action == 'delete':
            return delete_client(body)

        return response(400, {'error': 'Unknown action'})

    return response(405, {'error': 'Method not allowed'})
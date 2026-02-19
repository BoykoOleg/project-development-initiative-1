"""CRUD API для управления сотрудниками установочного центра"""
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


def resp(status_code, body):
    return {
        'statusCode': status_code,
        'headers': {**CORS_HEADERS, 'Content-Type': 'application/json'},
        'body': json.dumps(body, default=str, ensure_ascii=False),
    }


VALID_ROLES = ('director', 'manager', 'mechanic', 'electrician', 'installer', 'accountant')
ROLE_LABELS = {
    'director': 'Директор',
    'manager': 'Менеджер',
    'mechanic': 'Механик',
    'electrician': 'Электрик',
    'installer': 'Установщик',
    'accountant': 'Бухгалтер',
}


def format_employee(e):
    return {
        'id': e['id'],
        'name': e['name'],
        'role': e['role'],
        'role_label': ROLE_LABELS.get(e['role'], e['role']),
        'phone': e['phone'] or '',
        'email': e['email'] or '',
        'is_active': e['is_active'],
        'created_at': str(e['created_at']) if e['created_at'] else '',
    }


def get_employees():
    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute("SELECT * FROM employees ORDER BY is_active DESC, name")
            rows = cur.fetchall()
            return resp(200, {
                'employees': [format_employee(r) for r in rows],
                'roles': [{'value': k, 'label': v} for k, v in ROLE_LABELS.items()],
            })
    finally:
        conn.close()


def create_employee(data):
    name = data.get('name', '').strip()
    role = data.get('role', 'mechanic')
    phone = data.get('phone', '').strip()
    email = data.get('email', '').strip()

    if not name:
        return resp(400, {'error': 'Имя сотрудника обязательно'})
    if role not in VALID_ROLES:
        return resp(400, {'error': f'Роль должна быть одной из: {", ".join(VALID_ROLES)}'})

    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                "INSERT INTO employees (name, role, phone, email) VALUES (%s, %s, %s, %s) RETURNING *",
                (name, role, phone, email),
            )
            emp = cur.fetchone()
            conn.commit()
            return resp(201, {'employee': format_employee(emp)})
    finally:
        conn.close()


def update_employee(data):
    emp_id = data.get('employee_id')
    if not emp_id:
        return resp(400, {'error': 'employee_id обязателен'})

    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            updates = []
            params = []

            if 'name' in data:
                name = data['name'].strip()
                if not name:
                    return resp(400, {'error': 'Имя не может быть пустым'})
                updates.append("name = %s")
                params.append(name)

            if 'role' in data:
                if data['role'] not in VALID_ROLES:
                    return resp(400, {'error': 'Недопустимая роль'})
                updates.append("role = %s")
                params.append(data['role'])

            if 'phone' in data:
                updates.append("phone = %s")
                params.append(data['phone'].strip())

            if 'email' in data:
                updates.append("email = %s")
                params.append(data['email'].strip())

            if 'is_active' in data:
                updates.append("is_active = %s")
                params.append(bool(data['is_active']))

            if not updates:
                return resp(400, {'error': 'Нечего обновлять'})

            params.append(emp_id)
            cur.execute(f"UPDATE employees SET {', '.join(updates)} WHERE id = %s RETURNING *", params)
            emp = cur.fetchone()
            if not emp:
                return resp(404, {'error': 'Сотрудник не найден'})
            conn.commit()
            return resp(200, {'employee': format_employee(emp)})
    finally:
        conn.close()


def delete_employee(data):
    emp_id = data.get('employee_id')
    if not emp_id:
        return resp(400, {'error': 'employee_id обязателен'})

    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute("SELECT COUNT(*) as cnt FROM work_orders WHERE employee_id = %s", (emp_id,))
            row = cur.fetchone()
            if row['cnt'] > 0:
                cur.execute("UPDATE employees SET is_active = false WHERE id = %s RETURNING *", (emp_id,))
                emp = cur.fetchone()
                conn.commit()
                return resp(200, {'employee': format_employee(emp), 'deactivated': True})

            cur.execute("DELETE FROM employees WHERE id = %s RETURNING *", (emp_id,))
            emp = cur.fetchone()
            if not emp:
                return resp(404, {'error': 'Сотрудник не найден'})
            conn.commit()
            return resp(200, {'deleted': True})
    finally:
        conn.close()


def handler(event, context):
    """Управление сотрудниками: список, создание, редактирование, удаление"""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    method = event.get('httpMethod', 'GET')

    if method == 'GET':
        return get_employees()

    if method == 'POST':
        body = json.loads(event.get('body') or '{}')
        action = body.get('action', 'create')

        if action == 'create':
            return create_employee(body)
        elif action == 'update':
            return update_employee(body)
        elif action == 'delete':
            return delete_employee(body)

        return resp(400, {'error': f'Неизвестное действие: {action}'})

    return resp(405, {'error': 'Method not allowed'})

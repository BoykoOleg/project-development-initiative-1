"""API для финансов: кассы, платежи, показатели"""
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


def get_cashboxes(conn):
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute("SELECT * FROM cashboxes ORDER BY id")
        return cur.fetchall()


def get_payments(conn, filters=None):
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        where = []
        params = []
        if filters:
            if filters.get('work_order_id'):
                where.append("p.work_order_id = %s")
                params.append(filters['work_order_id'])
            if filters.get('cashbox_id'):
                where.append("p.cashbox_id = %s")
                params.append(filters['cashbox_id'])
            if filters.get('date_from'):
                where.append("p.created_at >= %s")
                params.append(filters['date_from'])
            if filters.get('date_to'):
                where.append("p.created_at <= %s::date + interval '1 day'")
                params.append(filters['date_to'])

        where_sql = (" WHERE " + " AND ".join(where)) if where else ""
        cur.execute(
            f"""SELECT p.*, c.name as cashbox_name, c.type as cashbox_type,
                       wo.client_name, CONCAT('Н-', LPAD(wo.id::text, 4, '0')) as work_order_number
                FROM payments p
                LEFT JOIN cashboxes c ON c.id = p.cashbox_id
                LEFT JOIN work_orders wo ON wo.id = p.work_order_id
                {where_sql}
                ORDER BY p.created_at DESC""",
            params,
        )
        return cur.fetchall()


def get_dashboard(conn):
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute("SELECT COALESCE(SUM(amount), 0) as total FROM payments")
        total_revenue = cur.fetchone()['total']

        cur.execute("""SELECT COALESCE(SUM(amount), 0) as total FROM payments
                       WHERE created_at >= date_trunc('month', CURRENT_DATE)""")
        month_revenue = cur.fetchone()['total']

        cur.execute("""SELECT COALESCE(SUM(amount), 0) as total FROM payments
                       WHERE created_at >= CURRENT_DATE""")
        today_revenue = cur.fetchone()['total']

        cur.execute("SELECT COUNT(*) as cnt FROM payments")
        total_payments = cur.fetchone()['cnt']

        cur.execute("""SELECT COALESCE(SUM(amount), 0) as total FROM payments
                       WHERE created_at >= date_trunc('month', CURRENT_DATE) - interval '1 month'
                       AND created_at < date_trunc('month', CURRENT_DATE)""")
        prev_month_revenue = cur.fetchone()['total']

        cur.execute("""SELECT c.id, c.name, c.type, c.is_active, c.balance,
                       COALESCE(SUM(p.amount), 0) as total_received
                       FROM cashboxes c
                       LEFT JOIN payments p ON p.cashbox_id = c.id
                       GROUP BY c.id, c.name, c.type, c.is_active, c.balance
                       ORDER BY c.id""")
        cashboxes = cur.fetchall()

        cur.execute("""SELECT payment_method, COALESCE(SUM(amount), 0) as total
                       FROM payments
                       WHERE created_at >= date_trunc('month', CURRENT_DATE)
                       GROUP BY payment_method""")
        by_method = {r['payment_method']: float(r['total']) for r in cur.fetchall()}

        cur.execute("""SELECT COUNT(*) as cnt FROM work_orders WHERE status = 'completed'""")
        completed_orders = cur.fetchone()['cnt']

        cur.execute("""SELECT COALESCE(SUM(w.price), 0) as works_total
                       FROM work_order_works w
                       JOIN work_orders wo ON wo.id = w.work_order_id""")
        total_works = cur.fetchone()['works_total']

        cur.execute("""SELECT COALESCE(SUM(p.price * p.qty), 0) as parts_total
                       FROM work_order_parts p
                       JOIN work_orders wo ON wo.id = p.work_order_id""")
        total_parts = cur.fetchone()['parts_total']

        return {
            'total_revenue': float(total_revenue),
            'month_revenue': float(month_revenue),
            'today_revenue': float(today_revenue),
            'prev_month_revenue': float(prev_month_revenue),
            'total_payments': total_payments,
            'completed_orders': completed_orders,
            'total_works': float(total_works),
            'total_parts': float(total_parts),
            'by_method': by_method,
            'cashboxes': [dict(r) for r in cashboxes],
        }


def create_payment(conn, data):
    work_order_id = data.get('work_order_id')
    cashbox_id = data.get('cashbox_id')
    amount = data.get('amount', 0)
    payment_method = data.get('payment_method', 'cash')
    comment = data.get('comment', '')

    if not work_order_id or not cashbox_id or not amount:
        return resp(400, {'error': 'work_order_id, cashbox_id and amount are required'})

    if payment_method not in ('cash', 'card', 'transfer', 'online'):
        return resp(400, {'error': 'Invalid payment method'})

    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(
            """INSERT INTO payments (work_order_id, cashbox_id, amount, payment_method, comment)
               VALUES (%s, %s, %s, %s, %s) RETURNING *""",
            (work_order_id, cashbox_id, amount, payment_method, comment),
        )
        payment = cur.fetchone()

        cur.execute(
            "UPDATE cashboxes SET balance = balance + %s WHERE id = %s",
            (amount, cashbox_id),
        )

        conn.commit()
        return resp(201, {'payment': dict(payment)})


def create_cashbox(conn, data):
    name = data.get('name', '').strip()
    cb_type = data.get('type', 'cash')
    if not name:
        return resp(400, {'error': 'name is required'})
    if cb_type not in ('cash', 'bank', 'card', 'online'):
        return resp(400, {'error': 'Invalid cashbox type'})

    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(
            "INSERT INTO cashboxes (name, type) VALUES (%s, %s) RETURNING *",
            (name, cb_type),
        )
        cashbox = cur.fetchone()
        conn.commit()
        return resp(201, {'cashbox': dict(cashbox)})


def update_cashbox(conn, data):
    cashbox_id = data.get('cashbox_id')
    if not cashbox_id:
        return resp(400, {'error': 'cashbox_id is required'})

    updates = []
    params = []
    if 'name' in data and data['name'].strip():
        updates.append("name = %s")
        params.append(data['name'].strip())
    if 'type' in data:
        if data['type'] not in ('cash', 'bank', 'card', 'online'):
            return resp(400, {'error': 'Invalid type'})
        updates.append("type = %s")
        params.append(data['type'])
    if 'is_active' in data:
        updates.append("is_active = %s")
        params.append(bool(data['is_active']))

    if not updates:
        return resp(400, {'error': 'Nothing to update'})

    params.append(cashbox_id)
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(
            f"UPDATE cashboxes SET {', '.join(updates)} WHERE id = %s RETURNING *",
            params,
        )
        cashbox = cur.fetchone()
        if not cashbox:
            return resp(404, {'error': 'Cashbox not found'})
        conn.commit()
        return resp(200, {'cashbox': dict(cashbox)})


def delete_cashbox(conn, data):
    cashbox_id = data.get('cashbox_id')
    if not cashbox_id:
        return resp(400, {'error': 'cashbox_id is required'})

    with conn.cursor() as cur:
        cur.execute("SELECT COUNT(*) FROM payments WHERE cashbox_id = %s", (cashbox_id,))
        cnt = cur.fetchone()[0]
        if cnt > 0:
            return resp(400, {'error': f'Нельзя удалить кассу — есть {cnt} платежей'})
        cur.execute("DELETE FROM cashboxes WHERE id = %s", (cashbox_id,))
        conn.commit()
        return resp(200, {'success': True})


def handler(event, context):
    """API финансов: кассы, платежи, дашборд"""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    method = event.get('httpMethod', 'GET')
    params = event.get('queryStringParameters') or {}

    conn = get_conn()
    try:
        if method == 'GET':
            section = params.get('section', 'dashboard')
            if section == 'dashboard':
                return resp(200, get_dashboard(conn))
            elif section == 'cashboxes':
                cashboxes = get_cashboxes(conn)
                return resp(200, {'cashboxes': [dict(c) for c in cashboxes]})
            elif section == 'payments':
                payments = get_payments(conn, params)
                return resp(200, {'payments': [dict(p) for p in payments]})
            return resp(400, {'error': 'Unknown section'})

        if method == 'POST':
            body = json.loads(event.get('body', '{}'))
            action = body.get('action', '')

            if action == 'create_payment':
                return create_payment(conn, body)
            elif action == 'create_cashbox':
                return create_cashbox(conn, body)
            elif action == 'update_cashbox':
                return update_cashbox(conn, body)
            elif action == 'delete_cashbox':
                return delete_cashbox(conn, body)

            return resp(400, {'error': 'Unknown action'})

        return resp(405, {'error': 'Method not allowed'})
    finally:
        conn.close()

"""API для управления заказ-нарядами установочного центра"""
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


def format_work(w):
    return {
        'id': w['id'],
        'name': w['name'],
        'price': float(w['price']),
        'qty': float(w.get('qty') or 1),
        'norm_hours': float(w.get('norm_hours') or 0),
        'norm_hour_price': float(w.get('norm_hour_price') or 0),
        'discount': float(w.get('discount') or 0),
    }


def format_part(p):
    return {
        'id': p['id'],
        'name': p['name'],
        'qty': p['qty'],
        'price': float(p['sell_price']),
        'purchase_price': float(p.get('purchase_price') or 0),
        'product_id': p.get('product_id'),
    }


def format_work_order(wo, works, parts):
    return {
        'id': wo['id'],
        'number': f"ЗН-{str(wo['id']).zfill(4)}",
        'date': wo['created_at'].strftime('%d.%m.%Y') if wo['created_at'] else '',
        'created_at': str(wo['created_at']) if wo['created_at'] else '',
        'issued_at': str(wo['issued_at']) if wo.get('issued_at') else '',
        'client': wo['client_name'],
        'client_id': wo['client_id'],
        'car_id': wo['car_id'],
        'car': wo['car_info'] or '',
        'status': wo['status'],
        'master': wo['master'] or '',
        'order_id': wo['order_id'],
        'payer_client_id': wo.get('payer_client_id'),
        'payer_name': wo.get('payer_name') or '',
        'employee_id': wo.get('employee_id'),
        'employee_name': wo.get('employee_name') or '',
        'works': [format_work(w) for w in works],
        'parts': [format_part(p) for p in parts],
    }


def get_work_orders():
    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute("""
                SELECT wo.*, c.vin as car_vin, cl.phone as client_phone,
                       e.name as employee_name
                FROM work_orders wo
                LEFT JOIN cars c ON wo.car_id = c.id
                LEFT JOIN clients cl ON wo.client_id = cl.id
                LEFT JOIN employees e ON wo.employee_id = e.id
                ORDER BY wo.created_at DESC
            """)
            wos = cur.fetchall()

            if not wos:
                return resp(200, {'work_orders': []})

            wo_ids = [wo['id'] for wo in wos]
            id_list = ','.join(str(i) for i in wo_ids)

            cur.execute(f"SELECT * FROM work_order_works WHERE work_order_id IN ({id_list}) ORDER BY id")
            all_works = cur.fetchall()

            cur.execute(f"SELECT * FROM work_order_parts WHERE work_order_id IN ({id_list}) ORDER BY id")
            all_parts = cur.fetchall()

            result = []
            for wo in wos:
                works = [w for w in all_works if w['work_order_id'] == wo['id']]
                parts = [p for p in all_parts if p['work_order_id'] == wo['id']]
                formatted = format_work_order(wo, works, parts)
                formatted['car_vin'] = wo.get('car_vin') or ''
                formatted['client_phone'] = wo.get('client_phone') or ''
                result.append(formatted)

            return resp(200, {'work_orders': result})
    finally:
        conn.close()


def create_work_order(data):
    client_name = data.get('client', '').strip()
    car_info = data.get('car', '').strip()
    master = data.get('master', '').strip()
    client_id = data.get('client_id')
    car_id = data.get('car_id')
    order_id = data.get('order_id')
    payer_client_id = data.get('payer_client_id')
    payer_name = data.get('payer_name', '').strip()
    employee_id = data.get('employee_id')
    works = data.get('works', [])
    parts = data.get('parts', [])

    if not client_name:
        return resp(400, {'error': 'client is required'})

    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                """INSERT INTO work_orders (order_id, client_id, car_id, client_name, car_info, status, master, payer_client_id, payer_name, employee_id)
                   VALUES (%s, %s, %s, %s, %s, 'new', %s, %s, %s, %s) RETURNING *""",
                (order_id, client_id, car_id, client_name, car_info, master, payer_client_id, payer_name, employee_id),
            )
            wo = cur.fetchone()
            wo_id = wo['id']

            inserted_works = []
            for w in works:
                name = w.get('name', '').strip()
                price = w.get('price', 0)
                qty = w.get('qty', 1)
                norm_hours = w.get('norm_hours', 0)
                norm_hour_price = w.get('norm_hour_price', 0)
                discount = w.get('discount', 0)
                if name:
                    cur.execute(
                        """INSERT INTO work_order_works (work_order_id, name, price, qty, norm_hours, norm_hour_price, discount)
                           VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING *""",
                        (wo_id, name, price, qty, norm_hours, norm_hour_price, discount),
                    )
                    inserted_works.append(cur.fetchone())

            inserted_parts = []
            for p in parts:
                name = p.get('name', '').strip()
                qty = p.get('qty', 1)
                sell_price = p.get('price', 0)
                purchase_price = p.get('purchase_price', 0)
                product_id = p.get('product_id')
                if name:
                    cur.execute(
                        """INSERT INTO work_order_parts (work_order_id, name, qty, sell_price, purchase_price, product_id)
                           VALUES (%s, %s, %s, %s, %s, %s) RETURNING *""",
                        (wo_id, name, qty, sell_price, purchase_price, product_id),
                    )
                    inserted_parts.append(cur.fetchone())
                    if product_id and qty > 0:
                        cur.execute("UPDATE products SET quantity = quantity - %s, updated_at = NOW() WHERE id = %s", (qty, product_id))

            conn.commit()
            return resp(201, {'work_order': format_work_order(wo, inserted_works, inserted_parts)})
    finally:
        conn.close()


def update_work_order(data):
    wo_id = data.get('work_order_id')
    if not wo_id:
        return resp(400, {'error': 'work_order_id is required'})

    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            updates = []
            params = []

            if 'status' in data:
                valid = ('new', 'in-progress', 'done', 'issued')
                if data['status'] not in valid:
                    return resp(400, {'error': f'status must be one of {valid}'})
                updates.append("status = %s")
                params.append(data['status'])
                if data['status'] == 'issued':
                    updates.append("issued_at = NOW()")

            if 'master' in data:
                updates.append("master = %s")
                params.append(data['master'].strip())

            if 'payer_client_id' in data:
                updates.append("payer_client_id = %s")
                params.append(data['payer_client_id'])

            if 'payer_name' in data:
                updates.append("payer_name = %s")
                params.append(data['payer_name'].strip())

            if 'employee_id' in data:
                updates.append("employee_id = %s")
                params.append(data['employee_id'])

            if not updates:
                return resp(400, {'error': 'Nothing to update'})

            params.append(wo_id)
            cur.execute(f"UPDATE work_orders SET {', '.join(updates)} WHERE id = %s RETURNING *", params)
            wo = cur.fetchone()

            if not wo:
                return resp(404, {'error': 'Work order not found'})

            conn.commit()

            if wo.get('employee_id'):
                cur.execute("SELECT name FROM employees WHERE id = %s", (wo['employee_id'],))
                emp = cur.fetchone()
                wo['employee_name'] = emp['name'] if emp else ''
            else:
                wo['employee_name'] = ''

            cur.execute("SELECT * FROM work_order_works WHERE work_order_id = %s ORDER BY id", (wo_id,))
            works = cur.fetchall()
            cur.execute("SELECT * FROM work_order_parts WHERE work_order_id = %s ORDER BY id", (wo_id,))
            parts = cur.fetchall()

            return resp(200, {'work_order': format_work_order(wo, works, parts)})
    finally:
        conn.close()


def add_work(data):
    wo_id = data.get('work_order_id')
    name = data.get('name', '').strip()
    price = data.get('price', 0)
    qty = data.get('qty', 1)
    norm_hours = data.get('norm_hours', 0)
    norm_hour_price = data.get('norm_hour_price', 0)
    discount = data.get('discount', 0)

    if not wo_id or not name:
        return resp(400, {'error': 'work_order_id and name are required'})

    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                """INSERT INTO work_order_works (work_order_id, name, price, qty, norm_hours, norm_hour_price, discount)
                   VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING *""",
                (wo_id, name, price, qty, norm_hours, norm_hour_price, discount),
            )
            w = cur.fetchone()
            conn.commit()
            return resp(201, {'work': format_work(w)})
    finally:
        conn.close()


def add_part(data):
    wo_id = data.get('work_order_id')
    name = data.get('name', '').strip()
    qty = data.get('qty', 1)
    sell_price = data.get('price', 0)
    purchase_price = data.get('purchase_price', 0)
    product_id = data.get('product_id')

    if not wo_id:
        return resp(400, {'error': 'work_order_id is required'})

    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            if product_id:
                cur.execute("SELECT * FROM products WHERE id = %s", (product_id,))
                prod = cur.fetchone()
                if not prod:
                    return resp(404, {'error': 'Product not found'})
                if not name:
                    name = prod['name']
                if not purchase_price:
                    purchase_price = float(prod['purchase_price'])
                cur.execute("UPDATE products SET quantity = quantity - %s, updated_at = NOW() WHERE id = %s", (qty, product_id))
            elif not name:
                return resp(400, {'error': 'name or product_id is required'})

            cur.execute(
                """INSERT INTO work_order_parts (work_order_id, name, qty, sell_price, purchase_price, product_id)
                   VALUES (%s, %s, %s, %s, %s, %s) RETURNING *""",
                (wo_id, name, qty, sell_price, purchase_price, product_id),
            )
            p = cur.fetchone()
            conn.commit()
            return resp(201, {'part': format_part(p)})
    finally:
        conn.close()


def update_work(data):
    work_id = data.get('work_id')
    if not work_id:
        return resp(400, {'error': 'work_id is required'})
    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            updates = []
            params = []
            if 'name' in data and data['name'].strip():
                updates.append("name = %s")
                params.append(data['name'].strip())
            if 'price' in data:
                updates.append("price = %s")
                params.append(data['price'])
            if 'qty' in data:
                updates.append("qty = %s")
                params.append(data['qty'])
            if 'norm_hours' in data:
                updates.append("norm_hours = %s")
                params.append(data['norm_hours'])
            if 'norm_hour_price' in data:
                updates.append("norm_hour_price = %s")
                params.append(data['norm_hour_price'])
            if 'discount' in data:
                updates.append("discount = %s")
                params.append(data['discount'])
            if not updates:
                return resp(400, {'error': 'Nothing to update'})
            params.append(work_id)
            cur.execute(f"UPDATE work_order_works SET {', '.join(updates)} WHERE id = %s RETURNING *", params)
            w = cur.fetchone()
            if not w:
                return resp(404, {'error': 'Work not found'})
            conn.commit()
            return resp(200, {'work': format_work(w)})
    finally:
        conn.close()


def delete_work(data):
    work_id = data.get('work_id')
    if not work_id:
        return resp(400, {'error': 'work_id is required'})
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM work_order_works WHERE id = %s", (work_id,))
            conn.commit()
            return resp(200, {'success': True})
    finally:
        conn.close()


def update_part(data):
    part_id = data.get('part_id')
    if not part_id:
        return resp(400, {'error': 'part_id is required'})
    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute("SELECT * FROM work_order_parts WHERE id = %s", (part_id,))
            old = cur.fetchone()
            if not old:
                return resp(404, {'error': 'Part not found'})

            updates = []
            params = []
            if 'name' in data and data['name'].strip():
                updates.append("name = %s")
                params.append(data['name'].strip())
            if 'qty' in data:
                new_qty = data['qty']
                old_qty = old['qty']
                updates.append("qty = %s")
                params.append(new_qty)
                if old.get('product_id') and new_qty != old_qty:
                    diff = old_qty - new_qty
                    cur.execute("UPDATE products SET quantity = quantity + %s, updated_at = NOW() WHERE id = %s", (diff, old['product_id']))
            if 'price' in data:
                updates.append("sell_price = %s")
                params.append(data['price'])
            if 'purchase_price' in data:
                updates.append("purchase_price = %s")
                params.append(data['purchase_price'])
            if not updates:
                return resp(400, {'error': 'Nothing to update'})
            params.append(part_id)
            cur.execute(f"UPDATE work_order_parts SET {', '.join(updates)} WHERE id = %s RETURNING *", params)
            p = cur.fetchone()
            conn.commit()
            return resp(200, {'part': format_part(p)})
    finally:
        conn.close()


def delete_part(data):
    part_id = data.get('part_id')
    if not part_id:
        return resp(400, {'error': 'part_id is required'})
    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute("SELECT * FROM work_order_parts WHERE id = %s", (part_id,))
            old = cur.fetchone()
            if old and old.get('product_id'):
                cur.execute("UPDATE products SET quantity = quantity + %s, updated_at = NOW() WHERE id = %s", (old['qty'], old['product_id']))
            cur.execute("DELETE FROM work_order_parts WHERE id = %s", (part_id,))
            conn.commit()
            return resp(200, {'success': True})
    finally:
        conn.close()


def handler(event, context):
    """API заказ-нарядов установочного центра"""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    method = event.get('httpMethod', 'GET')

    if method == 'GET':
        return get_work_orders()

    if method == 'POST':
        body = json.loads(event.get('body', '{}'))
        action = body.get('action', '')

        actions = {
            'create': create_work_order,
            'update': update_work_order,
            'add_work': add_work,
            'add_part': add_part,
            'update_work': update_work,
            'delete_work': delete_work,
            'update_part': update_part,
            'delete_part': delete_part,
        }

        handler_fn = actions.get(action)
        if handler_fn:
            return handler_fn(body)

        return resp(400, {'error': 'Unknown action'})
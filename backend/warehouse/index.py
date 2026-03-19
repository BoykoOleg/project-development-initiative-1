"""API складского учёта: товары, поставщики, поступления"""
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

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 'public')


def t(name):
    return f'{SCHEMA}.{name}'


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def resp(code, body):
    return {
        'statusCode': code,
        'headers': {**CORS_HEADERS, 'Content-Type': 'application/json'},
        'body': json.dumps(body, default=str, ensure_ascii=False),
    }


def get_products(conn, params=None):
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        where = []
        vals = []
        if params and params.get('search'):
            where.append("(p.name ILIKE %s OR p.sku ILIKE %s)")
            q = f"%{params['search']}%"
            vals.extend([q, q])
        if params and params.get('category'):
            where.append("p.category = %s")
            vals.append(params['category'])
        if params and params.get('low_stock') == '1':
            where.append("p.quantity <= p.min_quantity")
        w = (" WHERE " + " AND ".join(where)) if where else ""
        cur.execute(f"SELECT p.*, COALESCE(p.reserved_qty, 0) as reserved_qty FROM {t('products')} p {w} ORDER BY p.name", vals)
        return [dict(r) for r in cur.fetchall()]


def get_product(conn, product_id):
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(f"SELECT *, COALESCE(reserved_qty, 0) as reserved_qty FROM {t('products')} WHERE id = %s", (product_id,))
        p = cur.fetchone()
        if not p:
            return None
        return dict(p)


def create_product(conn, data):
    sku = data.get('sku', '').strip()
    name = data.get('name', '').strip()
    if not sku or not name:
        return resp(400, {'error': 'sku and name are required'})

    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(f"SELECT id FROM {t('products')} WHERE sku = %s", (sku,))
        if cur.fetchone():
            return resp(400, {'error': f'Номенклатура с номером {sku} уже существует'})

        # purchase_price and quantity start at 0; they are set via receipts
        cur.execute(
            f"""INSERT INTO {t('products')} (sku, name, description, category, unit, purchase_price, quantity, min_quantity)
               VALUES (%s, %s, %s, %s, %s, 0, 0, %s) RETURNING *""",
            (
                sku, name,
                data.get('description', ''),
                data.get('category', ''),
                data.get('unit', 'шт'),
                data.get('min_quantity', 0),
            ),
        )
        product = cur.fetchone()
        conn.commit()
        return resp(201, {'product': dict(product)})


def update_product(conn, data):
    product_id = data.get('product_id')
    if not product_id:
        return resp(400, {'error': 'product_id is required'})

    # purchase_price and quantity are managed only through receipts
    fields_map = {
        'sku': 'sku', 'name': 'name', 'description': 'description',
        'category': 'category', 'unit': 'unit',
        'min_quantity': 'min_quantity', 'is_active': 'is_active',
    }
    updates = []
    vals = []
    for key, col in fields_map.items():
        if key in data:
            val = data[key]
            if key in ('sku', 'name') and isinstance(val, str) and not val.strip():
                continue
            if key in ('sku', 'name', 'description', 'category', 'unit'):
                val = val.strip() if isinstance(val, str) else val
            if key == 'is_active':
                val = bool(val)
            updates.append(f"{col} = %s")
            vals.append(val)

    if not updates:
        return resp(400, {'error': 'Nothing to update'})

    updates.append("updated_at = NOW()")
    vals.append(product_id)

    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(
            f"UPDATE {t('products')} SET {', '.join(updates)} WHERE id = %s RETURNING *",
            vals,
        )
        product = cur.fetchone()
        if not product:
            return resp(404, {'error': 'Product not found'})
        conn.commit()
        return resp(200, {'product': dict(product)})


def get_suppliers(conn):
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(f"""
            SELECT s.*, COUNT(sr.id) as receipt_count,
                   COALESCE(SUM(sr.total_amount), 0) as total_supplied
            FROM {t('suppliers')} s
            LEFT JOIN {t('stock_receipts')} sr ON sr.supplier_id = s.id
            GROUP BY s.id ORDER BY s.name
        """)
        return [dict(r) for r in cur.fetchall()]


def create_supplier(conn, data):
    name = data.get('name', '').strip()
    if not name:
        return resp(400, {'error': 'name is required'})

    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(
            f"""INSERT INTO {t('suppliers')} (name, contact_person, phone, email, inn, address, notes)
               VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING *""",
            (
                name,
                data.get('contact_person', ''),
                data.get('phone', ''),
                data.get('email', ''),
                data.get('inn', ''),
                data.get('address', ''),
                data.get('notes', ''),
            ),
        )
        supplier = cur.fetchone()
        conn.commit()
        return resp(201, {'supplier': dict(supplier)})


def update_supplier(conn, data):
    supplier_id = data.get('supplier_id')
    if not supplier_id:
        return resp(400, {'error': 'supplier_id is required'})

    fields = ['name', 'contact_person', 'phone', 'email', 'inn', 'address', 'notes', 'is_active']
    updates = []
    vals = []
    for f in fields:
        if f in data:
            val = data[f]
            if f == 'name' and isinstance(val, str) and not val.strip():
                continue
            if f == 'is_active':
                val = bool(val)
            elif isinstance(val, str):
                val = val.strip()
            updates.append(f"{f} = %s")
            vals.append(val)

    if not updates:
        return resp(400, {'error': 'Nothing to update'})

    vals.append(supplier_id)
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(
            f"UPDATE {t('suppliers')} SET {', '.join(updates)} WHERE id = %s RETURNING *",
            vals,
        )
        supplier = cur.fetchone()
        if not supplier:
            return resp(404, {'error': 'Supplier not found'})
        conn.commit()
        return resp(200, {'supplier': dict(supplier)})


def get_receipts(conn):
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(f"""
            SELECT sr.*, s.name as supplier_name,
                   COUNT(sri.id) as item_count
            FROM {t('stock_receipts')} sr
            LEFT JOIN {t('suppliers')} s ON s.id = sr.supplier_id
            LEFT JOIN {t('stock_receipt_items')} sri ON sri.receipt_id = sr.id
            GROUP BY sr.id, s.name
            ORDER BY sr.created_at DESC
        """)
        return [dict(r) for r in cur.fetchall()]


def get_receipt_detail(conn, receipt_id):
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(f"""
            SELECT sr.*, s.name as supplier_name
            FROM {t('stock_receipts')} sr
            LEFT JOIN {t('suppliers')} s ON s.id = sr.supplier_id
            WHERE sr.id = %s
        """, (receipt_id,))
        receipt = cur.fetchone()
        if not receipt:
            return None

        cur.execute(f"""
            SELECT sri.*, p.sku, p.name as product_name, p.unit
            FROM {t('stock_receipt_items')} sri
            JOIN {t('products')} p ON p.id = sri.product_id
            WHERE sri.receipt_id = %s
            ORDER BY sri.id
        """, (receipt_id,))
        items = cur.fetchall()

        result = dict(receipt)
        result['items'] = [dict(i) for i in items]
        return result


def create_receipt(conn, data):
    supplier_id = data.get('supplier_id')  # optional
    items = data.get('items', [])
    notes = data.get('notes', '')
    document_number = data.get('document_number', '')
    document_date = data.get('document_date')

    if not items:
        return resp(400, {'error': 'items are required'})

    valid_items = [i for i in items if i.get('product_id') and i.get('quantity', 0) > 0]
    if not valid_items:
        return resp(400, {'error': 'Нет корректных позиций'})

    total = sum(i.get('quantity', 0) * i.get('price', 0) for i in valid_items)

    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        # Generate receipt number
        cur.execute(f"SELECT COUNT(*) as cnt FROM {t('stock_receipts')}")
        cnt = cur.fetchone()['cnt']
        receipt_number = f"ПРХ-{cnt + 1:05d}"

        cur.execute(
            f"""INSERT INTO {t('stock_receipts')} (receipt_number, supplier_id, document_number, document_date, total_amount, notes)
               VALUES (%s, %s, %s, %s, %s, %s) RETURNING *""",
            (receipt_number, supplier_id, document_number, document_date, total, notes),
        )
        receipt = cur.fetchone()

        for item in valid_items:
            product_id = item['product_id']
            quantity = item['quantity']
            price = item.get('price', 0)

            cur.execute(
                f"""INSERT INTO {t('stock_receipt_items')} (receipt_id, product_id, quantity, price)
                   VALUES (%s, %s, %s, %s)""",
                (receipt['id'], product_id, quantity, price),
            )

            # Update stock quantity and set purchase_price from this receipt
            cur.execute(
                f"UPDATE {t('products')} SET quantity = quantity + %s, purchase_price = %s, updated_at = NOW() WHERE id = %s",
                (quantity, price, product_id),
            )

        conn.commit()
        return resp(201, {'receipt': dict(receipt)})


def get_dashboard(conn):
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(f"SELECT COUNT(*) as total, COALESCE(SUM(quantity), 0) as total_qty FROM {t('products')} WHERE is_active = TRUE")
        products_info = cur.fetchone()

        cur.execute(f"SELECT COUNT(*) as cnt FROM {t('products')} WHERE is_active = TRUE AND quantity <= min_quantity")
        low_stock = cur.fetchone()['cnt']

        cur.execute(f"SELECT COUNT(*) as cnt FROM {t('suppliers')} WHERE is_active = TRUE")
        suppliers_count = cur.fetchone()['cnt']

        cur.execute(f"SELECT COALESCE(SUM(total_amount), 0) as total FROM {t('stock_receipts')}")
        total_supplied = cur.fetchone()['total']

        return {
            'total_products': products_info['total'],
            'total_quantity': int(products_info['total_qty']),
            'low_stock_count': low_stock,
            'suppliers_count': suppliers_count,
            'total_supplied': float(total_supplied),
        }


def handler(event, context):
    """API складского учёта: товары, поставщики, поступления"""
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
            elif section == 'products':
                return resp(200, {'products': get_products(conn, params)})
            elif section == 'product':
                pid = params.get('id')
                if not pid:
                    return resp(400, {'error': 'id is required'})
                product = get_product(conn, pid)
                if not product:
                    return resp(404, {'error': 'Product not found'})
                return resp(200, {'product': product})
            elif section == 'suppliers':
                return resp(200, {'suppliers': get_suppliers(conn)})
            elif section == 'receipts':
                return resp(200, {'receipts': get_receipts(conn)})
            elif section == 'receipt':
                rid = params.get('id')
                if not rid:
                    return resp(400, {'error': 'id is required'})
                detail = get_receipt_detail(conn, rid)
                if not detail:
                    return resp(404, {'error': 'Receipt not found'})
                return resp(200, {'receipt': detail})
            return resp(400, {'error': 'Unknown section'})

        if method == 'POST':
            body = json.loads(event.get('body', '{}'))
            action = body.get('action', '')

            actions_map = {
                'create_product': lambda: create_product(conn, body),
                'update_product': lambda: update_product(conn, body),
                'create_supplier': lambda: create_supplier(conn, body),
                'update_supplier': lambda: update_supplier(conn, body),
                'create_receipt': lambda: create_receipt(conn, body),
            }

            handler_fn = actions_map.get(action)
            if handler_fn:
                return handler_fn()

            return resp(400, {'error': 'Unknown action'})

        return resp(405, {'error': 'Method not allowed'})
    finally:
        conn.close()
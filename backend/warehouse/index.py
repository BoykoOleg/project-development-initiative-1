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


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def resp(code, body):
    return {
        'statusCode': code,
        'headers': {**CORS_HEADERS, 'Content-Type': 'application/json'},
        'body': json.dumps(body, default=str, ensure_ascii=False),
    }


# ========== PRODUCTS ==========

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
        cur.execute(f"SELECT p.* FROM products p {w} ORDER BY p.name", vals)
        return [dict(r) for r in cur.fetchall()]


def get_product(conn, product_id):
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute("SELECT * FROM products WHERE id = %s", (product_id,))
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
        cur.execute("SELECT id FROM products WHERE sku = %s", (sku,))
        if cur.fetchone():
            return resp(400, {'error': f'Товар с артикулом {sku} уже существует'})

        cur.execute(
            """INSERT INTO products (sku, name, description, category, unit, purchase_price, quantity, min_quantity)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s) RETURNING *""",
            (
                sku, name,
                data.get('description', ''),
                data.get('category', ''),
                data.get('unit', 'шт'),
                data.get('purchase_price', 0),
                data.get('quantity', 0),
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

    fields_map = {
        'sku': 'sku', 'name': 'name', 'description': 'description',
        'category': 'category', 'unit': 'unit', 'purchase_price': 'purchase_price',
        'quantity': 'quantity', 'min_quantity': 'min_quantity', 'is_active': 'is_active',
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
            f"UPDATE products SET {', '.join(updates)} WHERE id = %s RETURNING *",
            vals,
        )
        product = cur.fetchone()
        if not product:
            return resp(404, {'error': 'Product not found'})
        conn.commit()
        return resp(200, {'product': dict(product)})


# ========== SUPPLIERS ==========

def get_suppliers(conn):
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute("""
            SELECT s.*, COUNT(sr.id) as receipt_count,
                   COALESCE(SUM(sr.total_amount), 0) as total_supplied
            FROM suppliers s
            LEFT JOIN stock_receipts sr ON sr.supplier_id = s.id
            GROUP BY s.id ORDER BY s.name
        """)
        return [dict(r) for r in cur.fetchall()]


def create_supplier(conn, data):
    name = data.get('name', '').strip()
    if not name:
        return resp(400, {'error': 'name is required'})

    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(
            """INSERT INTO suppliers (name, contact_person, phone, email, inn, address, notes)
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
            f"UPDATE suppliers SET {', '.join(updates)} WHERE id = %s RETURNING *",
            vals,
        )
        supplier = cur.fetchone()
        if not supplier:
            return resp(404, {'error': 'Supplier not found'})
        conn.commit()
        return resp(200, {'supplier': dict(supplier)})


# ========== STOCK RECEIPTS ==========

def get_receipts(conn):
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute("""
            SELECT sr.*, s.name as supplier_name,
                   COUNT(sri.id) as item_count
            FROM stock_receipts sr
            LEFT JOIN suppliers s ON s.id = sr.supplier_id
            LEFT JOIN stock_receipt_items sri ON sri.receipt_id = sr.id
            GROUP BY sr.id, s.name
            ORDER BY sr.created_at DESC
        """)
        return [dict(r) for r in cur.fetchall()]


def get_receipt_detail(conn, receipt_id):
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute("""
            SELECT sr.*, s.name as supplier_name
            FROM stock_receipts sr
            LEFT JOIN suppliers s ON s.id = sr.supplier_id
            WHERE sr.id = %s
        """, (receipt_id,))
        receipt = cur.fetchone()
        if not receipt:
            return None

        cur.execute("""
            SELECT sri.*, p.sku, p.name as product_name, p.unit
            FROM stock_receipt_items sri
            JOIN products p ON p.id = sri.product_id
            WHERE sri.receipt_id = %s
            ORDER BY sri.id
        """, (receipt_id,))
        items = cur.fetchall()

        result = dict(receipt)
        result['items'] = [dict(i) for i in items]
        return result


def create_receipt(conn, data):
    supplier_id = data.get('supplier_id')
    document_number = data.get('document_number', '').strip()
    document_date = data.get('document_date')
    notes = data.get('notes', '')
    items = data.get('items', [])

    if not items:
        return resp(400, {'error': 'Items are required'})

    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute("SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM stock_receipts")
        next_id = cur.fetchone()['next_id']
        receipt_number = f"ПН-{str(next_id).zfill(4)}"

        total_amount = 0
        for item in items:
            total_amount += item.get('quantity', 0) * item.get('price', 0)

        cur.execute(
            """INSERT INTO stock_receipts (receipt_number, supplier_id, document_number, document_date, total_amount, notes)
               VALUES (%s, %s, %s, %s, %s, %s) RETURNING *""",
            (receipt_number, supplier_id if supplier_id else None, document_number, document_date, total_amount, notes),
        )
        receipt = cur.fetchone()

        for item in items:
            product_id = item.get('product_id')
            qty = item.get('quantity', 0)
            price = item.get('price', 0)
            if not product_id or qty <= 0:
                continue

            cur.execute(
                """INSERT INTO stock_receipt_items (receipt_id, product_id, quantity, price)
                   VALUES (%s, %s, %s, %s)""",
                (receipt['id'], product_id, qty, price),
            )

            cur.execute(
                "UPDATE products SET quantity = quantity + %s, purchase_price = %s, updated_at = NOW() WHERE id = %s",
                (qty, price, product_id),
            )

        conn.commit()
        return resp(201, {'receipt': dict(receipt)})


def get_categories(conn):
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute("""
            SELECT category, COUNT(*) as count
            FROM products
            WHERE category != '' AND category IS NOT NULL
            GROUP BY category
            ORDER BY category
        """)
        return [dict(r) for r in cur.fetchall()]


def get_dashboard(conn):
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute("SELECT COUNT(*) as cnt FROM products WHERE is_active = TRUE")
        total_products = cur.fetchone()['cnt']

        cur.execute("SELECT COALESCE(SUM(quantity), 0) as qty FROM products WHERE is_active = TRUE")
        total_quantity = cur.fetchone()['qty']

        cur.execute("SELECT COALESCE(SUM(purchase_price * quantity), 0) as val FROM products WHERE is_active = TRUE")
        total_value = cur.fetchone()['val']

        cur.execute("SELECT COUNT(*) as cnt FROM products WHERE quantity <= min_quantity AND is_active = TRUE")
        low_stock = cur.fetchone()['cnt']

        cur.execute("SELECT COUNT(*) as cnt FROM suppliers WHERE is_active = TRUE")
        total_suppliers = cur.fetchone()['cnt']

        cur.execute("SELECT COUNT(*) as cnt FROM stock_receipts")
        total_receipts = cur.fetchone()['cnt']

        return {
            'total_products': total_products,
            'total_quantity': int(total_quantity),
            'total_value': float(total_value),
            'low_stock': low_stock,
            'total_suppliers': total_suppliers,
            'total_receipts': total_receipts,
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
                receipt = get_receipt_detail(conn, rid)
                if not receipt:
                    return resp(404, {'error': 'Receipt not found'})
                return resp(200, {'receipt': receipt})
            elif section == 'categories':
                return resp(200, {'categories': get_categories(conn)})

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

            fn = actions_map.get(action)
            if fn:
                return fn()
            return resp(400, {'error': 'Unknown action'})

        return resp(405, {'error': 'Method not allowed'})
    finally:
        conn.close()

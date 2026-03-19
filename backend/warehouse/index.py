"""API складского учёта: товары, поставщики, поступления, перемещения"""
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
    supplier_id = data.get('supplier_id')
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
            cur.execute(
                f"""UPDATE {t('products')}
                    SET quantity = quantity + %s,
                        purchase_price = %s,
                        updated_at = NOW()
                    WHERE id = %s""",
                (quantity, price, product_id),
            )

        conn.commit()
        return resp(201, {'receipt': dict(receipt)})


def get_dashboard(conn):
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(f"""
            SELECT
                COUNT(*) as total_products,
                COALESCE(SUM(quantity), 0) as total_quantity,
                COALESCE(SUM(quantity * purchase_price), 0) as total_supplied,
                COUNT(CASE WHEN quantity <= min_quantity THEN 1 END) as low_stock_count
            FROM {t('products')}
            WHERE is_active = true
        """)
        stats = dict(cur.fetchone())

        cur.execute(f"SELECT COUNT(*) as suppliers_count FROM {t('suppliers')} WHERE is_active = true")
        stats['suppliers_count'] = cur.fetchone()['suppliers_count']
        return stats


# ==================== ПЕРЕМЕЩЕНИЯ ====================

def format_transfer(tr, items):
    return {
        'id': tr['id'],
        'transfer_number': tr['transfer_number'],
        'work_order_id': tr['work_order_id'],
        'work_order_number': tr.get('work_order_number') or f"ЗН-{str(tr['work_order_id']).zfill(4)}",
        'client_name': tr.get('client_name') or '',
        'direction': tr['direction'],
        'status': tr['status'],
        'notes': tr.get('notes') or '',
        'created_at': str(tr['created_at']) if tr.get('created_at') else '',
        'confirmed_at': str(tr['confirmed_at']) if tr.get('confirmed_at') else '',
        'items': items,
    }


def get_transfers(conn, params=None):
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        wo_filter = ""
        vals = []
        if params and params.get('work_order_id'):
            wo_filter = "WHERE st.work_order_id = %s"
            vals.append(params['work_order_id'])

        cur.execute(f"""
            SELECT st.*,
                   CONCAT('ЗН-', LPAD(wo.id::text, 4, '0')) as work_order_number,
                   wo.client_name
            FROM {t('stock_transfers')} st
            LEFT JOIN {t('work_orders')} wo ON wo.id = st.work_order_id
            {wo_filter}
            ORDER BY st.created_at DESC
        """, vals)
        transfers = cur.fetchall()

        if not transfers:
            return []

        tr_ids = [tr['id'] for tr in transfers]
        id_list = ','.join(str(i) for i in tr_ids)

        cur.execute(f"""
            SELECT sti.*, p.name as product_name, p.sku, p.unit
            FROM {t('stock_transfer_items')} sti
            JOIN {t('products')} p ON p.id = sti.product_id
            WHERE sti.transfer_id IN ({id_list})
            ORDER BY sti.id
        """)
        all_items = cur.fetchall()

        result = []
        for tr in transfers:
            items = [
                {
                    'id': i['id'],
                    'product_id': i['product_id'],
                    'product_name': i['product_name'],
                    'sku': i['sku'],
                    'unit': i['unit'],
                    'qty': float(i['qty']),
                    'price': float(i['price']),
                    'work_order_part_id': i.get('work_order_part_id'),
                }
                for i in all_items if i['transfer_id'] == tr['id']
            ]
            result.append(format_transfer(tr, items))
        return result


def create_transfer(conn, data):
    """Создаём документ перемещения (черновик) без изменения остатков"""
    work_order_id = data.get('work_order_id')
    direction = data.get('direction', 'to_order')
    items = data.get('items', [])
    notes = data.get('notes', '')

    if not work_order_id:
        return resp(400, {'error': 'work_order_id is required'})
    if direction not in ('to_order', 'to_stock'):
        return resp(400, {'error': 'direction must be to_order or to_stock'})
    if not items:
        return resp(400, {'error': 'items are required'})

    valid_items = [i for i in items if i.get('product_id') and i.get('qty', 0) > 0]
    if not valid_items:
        return resp(400, {'error': 'Нет корректных позиций'})

    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        # Проверяем ЗН
        cur.execute(f"SELECT id, status FROM {t('work_orders')} WHERE id = %s", (work_order_id,))
        wo = cur.fetchone()
        if not wo:
            return resp(404, {'error': 'Заказ-наряд не найден'})

        cur.execute(f"SELECT COUNT(*) as cnt FROM {t('stock_transfers')}")
        cnt = cur.fetchone()['cnt']
        transfer_number = f"ПМ-{cnt + 1:05d}"

        cur.execute(
            f"""INSERT INTO {t('stock_transfers')} (transfer_number, work_order_id, direction, status, notes)
               VALUES (%s, %s, %s, 'draft', %s) RETURNING *""",
            (transfer_number, work_order_id, direction, notes),
        )
        transfer = cur.fetchone()
        tr_id = transfer['id']

        for item in valid_items:
            product_id = item['product_id']
            qty = item['qty']

            # Получаем цену
            cur.execute(f"SELECT purchase_price FROM {t('products')} WHERE id = %s", (product_id,))
            prod = cur.fetchone()
            price = float(prod['purchase_price']) if prod else 0

            cur.execute(
                f"""INSERT INTO {t('stock_transfer_items')} (transfer_id, product_id, work_order_part_id, qty, price)
                   VALUES (%s, %s, %s, %s, %s)""",
                (tr_id, product_id, item.get('work_order_part_id'), qty, price),
            )

        conn.commit()

        # Возвращаем полный объект
        transfers = get_transfers(conn, {'work_order_id': work_order_id})
        created = next((tr for tr in transfers if tr['id'] == tr_id), None)
        return resp(201, {'transfer': created})


def confirm_transfer(conn, data):
    """Подтверждаем перемещение — изменяем реальные остатки"""
    transfer_id = data.get('transfer_id')
    if not transfer_id:
        return resp(400, {'error': 'transfer_id is required'})

    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(f"SELECT * FROM {t('stock_transfers')} WHERE id = %s", (transfer_id,))
        transfer = cur.fetchone()
        if not transfer:
            return resp(404, {'error': 'Перемещение не найдено'})
        if transfer['status'] == 'confirmed':
            return resp(400, {'error': 'Перемещение уже подтверждено'})

        cur.execute(f"SELECT * FROM {t('stock_transfer_items')} WHERE transfer_id = %s", (transfer_id,))
        items = cur.fetchall()

        direction = transfer['direction']

        for item in items:
            product_id = item['product_id']
            qty = float(item['qty'])

            if direction == 'to_order':
                # Склад → ЗН: уменьшаем quantity, увеличиваем reserved_qty
                cur.execute(
                    f"""UPDATE {t('products')}
                        SET quantity = GREATEST(0, quantity - %s),
                            reserved_qty = reserved_qty + %s,
                            updated_at = NOW()
                        WHERE id = %s""",
                    (qty, qty, product_id)
                )
            else:
                # ЗН → Склад (возврат): увеличиваем quantity, уменьшаем reserved_qty
                cur.execute(
                    f"""UPDATE {t('products')}
                        SET quantity = quantity + %s,
                            reserved_qty = GREATEST(0, reserved_qty - %s),
                            updated_at = NOW()
                        WHERE id = %s""",
                    (qty, qty, product_id)
                )

        cur.execute(
            f"""UPDATE {t('stock_transfers')}
                SET status = 'confirmed', confirmed_at = NOW()
                WHERE id = %s RETURNING *""",
            (transfer_id,)
        )
        conn.commit()

        transfers = get_transfers(conn, {'work_order_id': transfer['work_order_id']})
        confirmed = next((tr for tr in transfers if tr['id'] == transfer_id), None)
        return resp(200, {'transfer': confirmed})


def handler(event, context):
    """API складского учёта"""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    method = event.get('httpMethod', 'GET')
    conn = get_conn()

    try:
        if method == 'GET':
            qs = event.get('queryStringParameters') or {}
            section = qs.get('section', 'products')

            if section == 'dashboard':
                return resp(200, get_dashboard(conn))
            elif section == 'products':
                return resp(200, {'products': get_products(conn, qs)})
            elif section == 'product':
                pid = qs.get('product_id')
                if not pid:
                    return resp(400, {'error': 'product_id is required'})
                p = get_product(conn, int(pid))
                if not p:
                    return resp(404, {'error': 'Product not found'})
                return resp(200, {'product': p})
            elif section == 'suppliers':
                return resp(200, {'suppliers': get_suppliers(conn)})
            elif section == 'receipts':
                return resp(200, {'receipts': get_receipts(conn)})
            elif section == 'receipt':
                rid = qs.get('receipt_id')
                if not rid:
                    return resp(400, {'error': 'receipt_id is required'})
                r = get_receipt_detail(conn, int(rid))
                if not r:
                    return resp(404, {'error': 'Receipt not found'})
                return resp(200, {'receipt': r})
            elif section == 'transfers':
                return resp(200, {'transfers': get_transfers(conn, qs)})
            else:
                return resp(400, {'error': f'Unknown section: {section}'})

        if method == 'POST':
            body = json.loads(event.get('body', '{}'))
            action = body.get('action', '')

            if action == 'create_product':
                return create_product(conn, body)
            elif action == 'update_product':
                return update_product(conn, body)
            elif action == 'create_supplier':
                return create_supplier(conn, body)
            elif action == 'update_supplier':
                return update_supplier(conn, body)
            elif action == 'create_receipt':
                return create_receipt(conn, body)
            elif action == 'create_transfer':
                return create_transfer(conn, body)
            elif action == 'confirm_transfer':
                return confirm_transfer(conn, body)
            else:
                return resp(400, {'error': f'Unknown action: {action}'})

        return resp(405, {'error': 'Method not allowed'})
    finally:
        conn.close()

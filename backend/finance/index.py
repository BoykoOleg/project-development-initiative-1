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

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 'public')


def t(name):
    return f'{SCHEMA}.{name}'


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
        cur.execute(f"SELECT * FROM {t('cashboxes')} ORDER BY id")
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
                FROM {t('payments')} p
                LEFT JOIN {t('cashboxes')} c ON c.id = p.cashbox_id
                LEFT JOIN {t('work_orders')} wo ON wo.id = p.work_order_id
                {where_sql}
                ORDER BY p.created_at DESC""",
            params,
        )
        return cur.fetchall()


def get_dashboard(conn):
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(f"SELECT COALESCE(SUM(amount), 0) as total FROM {t('payments')}")
        total_revenue = cur.fetchone()['total']

        cur.execute(f"""SELECT COALESCE(SUM(amount), 0) as total FROM {t('payments')}
                       WHERE created_at >= date_trunc('month', CURRENT_DATE)""")
        month_revenue = cur.fetchone()['total']

        cur.execute(f"""SELECT COALESCE(SUM(amount), 0) as total FROM {t('payments')}
                       WHERE created_at >= CURRENT_DATE""")
        today_revenue = cur.fetchone()['total']

        cur.execute(f"SELECT COUNT(*) as cnt FROM {t('payments')}")
        total_payments = cur.fetchone()['cnt']

        cur.execute(f"""SELECT COALESCE(SUM(amount), 0) as total FROM {t('payments')}
                       WHERE created_at >= date_trunc('month', CURRENT_DATE) - interval '1 month'
                       AND created_at < date_trunc('month', CURRENT_DATE)""")
        prev_month_revenue = cur.fetchone()['total']

        cur.execute(f"""SELECT c.id, c.name, c.type, c.is_active, c.balance,
                       COALESCE(SUM(p.amount), 0) as total_received
                       FROM {t('cashboxes')} c
                       LEFT JOIN {t('payments')} p ON p.cashbox_id = c.id
                       GROUP BY c.id, c.name, c.type, c.is_active, c.balance
                       ORDER BY c.id""")
        cashboxes = cur.fetchall()

        cur.execute(f"""SELECT payment_method, COALESCE(SUM(amount), 0) as total
                       FROM {t('payments')}
                       WHERE created_at >= date_trunc('month', CURRENT_DATE)
                       GROUP BY payment_method""")
        by_method = {r['payment_method']: float(r['total']) for r in cur.fetchall()}

        cur.execute(f"""SELECT COUNT(*) as cnt FROM {t('work_orders')} WHERE status = 'completed'""")
        completed_orders = cur.fetchone()['cnt']

        cur.execute(f"""SELECT COALESCE(SUM(w.price), 0) as works_total
                       FROM {t('work_order_works')} w
                       JOIN {t('work_orders')} wo ON wo.id = w.work_order_id""")
        total_works = cur.fetchone()['works_total']

        cur.execute(f"""SELECT COALESCE(SUM(p.sell_price * p.qty), 0) as parts_total
                       FROM {t('work_order_parts')} p
                       JOIN {t('work_orders')} wo ON wo.id = p.work_order_id""")
        total_parts = cur.fetchone()['parts_total']

        cur.execute(f"SELECT COALESCE(SUM(amount), 0) as total FROM {t('expenses')}")
        total_expenses = cur.fetchone()['total']

        cur.execute(f"""
            SELECT to_char(date_trunc('month', p.created_at), 'YYYY-MM') as month,
                   COALESCE(SUM(p.amount), 0) as revenue
            FROM {t('payments')} p
            WHERE p.created_at >= date_trunc('month', CURRENT_DATE) - interval '5 months'
            GROUP BY date_trunc('month', p.created_at)
            ORDER BY month
        """)
        revenue_by_months = [{'month': r['month'], 'revenue': float(r['revenue'])} for r in cur.fetchall()]

        return {
            'total_revenue': float(total_revenue),
            'month_revenue': float(month_revenue),
            'today_revenue': float(today_revenue),
            'prev_month_revenue': float(prev_month_revenue),
            'total_expenses': float(total_expenses),
            'total_payments': total_payments,
            'completed_orders': completed_orders,
            'total_works': float(total_works),
            'total_parts': float(total_parts),
            'by_method': by_method,
            'cashboxes': [dict(r) for r in cashboxes],
            'revenue_by_months': revenue_by_months,
        }


def get_work_order_finance(conn, work_order_id):
    """Получить всё движение денег по конкретному заказ-наряду"""
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        # Информация о заказ-наряде
        cur.execute(
            f"""SELECT wo.id, wo.client_name, wo.car_info, wo.status,
                       CONCAT('Н-', LPAD(wo.id::text, 4, '0')) as number
                FROM {t('work_orders')} wo WHERE wo.id = %s""",
            (work_order_id,),
        )
        wo = cur.fetchone()
        if not wo:
            return None

        # Сумма работ
        cur.execute(
            f"SELECT COALESCE(SUM(price * qty), 0) as total FROM {t('work_order_works')} WHERE work_order_id = %s",
            (work_order_id,),
        )
        works_total = float(cur.fetchone()['total'])

        # Сумма запчастей (по цене продажи)
        cur.execute(
            f"SELECT COALESCE(SUM(sell_price * qty), 0) as total FROM {t('work_order_parts')} WHERE work_order_id = %s",
            (work_order_id,),
        )
        parts_total = float(cur.fetchone()['total'])

        # Детали работ
        cur.execute(
            f"""SELECT name, qty, price, norm_hours, discount
                FROM {t('work_order_works')} WHERE work_order_id = %s ORDER BY id""",
            (work_order_id,),
        )
        works_list = [dict(r) for r in cur.fetchall()]

        # Детали запчастей
        cur.execute(
            f"""SELECT name, qty, sell_price, purchase_price
                FROM {t('work_order_parts')} WHERE work_order_id = %s ORDER BY id""",
            (work_order_id,),
        )
        parts_list = [dict(r) for r in cur.fetchall()]

        parts_purchase_total = sum(float(p['purchase_price'] or 0) * float(p['qty']) for p in parts_list)
        parts_margin = float(parts_total) - parts_purchase_total

        # Платежи (поступления от клиента)
        cur.execute(
            f"""SELECT p.id, p.amount, p.payment_method, p.comment, p.created_at,
                       c.name as cashbox_name
                FROM {t('payments')} p
                LEFT JOIN {t('cashboxes')} c ON c.id = p.cashbox_id
                WHERE p.work_order_id = %s ORDER BY p.created_at""",
            (work_order_id,),
        )
        payments = [dict(r) for r in cur.fetchall()]

        # Расходы привязанные к заказ-наряду
        cur.execute(
            f"""SELECT e.id, e.amount, e.comment, e.created_at,
                       c.name as cashbox_name, eg.name as group_name
                FROM {t('expenses')} e
                LEFT JOIN {t('cashboxes')} c ON c.id = e.cashbox_id
                LEFT JOIN {t('expense_groups')} eg ON eg.id = e.expense_group_id
                WHERE e.work_order_id = %s ORDER BY e.created_at""",
            (work_order_id,),
        )
        expenses = [dict(r) for r in cur.fetchall()]

        # Приходы привязанные к заказ-наряду
        cur.execute(
            f"""SELECT i.id, i.amount, i.income_type, i.comment, i.created_at,
                       c.name as cashbox_name
                FROM {t('incomes')} i
                LEFT JOIN {t('cashboxes')} c ON c.id = i.cashbox_id
                WHERE i.work_order_id = %s ORDER BY i.created_at""",
            (work_order_id,),
        )
        incomes = [dict(r) for r in cur.fetchall()]

        # Перемещения товаров со склада в заказ-наряд
        cur.execute(
            f"""SELECT st.id, st.transfer_number, st.direction, st.status,
                       st.notes, st.created_at, st.confirmed_at
                FROM {t('stock_transfers')} st
                WHERE st.work_order_id = %s ORDER BY st.created_at""",
            (work_order_id,),
        )
        transfers_raw = cur.fetchall()
        transfers = []
        for tr in transfers_raw:
            cur.execute(
                f"""SELECT sti.id, sti.product_id, sti.qty, sti.price,
                           p.name as product_name, p.sku, p.unit
                    FROM {t('stock_transfer_items')} sti
                    LEFT JOIN {t('products')} p ON p.id = sti.product_id
                    WHERE sti.transfer_id = %s ORDER BY sti.id""",
                (tr['id'],),
            )
            items = [dict(i) for i in cur.fetchall()]
            transfers.append({**dict(tr), 'items': items})

        paid = sum(float(p['amount']) for p in payments)
        total_income = paid + sum(float(i['amount']) for i in incomes)
        total_expense = sum(float(e['amount']) for e in expenses)
        order_total = works_total + parts_total

        return {
            'work_order': dict(wo),
            'works_total': works_total,
            'parts_total': parts_total,
            'parts_purchase_total': parts_purchase_total,
            'parts_margin': parts_margin,
            'order_total': order_total,
            'paid': paid,
            'debt': max(0, order_total - paid),
            'total_income': total_income,
            'total_expense': total_expense,
            'profit': total_income - total_expense,
            'works': works_list,
            'parts': parts_list,
            'payments': payments,
            'expenses': expenses,
            'incomes': incomes,
            'transfers': transfers,
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
            f"""INSERT INTO {t('payments')} (work_order_id, cashbox_id, amount, payment_method, comment)
               VALUES (%s, %s, %s, %s, %s) RETURNING *""",
            (work_order_id, cashbox_id, amount, payment_method, comment),
        )
        payment = cur.fetchone()

        cur.execute(
            f"UPDATE {t('cashboxes')} SET balance = balance + %s WHERE id = %s",
            (amount, cashbox_id),
        )

        conn.commit()
        return resp(201, {'payment': dict(payment)})


def update_payment(conn, data):
    payment_id = data.get('payment_id')
    if not payment_id:
        return resp(400, {'error': 'payment_id is required'})

    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(f"SELECT * FROM {t('payments')} WHERE id = %s", (payment_id,))
        old = cur.fetchone()
        if not old:
            return resp(404, {'error': 'Платёж не найден'})

        new_cashbox_id = data.get('cashbox_id', old['cashbox_id'])
        payment_method = data.get('payment_method', old['payment_method'])
        comment = data.get('comment', old['comment'])
        amount = float(old['amount'])

        if payment_method not in ('cash', 'card', 'transfer', 'online'):
            return resp(400, {'error': 'Invalid payment method'})

        if int(new_cashbox_id) != int(old['cashbox_id']):
            cur.execute(f"SELECT id FROM {t('cashboxes')} WHERE id = %s", (new_cashbox_id,))
            if not cur.fetchone():
                return resp(404, {'error': 'Касса не найдена'})
            cur.execute(
                f"UPDATE {t('cashboxes')} SET balance = balance - %s WHERE id = %s",
                (amount, old['cashbox_id']),
            )
            cur.execute(
                f"UPDATE {t('cashboxes')} SET balance = balance + %s WHERE id = %s",
                (amount, new_cashbox_id),
            )

        cur.execute(
            f"""UPDATE {t('payments')}
               SET cashbox_id = %s, payment_method = %s, comment = %s
               WHERE id = %s RETURNING *""",
            (new_cashbox_id, payment_method, comment, payment_id),
        )
        updated = cur.fetchone()
        conn.commit()
        return resp(200, {'payment': dict(updated)})


def create_cashbox(conn, data):
    name = data.get('name', '').strip()
    cb_type = data.get('type', 'cash')
    if not name:
        return resp(400, {'error': 'name is required'})
    if cb_type not in ('cash', 'bank', 'card', 'online'):
        return resp(400, {'error': 'Invalid cashbox type'})

    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(
            f"INSERT INTO {t('cashboxes')} (name, type) VALUES (%s, %s) RETURNING *",
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
            f"UPDATE {t('cashboxes')} SET {', '.join(updates)} WHERE id = %s RETURNING *",
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
        cur.execute(f"SELECT COUNT(*) FROM {t('payments')} WHERE cashbox_id = %s", (cashbox_id,))
        cnt = cur.fetchone()[0]
        if cnt > 0:
            return resp(400, {'error': f'Нельзя удалить кассу — есть {cnt} платежей'})
        cur.execute(f"DELETE FROM {t('cashboxes')} WHERE id = %s", (cashbox_id,))
        conn.commit()
        return resp(200, {'success': True})


def get_expense_groups(conn):
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(f"""
            SELECT eg.*, COALESCE(SUM(e.amount), 0) as total_spent, COUNT(e.id) as expense_count
            FROM {t('expense_groups')} eg
            LEFT JOIN {t('expenses')} e ON e.expense_group_id = eg.id
            GROUP BY eg.id
            ORDER BY eg.name
        """)
        return cur.fetchall()


def get_expenses(conn, filters=None):
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        where = []
        params = []
        if filters:
            if filters.get('expense_group_id'):
                where.append("e.expense_group_id = %s")
                params.append(filters['expense_group_id'])
            if filters.get('cashbox_id'):
                where.append("e.cashbox_id = %s")
                params.append(filters['cashbox_id'])
            if filters.get('work_order_id'):
                where.append("e.work_order_id = %s")
                params.append(filters['work_order_id'])
        where_sql = (" WHERE " + " AND ".join(where)) if where else ""
        cur.execute(
            f"""SELECT e.*, c.name as cashbox_name, c.type as cashbox_type,
                       eg.name as group_name,
                       CONCAT('Н-', LPAD(wo.id::text, 4, '0')) as work_order_number,
                       sr.receipt_number as stock_receipt_number,
                       cl.name as client_name
                FROM {t('expenses')} e
                LEFT JOIN {t('cashboxes')} c ON c.id = e.cashbox_id
                LEFT JOIN {t('expense_groups')} eg ON eg.id = e.expense_group_id
                LEFT JOIN {t('work_orders')} wo ON wo.id = e.work_order_id
                LEFT JOIN {t('stock_receipts')} sr ON sr.id = e.stock_receipt_id
                LEFT JOIN {t('clients')} cl ON cl.id = e.client_id
                {where_sql}
                ORDER BY COALESCE(e.operation_date, e.created_at::date) DESC, e.id DESC""",
            params,
        )
        return cur.fetchall()


def create_expense(conn, data):
    cashbox_id = data.get('cashbox_id')
    amount = data.get('amount', 0)
    expense_group_id = data.get('expense_group_id')
    work_order_id = data.get('work_order_id')
    stock_receipt_id = data.get('stock_receipt_id')
    comment = data.get('comment', '')
    client_id = data.get('client_id')
    operation_date = data.get('operation_date')

    if not cashbox_id or not amount:
        return resp(400, {'error': 'cashbox_id and amount are required'})
    if amount <= 0:
        return resp(400, {'error': 'Amount must be positive'})

    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(f"SELECT balance FROM {t('cashboxes')} WHERE id = %s", (cashbox_id,))
        cb = cur.fetchone()
        if not cb:
            return resp(404, {'error': 'Cashbox not found'})

        cur.execute(
            f"""INSERT INTO {t('expenses')}
                (expense_group_id, cashbox_id, amount, comment, work_order_id, stock_receipt_id, client_id, operation_date)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s) RETURNING *""",
            (
                expense_group_id if expense_group_id else None,
                cashbox_id, amount, comment,
                work_order_id if work_order_id else None,
                stock_receipt_id if stock_receipt_id else None,
                int(client_id) if client_id else None,
                operation_date or None,
            ),
        )
        expense = cur.fetchone()
        cur.execute(
            f"UPDATE {t('cashboxes')} SET balance = balance - %s WHERE id = %s",
            (amount, cashbox_id),
        )
        conn.commit()
        return resp(201, {'expense': dict(expense)})


def update_expense(conn, data):
    expense_id = data.get('expense_id')
    if not expense_id:
        return resp(400, {'error': 'expense_id is required'})

    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(f"SELECT * FROM {t('expenses')} WHERE id = %s", (expense_id,))
        old = cur.fetchone()
        if not old:
            return resp(404, {'error': 'Расход не найден'})

        new_cashbox_id = data.get('cashbox_id', old['cashbox_id'])
        expense_group_id = data.get('expense_group_id')
        work_order_id = data.get('work_order_id')
        stock_receipt_id = data.get('stock_receipt_id')
        comment = data.get('comment', old['comment'])
        client_id = data.get('client_id')
        operation_date = data.get('operation_date')
        amount = float(old['amount'])

        if int(new_cashbox_id) != int(old['cashbox_id']):
            cur.execute(f"SELECT id FROM {t('cashboxes')} WHERE id = %s", (new_cashbox_id,))
            if not cur.fetchone():
                return resp(404, {'error': 'Касса не найдена'})
            cur.execute(
                f"UPDATE {t('cashboxes')} SET balance = balance + %s WHERE id = %s",
                (amount, old['cashbox_id']),
            )
            cur.execute(
                f"UPDATE {t('cashboxes')} SET balance = balance - %s WHERE id = %s",
                (amount, new_cashbox_id),
            )

        cur.execute(
            f"""UPDATE {t('expenses')}
               SET cashbox_id = %s, expense_group_id = %s, comment = %s,
                   work_order_id = %s, stock_receipt_id = %s,
                   client_id = %s, operation_date = %s
               WHERE id = %s RETURNING *""",
            (
                new_cashbox_id,
                int(expense_group_id) if expense_group_id else None,
                comment,
                int(work_order_id) if work_order_id else None,
                int(stock_receipt_id) if stock_receipt_id else None,
                int(client_id) if client_id else None,
                operation_date or None,
                expense_id,
            ),
        )
        updated = cur.fetchone()
        conn.commit()
        return resp(200, {'expense': dict(updated)})


def create_income(conn, data):
    """Создание приходного ордера"""
    cashbox_id = data.get('cashbox_id')
    amount = data.get('amount', 0)
    income_type = data.get('income_type', 'other')
    work_order_id = data.get('work_order_id')
    comment = data.get('comment', '')
    client_id = data.get('client_id')
    operation_date = data.get('operation_date')

    if not cashbox_id or not amount:
        return resp(400, {'error': 'cashbox_id and amount are required'})
    if amount <= 0:
        return resp(400, {'error': 'Amount must be positive'})

    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(f"SELECT balance FROM {t('cashboxes')} WHERE id = %s", (cashbox_id,))
        cb = cur.fetchone()
        if not cb:
            return resp(404, {'error': 'Cashbox not found'})

        cur.execute(
            f"""INSERT INTO {t('incomes')}
                (cashbox_id, amount, income_type, comment, work_order_id, client_id, operation_date)
               VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING *""",
            (cashbox_id, amount, income_type, comment,
             work_order_id if work_order_id else None,
             int(client_id) if client_id else None,
             operation_date or None),
        )
        income = cur.fetchone()
        cur.execute(
            f"UPDATE {t('cashboxes')} SET balance = balance + %s WHERE id = %s",
            (amount, cashbox_id),
        )
        conn.commit()
        return resp(201, {'income': dict(income)})


def update_income(conn, data):
    """Редактирование прихода"""
    income_id = data.get('income_id')
    if not income_id:
        return resp(400, {'error': 'income_id is required'})

    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(f"SELECT * FROM {t('incomes')} WHERE id = %s", (income_id,))
        old = cur.fetchone()
        if not old:
            return resp(404, {'error': 'Приход не найден'})

        new_cashbox_id = data.get('cashbox_id', old['cashbox_id'])
        income_type = data.get('income_type', old['income_type'])
        comment = data.get('comment', old['comment'])
        client_id = data.get('client_id')
        operation_date = data.get('operation_date')
        work_order_id = data.get('work_order_id')
        amount = float(old['amount'])

        if int(new_cashbox_id) != int(old['cashbox_id']):
            cur.execute(f"SELECT id FROM {t('cashboxes')} WHERE id = %s", (new_cashbox_id,))
            if not cur.fetchone():
                return resp(404, {'error': 'Касса не найдена'})
            cur.execute(
                f"UPDATE {t('cashboxes')} SET balance = balance - %s WHERE id = %s",
                (amount, old['cashbox_id']),
            )
            cur.execute(
                f"UPDATE {t('cashboxes')} SET balance = balance + %s WHERE id = %s",
                (amount, new_cashbox_id),
            )

        cur.execute(
            f"""UPDATE {t('incomes')}
               SET cashbox_id = %s, income_type = %s, comment = %s,
                   work_order_id = %s, client_id = %s, operation_date = %s
               WHERE id = %s RETURNING *""",
            (
                new_cashbox_id, income_type, comment,
                int(work_order_id) if work_order_id else None,
                int(client_id) if client_id else None,
                operation_date or None,
                income_id,
            ),
        )
        updated = cur.fetchone()
        conn.commit()
        return resp(200, {'income': dict(updated)})


def create_transfer(conn, data):
    """Создание перемещения денег между кассами"""
    from_cashbox_id = data.get('from_cashbox_id')
    to_cashbox_id = data.get('to_cashbox_id')
    amount = data.get('amount', 0)
    comment = data.get('comment', '')

    if not from_cashbox_id or not to_cashbox_id or not amount:
        return resp(400, {'error': 'from_cashbox_id, to_cashbox_id and amount are required'})
    if amount <= 0:
        return resp(400, {'error': 'Amount must be positive'})
    if from_cashbox_id == to_cashbox_id:
        return resp(400, {'error': 'Cannot transfer to the same cashbox'})

    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(f"SELECT balance FROM {t('cashboxes')} WHERE id = %s", (from_cashbox_id,))
        from_cb = cur.fetchone()
        if not from_cb:
            return resp(404, {'error': 'Source cashbox not found'})
        if from_cb['balance'] < amount:
            return resp(400, {'error': 'Insufficient funds in source cashbox'})

        cur.execute(f"SELECT id FROM {t('cashboxes')} WHERE id = %s", (to_cashbox_id,))
        to_cb = cur.fetchone()
        if not to_cb:
            return resp(404, {'error': 'Destination cashbox not found'})

        cur.execute(
            f"""INSERT INTO {t('transfers')} (from_cashbox_id, to_cashbox_id, amount, comment)
               VALUES (%s, %s, %s, %s) RETURNING *""",
            (from_cashbox_id, to_cashbox_id, amount, comment),
        )
        transfer = cur.fetchone()

        cur.execute(
            f"UPDATE {t('cashboxes')} SET balance = balance - %s WHERE id = %s",
            (amount, from_cashbox_id),
        )
        cur.execute(
            f"UPDATE {t('cashboxes')} SET balance = balance + %s WHERE id = %s",
            (amount, to_cashbox_id),
        )

        conn.commit()
        return resp(201, {'transfer': dict(transfer)})


def get_incomes(conn, filters=None):
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        where = []
        params = []
        if filters:
            if filters.get('cashbox_id'):
                where.append("i.cashbox_id = %s")
                params.append(filters['cashbox_id'])
            if filters.get('work_order_id'):
                where.append("i.work_order_id = %s")
                params.append(filters['work_order_id'])
        where_sql = (" WHERE " + " AND ".join(where)) if where else ""
        cur.execute(
            f"""SELECT i.*, c.name as cashbox_name, c.type as cashbox_type,
                       CONCAT('Н-', LPAD(wo.id::text, 4, '0')) as work_order_number,
                       cl.name as client_name,
                       bt.description as bank_description,
                       bt.counterparty as bank_counterparty
                FROM {t('incomes')} i
                LEFT JOIN {t('cashboxes')} c ON c.id = i.cashbox_id
                LEFT JOIN {t('work_orders')} wo ON wo.id = i.work_order_id
                LEFT JOIN {t('clients')} cl ON cl.id = i.client_id
                LEFT JOIN {t('bank_transactions')} bt ON bt.income_id = i.id
                {where_sql}
                ORDER BY COALESCE(i.operation_date, i.created_at::date) DESC, i.id DESC""",
            params,
        )
        return cur.fetchall()


def get_clients_list(conn):
    """Список клиентов для выпадающего списка"""
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(f"SELECT id, name, phone FROM {t('clients')} ORDER BY name")
        return cur.fetchall()


def get_transfers(conn, filters=None):
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        where = []
        params = []
        if filters:
            if filters.get('from_cashbox_id'):
                where.append("t.from_cashbox_id = %s")
                params.append(filters['from_cashbox_id'])
            if filters.get('to_cashbox_id'):
                where.append("t.to_cashbox_id = %s")
                params.append(filters['to_cashbox_id'])
        where_sql = (" WHERE " + " AND ".join(where)) if where else ""
        cur.execute(
            f"""SELECT t.*, fc.name as from_cashbox_name, fc.type as from_cashbox_type,
                       tc.name as to_cashbox_name, tc.type as to_cashbox_type
                FROM {t('transfers')} t
                LEFT JOIN {t('cashboxes')} fc ON fc.id = t.from_cashbox_id
                LEFT JOIN {t('cashboxes')} tc ON tc.id = t.to_cashbox_id
                {where_sql}
                ORDER BY t.created_at DESC""",
            params,
        )
        return cur.fetchall()


def get_fixed_costs(conn):
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(f"SELECT * FROM {t('fixed_costs')} ORDER BY category, name")
        return cur.fetchall()


def create_fixed_cost(conn, data):
    name = data.get('name', '').strip()
    amount = data.get('amount', 0)
    period = data.get('period', 'month')
    category = data.get('category', '').strip()
    comment = data.get('comment', '').strip()
    if not name or not amount:
        return resp(400, {'error': 'name and amount are required'})
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(
            f"""INSERT INTO {t('fixed_costs')} (name, amount, period, category, comment)
               VALUES (%s, %s, %s, %s, %s) RETURNING *""",
            (name, amount, period, category or None, comment or None),
        )
        row = cur.fetchone()
        conn.commit()
        return resp(201, {'fixed_cost': dict(row)})


def update_fixed_cost(conn, data):
    cost_id = data.get('id')
    if not cost_id:
        return resp(400, {'error': 'id is required'})
    fields = []
    params = []
    for f in ['name', 'amount', 'period', 'category', 'comment', 'is_active']:
        if f in data:
            fields.append(f"{f} = %s")
            params.append(data[f])
    if not fields:
        return resp(400, {'error': 'Nothing to update'})
    fields.append("updated_at = NOW()")
    params.append(cost_id)
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(
            f"UPDATE {t('fixed_costs')} SET {', '.join(fields)} WHERE id = %s RETURNING *",
            params,
        )
        row = cur.fetchone()
        if not row:
            return resp(404, {'error': 'Not found'})
        conn.commit()
        return resp(200, {'fixed_cost': dict(row)})


def delete_fixed_cost(conn, data):
    cost_id = data.get('id')
    if not cost_id:
        return resp(400, {'error': 'id is required'})
    with conn.cursor() as cur:
        cur.execute(f"DELETE FROM {t('fixed_costs')} WHERE id = %s", (cost_id,))
        conn.commit()
    return resp(200, {'success': True})


def get_economics(conn):
    """Расчёт экономики предприятия и точки безубыточности"""
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        # Постоянные расходы (месячные)
        cur.execute(f"""
            SELECT
                COALESCE(SUM(CASE WHEN period='month' THEN amount
                               WHEN period='year' THEN amount/12
                               WHEN period='week' THEN amount*4
                               WHEN period='day' THEN amount*30
                               ELSE amount END), 0) as monthly_fixed
            FROM {t('fixed_costs')} WHERE is_active = TRUE
        """)
        monthly_fixed = float(cur.fetchone()['monthly_fixed'])

        # Переменные расходы за текущий месяц
        cur.execute(f"""
            SELECT COALESCE(SUM(amount), 0) as total
            FROM {t('expenses')}
            WHERE created_at >= date_trunc('month', CURRENT_DATE)
        """)
        month_variable = float(cur.fetchone()['total'])

        # Выручка за текущий месяц
        cur.execute(f"""
            SELECT COALESCE(SUM(amount), 0) as total
            FROM {t('payments')}
            WHERE created_at >= date_trunc('month', CURRENT_DATE)
        """)
        month_revenue = float(cur.fetchone()['total'])

        # Выручка за предыдущий месяц
        cur.execute(f"""
            SELECT COALESCE(SUM(amount), 0) as total
            FROM {t('payments')}
            WHERE created_at >= date_trunc('month', CURRENT_DATE) - interval '1 month'
              AND created_at < date_trunc('month', CURRENT_DATE)
        """)
        prev_month_revenue = float(cur.fetchone()['total'])

        # Среднемесячная выручка (последние 3 месяца)
        cur.execute(f"""
            SELECT COALESCE(AVG(monthly_sum), 0) as avg_rev
            FROM (
                SELECT date_trunc('month', created_at) as mo, SUM(amount) as monthly_sum
                FROM {t('payments')}
                WHERE created_at >= date_trunc('month', CURRENT_DATE) - interval '3 months'
                  AND created_at < date_trunc('month', CURRENT_DATE)
                GROUP BY mo
            ) sub
        """)
        avg_month_revenue = float(cur.fetchone()['avg_rev'])

        # Среднемесячные переменные расходы (последние 3 месяца)
        cur.execute(f"""
            SELECT COALESCE(AVG(monthly_sum), 0) as avg_exp
            FROM (
                SELECT date_trunc('month', created_at) as mo, SUM(amount) as monthly_sum
                FROM {t('expenses')}
                WHERE created_at >= date_trunc('month', CURRENT_DATE) - interval '3 months'
                  AND created_at < date_trunc('month', CURRENT_DATE)
                GROUP BY mo
            ) sub
        """)
        avg_month_variable = float(cur.fetchone()['avg_exp'])

        # Количество закрытых заказ-нарядов за текущий месяц
        cur.execute(f"""
            SELECT COUNT(*) as cnt FROM {t('work_orders')}
            WHERE status IN ('done', 'issued')
              AND updated_at >= date_trunc('month', CURRENT_DATE)
        """)
        closed_orders_month = int(cur.fetchone()['cnt'])

        # Средний чек
        avg_check = (month_revenue / closed_orders_month) if closed_orders_month > 0 else 0

        # Маржинальность (%) — (выручка - переменные) / выручка
        gross_profit = month_revenue - month_variable
        margin_pct = (gross_profit / month_revenue * 100) if month_revenue > 0 else 0

        # Точка безубыточности
        # BEP по выручке = Постоянные / (1 - Переменные/Выручка)
        avg_variable_ratio = (avg_month_variable / avg_month_revenue) if avg_month_revenue > 0 else 0
        if avg_variable_ratio < 1 and avg_variable_ratio >= 0:
            bep_revenue = monthly_fixed / (1 - avg_variable_ratio)
        else:
            bep_revenue = 0

        # BEP в заказах
        bep_orders = (bep_revenue / avg_check) if avg_check > 0 else 0

        # Операционная прибыль
        operating_profit = month_revenue - month_variable - monthly_fixed

        # Запас прочности (%)
        safety_margin_pct = ((month_revenue - bep_revenue) / month_revenue * 100) if month_revenue > 0 and bep_revenue > 0 else 0

        return {
            'monthly_fixed': monthly_fixed,
            'month_variable': month_variable,
            'month_revenue': month_revenue,
            'prev_month_revenue': prev_month_revenue,
            'avg_month_revenue': avg_month_revenue,
            'avg_month_variable': avg_month_variable,
            'gross_profit': gross_profit,
            'margin_pct': round(margin_pct, 1),
            'operating_profit': operating_profit,
            'bep_revenue': round(bep_revenue, 2),
            'bep_orders': round(bep_orders, 1),
            'avg_check': round(avg_check, 2),
            'closed_orders_month': closed_orders_month,
            'safety_margin_pct': round(safety_margin_pct, 1),
        }


def create_expense_group(conn, data):
    name = data.get('name', '').strip()
    description = data.get('description', '').strip()
    if not name:
        return resp(400, {'error': 'name is required'})

    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(
            f"INSERT INTO {t('expense_groups')} (name, description) VALUES (%s, %s) RETURNING *",
            (name, description),
        )
        group = cur.fetchone()
        conn.commit()
        return resp(201, {'expense_group': dict(group)})


def update_expense_group(conn, data):
    group_id = data.get('group_id')
    if not group_id:
        return resp(400, {'error': 'group_id is required'})

    updates = []
    params = []
    if 'name' in data and data['name'].strip():
        updates.append("name = %s")
        params.append(data['name'].strip())
    if 'description' in data:
        updates.append("description = %s")
        params.append(data.get('description', ''))
    if 'is_active' in data:
        updates.append("is_active = %s")
        params.append(bool(data['is_active']))

    if not updates:
        return resp(400, {'error': 'Nothing to update'})

    params.append(group_id)
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(
            f"UPDATE {t('expense_groups')} SET {', '.join(updates)} WHERE id = %s RETURNING *",
            params,
        )
        group = cur.fetchone()
        if not group:
            return resp(404, {'error': 'Group not found'})
        conn.commit()
        return resp(200, {'expense_group': dict(group)})


def handler(event, context):
    """API финансов: кассы, платежи, расходы, дашборд, структура заказ-наряда"""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    method = event.get('httpMethod', 'GET')
    params = event.get('queryStringParameters') or {}

    conn = get_conn()
    try:
        if method == 'GET':
            print(f"[finance] GET section={params.get('section')} schema={SCHEMA}")
            section = params.get('section', 'dashboard')
            if section == 'dashboard':
                return resp(200, get_dashboard(conn))
            elif section == 'cashboxes':
                cashboxes = get_cashboxes(conn)
                return resp(200, {'cashboxes': [dict(c) for c in cashboxes]})
            elif section == 'payments':
                payments = get_payments(conn, params)
                return resp(200, {'payments': [dict(p) for p in payments]})
            elif section == 'expenses':
                expenses = get_expenses(conn, params)
                return resp(200, {'expenses': [dict(e) for e in expenses]})
            elif section == 'incomes':
                incomes = get_incomes(conn, params)
                return resp(200, {'incomes': [dict(i) for i in incomes]})
            elif section == 'transfers':
                transfers = get_transfers(conn, params)
                return resp(200, {'transfers': [dict(t) for t in transfers]})
            elif section == 'expense_groups':
                groups = get_expense_groups(conn)
                return resp(200, {'expense_groups': [dict(g) for g in groups]})
            elif section == 'fixed_costs':
                rows = get_fixed_costs(conn)
                return resp(200, {'fixed_costs': [dict(r) for r in rows]})
            elif section == 'economics':
                return resp(200, get_economics(conn))
            elif section == 'clients':
                clients = get_clients_list(conn)
                return resp(200, {'clients': [dict(c) for c in clients]})
            elif section == 'work_order_finance':
                work_order_id = params.get('work_order_id')
                if not work_order_id:
                    return resp(400, {'error': 'work_order_id is required'})
                data = get_work_order_finance(conn, int(work_order_id))
                if not data:
                    return resp(404, {'error': 'Work order not found'})
                return resp(200, data)
            return resp(400, {'error': 'Unknown section'})

        if method == 'POST':
            body = json.loads(event.get('body', '{}'))
            action = body.get('action', '')
            print(f"[finance] POST action={action} body={body}")

            actions_map = {
                'create_payment': lambda: create_payment(conn, body),
                'update_payment': lambda: update_payment(conn, body),
                'create_cashbox': lambda: create_cashbox(conn, body),
                'update_cashbox': lambda: update_cashbox(conn, body),
                'delete_cashbox': lambda: delete_cashbox(conn, body),
                'create_expense': lambda: create_expense(conn, body),
                'update_expense': lambda: update_expense(conn, body),
                'create_income': lambda: create_income(conn, body),
                'update_income': lambda: update_income(conn, body),
                'create_transfer': lambda: create_transfer(conn, body),
                'create_expense_group': lambda: create_expense_group(conn, body),
                'update_expense_group': lambda: update_expense_group(conn, body),
                'create_fixed_cost': lambda: create_fixed_cost(conn, body),
                'update_fixed_cost': lambda: update_fixed_cost(conn, body),
                'delete_fixed_cost': lambda: delete_fixed_cost(conn, body),
            }

            handler_fn = actions_map.get(action)
            if handler_fn:
                return handler_fn()

            return resp(400, {'error': 'Unknown action'})

        return resp(405, {'error': 'Method not allowed'})
    except Exception as e:
        import traceback
        print(f"[finance] ERROR: {e}\n{traceback.format_exc()}")
        return resp(400, {'error': str(e)})
    finally:
        conn.close()
"""API для финансов: кассы, платежи, показатели"""
import json
import os
import psycopg2
import psycopg2.extras

def _get_log_token(event):
    h = event.get('headers') or {}
    return h.get('X-Auth-Token') or h.get('x-auth-token') or ''

def get_user_by_token(token):
    if not token:
        return None
    try:
        _schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
        _conn = psycopg2.connect(os.environ['DATABASE_URL'])
        try:
            with _conn.cursor() as _cur:
                _cur.execute(
                    f"SELECT u.id, u.email, u.name, u.role FROM {_schema}.app_sessions s JOIN {_schema}.app_users u ON u.id = s.user_id WHERE s.token = %s AND s.expires_at > NOW() AND u.is_active = TRUE",
                    (token,)
                )
                row = _cur.fetchone()
                return {'id': row[0], 'email': row[1], 'name': row[2], 'role': row[3]} if row else None
        finally:
            _conn.close()
    except Exception:
        return None

def write_log(user, module, action, entity_type='', entity_id=None, entity_label='', description='', ip_address=None):
    try:
        _schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
        _conn = psycopg2.connect(os.environ['DATABASE_URL'])
        try:
            with _conn.cursor() as _cur:
                _cur.execute(
                    f"INSERT INTO {_schema}.activity_log (user_id, user_name, user_email, module, action, entity_type, entity_id, entity_label, description, ip_address) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)",
                    (user['id'] if user else None, user['name'] if user else 'Система', user['email'] if user else '', module, action, entity_type, entity_id, entity_label, description, ip_address)
                )
                _conn.commit()
        finally:
            _conn.close()
    except Exception as e:
        print(f'[activity_log] error: {e}')

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token, X-Session-Id',
    'Access-Control-Max-Age': '86400',
}

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 'public')


# Функция для получения полного имени таблицы с учетом схемы
def t(name):
    return f'{SCHEMA}.{name}'


# Функция для создания подключения к базе данных
# conn - объект подключения к PostgreSQL
def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


# Функция для формирования HTTP-ответа в формате JSON
# status_code - код статуса HTTP
# body - тело ответа (словарь или список)
def resp(status_code, body):
    return {
        'statusCode': status_code,
        'headers': {**CORS_HEADERS, 'Content-Type': 'application/json'},
        'body': json.dumps(body, default=str, ensure_ascii=False),
    }


# Функция для получения списка всех касс
# conn - подключение к базе данных
# Возвращает список касс с их балансами и общей суммой поступлений
def get_cashboxes(conn):
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(f"SELECT * FROM {t('cashboxes')} ORDER BY id")
        return cur.fetchall()


# Функция для получения списка платежей с фильтрацией
# conn - подключение к базе данных
# filters - словарь с фильтрами (work_order_id, cashbox_id, date_from, date_to)
# Возвращает список платежей с информацией о кассах и заказ-нарядах
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
                where.append("COALESCE(p.operation_date, p.created_at::date) >= %s")
                params.append(filters['date_from'])
            if filters.get('date_to'):
                where.append("COALESCE(p.operation_date, p.created_at::date) <= %s::date")
                params.append(filters['date_to'])

        where_sql = (" WHERE " + " AND ".join(where)) if where else ""
        cur.execute(
            f"""SELECT p.*, c.name as cashbox_name, c.type as cashbox_type,
                       wo.client_name, CONCAT('Н-', LPAD(wo.id::text, 4, '0')) as work_order_number
                FROM {t('payments')} p
                LEFT JOIN {t('cashboxes')} c ON c.id = p.cashbox_id
                LEFT JOIN {t('work_orders')} wo ON wo.id = p.work_order_id
                {where_sql}
                ORDER BY COALESCE(p.operation_date, p.created_at::date) DESC, p.id DESC""",
            params,
        )
        return cur.fetchall()


# Функция для получения данных для финансовой дашборда
# conn - подключение к базе данных
# Возвращает сводную финансовую информацию: выручка, расходы, кассы, показатели
def get_dashboard(conn):
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(f"SELECT COALESCE(SUM(amount), 0) as total FROM {t('payments')}")
        total_revenue = cur.fetchone()['total']

        cur.execute(f"""SELECT COALESCE(SUM(amount), 0) as total FROM {t('payments')}
                       WHERE COALESCE(operation_date, created_at::date) >= date_trunc('month', CURRENT_DATE)""")
        month_revenue = cur.fetchone()['total']

        cur.execute(f"""SELECT COALESCE(SUM(amount), 0) as total FROM {t('payments')}
                       WHERE COALESCE(operation_date, created_at::date) >= CURRENT_DATE""")
        today_revenue = cur.fetchone()['total']

        cur.execute(f"SELECT COUNT(*) as cnt FROM {t('payments')}")
        total_payments = cur.fetchone()['cnt']

        cur.execute(f"""SELECT COALESCE(SUM(amount), 0) as total FROM {t('payments')}
                       WHERE COALESCE(operation_date, created_at::date) >= date_trunc('month', CURRENT_DATE) - interval '1 month'
                       AND COALESCE(operation_date, created_at::date) < date_trunc('month', CURRENT_DATE)""")
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
                       WHERE COALESCE(operation_date, created_at::date) >= date_trunc('month', CURRENT_DATE)
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
            SELECT to_char(date_trunc('month', COALESCE(p.operation_date, p.created_at::date)), 'YYYY-MM') as month,
                   COALESCE(SUM(p.amount), 0) as revenue
            FROM {t('payments')} p
            WHERE COALESCE(p.operation_date, p.created_at::date) >= date_trunc('month', CURRENT_DATE) - interval '5 months'
            GROUP BY date_trunc('month', COALESCE(p.operation_date, p.created_at::date))
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


# Функция для получения финансовой информации по конкретному заказ-наряду
# conn - подключение к базе данных
# work_order_id - ID заказ-наряда
# Возвращает полную финансовую сводку по заказу: работы, запчасти, платежи, расходы, приходы
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
            f"SELECT COALESCE(SUM(price), 0) as total FROM {t('work_order_works')} WHERE work_order_id = %s",
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
        incomes_total = sum(float(i['amount']) for i in incomes)
        # Если есть платежи — приходы считаются подтверждающими и не суммируются
        # Если платежей нет — приходы учитываются как поступления
        if paid > 0:
            total_income = paid
        else:
            total_income = paid + incomes_total
        effective_paid = paid if paid > 0 else incomes_total
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
            'debt': max(0, order_total - effective_paid),
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


# Функция для создания нового платежа
# conn - подключение к базе данных
# data - словарь с данными платежа (work_order_id, cashbox_id, amount, payment_method, comment, operation_date)
# Возвращает созданный платеж или ошибку валидации
def create_payment(conn, data):
    work_order_id = data.get('work_order_id')
    cashbox_id = data.get('cashbox_id')
    amount = data.get('amount', 0)
    payment_method = data.get('payment_method', 'cash')
    comment = data.get('comment', '')
    operation_date = data.get('operation_date') or None

    if not work_order_id or not cashbox_id or not amount:
        return resp(400, {'error': 'work_order_id, cashbox_id and amount are required'})

    if payment_method not in ('cash', 'card', 'transfer', 'online'):
        return resp(400, {'error': 'Invalid payment method'})

    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(
            f"""INSERT INTO {t('payments')} (work_order_id, cashbox_id, amount, payment_method, comment, operation_date)
               VALUES (%s, %s, %s, %s, %s, %s) RETURNING *""",
            (work_order_id, cashbox_id, amount, payment_method, comment, operation_date),
        )
        payment = cur.fetchone()

        cur.execute(
            f"UPDATE {t('cashboxes')} SET balance = balance + %s WHERE id = %s",
            (amount, cashbox_id),
        )

        conn.commit()
        return resp(201, {'payment': dict(payment)})


# Функция для обновления данных платежа
# conn - подключение к базе данных
# data - словарь с данными для обновления (payment_id, cashbox_id, payment_method, comment, operation_date)
# Возвращает обновленный платеж или ошибку
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
        operation_date = data.get('operation_date', old.get('operation_date'))
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
               SET cashbox_id = %s, payment_method = %s, comment = %s, operation_date = %s
               WHERE id = %s RETURNING *""",
            (new_cashbox_id, payment_method, comment, operation_date or None, payment_id),
        )
        updated = cur.fetchone()
        conn.commit()
        return resp(200, {'payment': dict(updated)})


# Функция для создания новой кассы
# conn - подключение к базе данных
# data - словарь с данными кассы (name, type)
# Возвращает созданную кассу или ошибку валидации
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


# Функция для обновления данных кассы
# conn - подключение к базе данных
# data - словарь с данными для обновления (cashbox_id, name, type, is_active)
# Возвращает обновленную кассу или ошибку
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


# Функция для удаления кассы
# conn - подключение к базе данных
# data - словарь с ID кассы для удаления (cashbox_id)
# Возвращает успешный результат или ошибку, если у кассы есть платежи
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


# Функция для получения групп расходов с суммами за период
# conn - подключение к базе данных
# month_start - начало периода (опционально)
# month_end - конец периода (опционально)
# Возвращает список групп расходов с суммами и количеством расходов
def get_expense_groups(conn, month_start=None, month_end=None):
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        if month_start and month_end:
            cur.execute(f"""
                SELECT eg.id, eg.name, eg.description, eg.is_active, eg.created_at,
                       eg.parent_id, eg.cost_type,
                       COALESCE(SUM(e.amount), 0) as total_spent,
                       COUNT(e.id) as expense_count
                FROM {t('expense_groups')} eg
                LEFT JOIN {t('expenses')} e ON e.expense_group_id = eg.id
                    AND COALESCE(e.operation_date, e.created_at::date) >= %s
                    AND COALESCE(e.operation_date, e.created_at::date) < %s
                GROUP BY eg.id, eg.parent_id, eg.cost_type
                ORDER BY eg.parent_id NULLS FIRST, eg.name
            """, (month_start, month_end))
        else:
            cur.execute(f"""
                SELECT eg.id, eg.name, eg.description, eg.is_active, eg.created_at,
                       eg.parent_id, eg.cost_type,
                       COALESCE(SUM(e.amount), 0) as total_spent,
                       COUNT(e.id) as expense_count
                FROM {t('expense_groups')} eg
                LEFT JOIN {t('expenses')} e ON e.expense_group_id = eg.id
                GROUP BY eg.id, eg.parent_id, eg.cost_type
                ORDER BY eg.parent_id NULLS FIRST, eg.name
            """)
        return cur.fetchall()


# Функция для получения списка расходов с фильтрацией
# conn - подключение к базе данных
# filters - словарь с фильтрами (expense_group_id, cashbox_id, work_order_id)
# Возвращает список расходов с информацией о группах, кассах, заказ-нарядах
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

        # Проверяем наличие таблицы bank_transactions
        cur.execute(f"""
            SELECT EXISTS (
                SELECT FROM information_schema.tables
                WHERE table_schema = '{SCHEMA}' AND table_name = 'bank_transactions'
            )
        """)
        has_bank_tx = cur.fetchone()['exists']
        bank_tx_col = f"(SELECT COUNT(*) > 0 FROM {t('bank_transactions')} bt WHERE bt.expense_id = e.id) as has_bank_tx" if has_bank_tx else "FALSE as has_bank_tx"

        cur.execute(
            f"""SELECT e.*, c.name as cashbox_name, c.type as cashbox_type,
                       eg.name as group_name,
                       CONCAT('Н-', LPAD(wo.id::text, 4, '0')) as work_order_number,
                       sr.receipt_number as stock_receipt_number,
                       cl.name as client_name,
                       {bank_tx_col}
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


# Функция для создания нового расхода
# conn - подключение к базе данных
# data - словарь с данными расхода (cashbox_id, amount, expense_group_id, work_order_id, stock_receipt_id, comment, client_id, operation_date)
# Возвращает созданный расход или ошибку валидации
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


# Функция для обновления данных расхода
# conn - подключение к базе данных
# data - словарь с данными для обновления (expense_id, cashbox_id, expense_group_id, work_order_id, stock_receipt_id, comment, client_id, operation_date)
# Возвращает обновленный расход или ошибку
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


# Функция для создания нового прихода
# conn - подключение к базе данных
# data - словарь с данными прихода (cashbox_id, amount, income_type, work_order_id, comment, client_id, operation_date, income_group_id)
# Возвращает созданный приход или ошибку валидации
def create_income(conn, data):
    """Создание приходного ордера"""
    cashbox_id = data.get('cashbox_id')
    amount = data.get('amount', 0)
    income_type = data.get('income_type', 'other')
    work_order_id = data.get('work_order_id')
    comment = data.get('comment', '')
    client_id = data.get('client_id')
    operation_date = data.get('operation_date')
    income_group_id = data.get('income_group_id')

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
                (cashbox_id, amount, income_type, comment, work_order_id, client_id, operation_date, income_group_id)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s) RETURNING *""",
            (cashbox_id, amount, income_type, comment,
             work_order_id if work_order_id else None,
             int(client_id) if client_id else None,
             operation_date or None,
             int(income_group_id) if income_group_id else None),
        )
        income = cur.fetchone()
        cur.execute(
            f"UPDATE {t('cashboxes')} SET balance = balance + %s WHERE id = %s",
            (amount, cashbox_id),
        )
        conn.commit()
        return resp(201, {'income': dict(income)})


# Функция для обновления данных прихода
# conn - подключение к базе данных
# data - словарь с данными для обновления (income_id, cashbox_id, income_type, work_order_id, comment, client_id, operation_date, income_group_id)
# Возвращает обновленный приход или ошибку
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
        income_group_id = data.get('income_group_id')
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
                   work_order_id = %s, client_id = %s, operation_date = %s,
                   income_group_id = %s
               WHERE id = %s RETURNING *""",
            (
                new_cashbox_id, income_type, comment,
                int(work_order_id) if work_order_id else None,
                int(client_id) if client_id else None,
                operation_date or None,
                int(income_group_id) if income_group_id else None,
                income_id,
            ),
        )
        updated = cur.fetchone()
        conn.commit()
        return resp(200, {'income': dict(updated)})


# Функция для создания перемещения между кассами
# conn - подключение к базе данных
# data - словарь с данными перемещения (from_cashbox_id, to_cashbox_id, amount, comment)
# Возвращает созданное перемещение или ошибку валидации
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


# Функция для получения списка приходов с фильтрацией
# conn - подключение к базе данных
# filters - словарь с фильтрами (cashbox_id, work_order_id)
# Возвращает список приходов с информацией о кассах, заказ-нарядах, клиентах, банковских транзакциях
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

        # Проверяем наличие таблицы bank_transactions для LEFT JOIN
        cur.execute(f"""
            SELECT EXISTS (
                SELECT FROM information_schema.tables
                WHERE table_schema = '{SCHEMA}' AND table_name = 'bank_transactions'
            )
        """)
        has_bt = cur.fetchone()['exists']

        if has_bt:
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
        else:
            cur.execute(
                f"""SELECT i.*, c.name as cashbox_name, c.type as cashbox_type,
                           CONCAT('Н-', LPAD(wo.id::text, 4, '0')) as work_order_number,
                           cl.name as client_name,
                           NULL as bank_description,
                           NULL as bank_counterparty
                    FROM {t('incomes')} i
                    LEFT JOIN {t('cashboxes')} c ON c.id = i.cashbox_id
                    LEFT JOIN {t('work_orders')} wo ON wo.id = i.work_order_id
                    LEFT JOIN {t('clients')} cl ON cl.id = i.client_id
                    {where_sql}
                    ORDER BY COALESCE(i.operation_date, i.created_at::date) DESC, i.id DESC""",
                params,
            )
        return cur.fetchall()


# Функция для получения списка клиентов для выпадающих списков
# conn - подключение к базе данных
# Возвращает список клиентов с ID, именем и телефоном
def get_clients_list(conn):
    """Список клиентов для выпадающего списка"""
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(f"SELECT id, name, phone FROM {t('clients')} ORDER BY name")
        return cur.fetchall()


# ─── Группы приходов ─────────────────────────────────────────────────────────

TOCHKA_PATTERNS = ['банк точка', 'точка', 'qr код', 'зачисление по qr']
SBER_PATTERNS = ['сибирский банк', 'сбербанк', 'sberbank']


# Функция для автоматического определения группы прихода по данным банковской транзакции
# counterparty - контрагент из банковской транзакции
# description - описание из банковской транзакции
# groups - список групп приходов
# Возвращает ID группы или None
def detect_income_group(counterparty: str, description: str, groups: list) -> int | None:
    """Автоматически определяет группу прихода по контрагенту/описанию банковской транзакции."""
    cp = (counterparty or '').lower()
    desc = (description or '').lower()
    combined = cp + ' ' + desc

    is_tochka = any(p in combined for p in TOCHKA_PATTERNS)
    is_sber = any(p in combined for p in SBER_PATTERNS)

    group_map = {g['name']: g['id'] for g in groups}

    if is_tochka:
        return group_map.get('QR-оплаты (Точка)')
    if is_sber:
        return group_map.get('Эквайринг (Сбербанк)')
    return None


# Функция для получения групп приходов с суммами за период
# conn - подключение к базе данных
# month_start - начало периода (опционально)
# month_end - конец периода (опционально)
# Возвращает список групп приходов с суммами и количеством приходов
def get_income_groups(conn, month_start=None, month_end=None):
    """Список групп приходов с суммами за период."""
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        # Убедимся что базовые группы существуют
        cur.execute(f"SELECT COUNT(*) as cnt FROM {t('income_groups')}")
        cnt = cur.fetchone()['cnt']
        if cnt == 0:
            cur.execute(f"""
                INSERT INTO {t('income_groups')} (name, description) VALUES
                    ('Оплата услуг', 'Оплата клиентами за услуги автосервиса'),
                    ('QR-оплаты (Точка)', 'Зачисления по QR-коду через Банк Точка'),
                    ('Эквайринг (Сбербанк)', 'Поступления через терминал Сибирский банк ПАО Сбербанк'),
                    ('Прочие поступления', 'Прочие доходы')
            """)
            conn.commit()

        if month_start and month_end:
            cur.execute(f"""
                SELECT ig.id, ig.name, ig.description, ig.is_active, ig.created_at,
                       COALESCE(SUM(i.amount), 0) as total_received,
                       COUNT(i.id) as income_count
                FROM {t('income_groups')} ig
                LEFT JOIN {t('incomes')} i ON i.income_group_id = ig.id
                    AND COALESCE(i.operation_date, i.created_at::date) >= %s
                    AND COALESCE(i.operation_date, i.created_at::date) < %s
                GROUP BY ig.id
                ORDER BY ig.name
            """, (month_start, month_end))
        else:
            cur.execute(f"""
                SELECT ig.id, ig.name, ig.description, ig.is_active, ig.created_at,
                       COALESCE(SUM(i.amount), 0) as total_received,
                       COUNT(i.id) as income_count
                FROM {t('income_groups')} ig
                LEFT JOIN {t('incomes')} i ON i.income_group_id = ig.id
                GROUP BY ig.id
                ORDER BY ig.name
            """)
        return cur.fetchall()


# Функция для получения приходов по конкретной группе за выбранный месяц
# conn - подключение к базе данных
# params - параметры запроса (group_id, month_offset)
# Возвращает список приходов по группе или ошибку
def get_incomes_by_group(conn, params):
    """Приходы по конкретной группе за выбранный месяц."""
    group_id = params.get('group_id')
    if not group_id:
        return resp(400, {'error': 'group_id is required'})
    month_offset = int(params.get('month_offset', 0))

    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(f"""
            SELECT i.*, c.name as cashbox_name, cl.name as client_name,
                   bt.description as bank_description, bt.counterparty as bank_counterparty
            FROM {t('incomes')} i
            LEFT JOIN {t('cashboxes')} c ON c.id = i.cashbox_id
            LEFT JOIN {t('clients')} cl ON cl.id = i.client_id
            LEFT JOIN {t('bank_transactions')} bt ON bt.income_id = i.id
            WHERE i.income_group_id = %s
              AND date_trunc('month', COALESCE(i.operation_date, i.created_at::date))
                  = date_trunc('month', CURRENT_DATE + ({month_offset} * INTERVAL '1 month'))
            ORDER BY COALESCE(i.operation_date, i.created_at) DESC
            LIMIT 200
        """, (group_id,))
        rows = cur.fetchall()
        return resp(200, {'incomes': [dict(r) for r in rows]})


# Функция для автоматической привязки приходов из банка к группам
# conn - подключение к базе данных
# Возвращает количество обновленных приходов
def auto_assign_income_groups(conn):
    """Автоматически привязывает приходы из банка к группам по контрагенту."""
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        groups = get_income_groups(conn)
        groups_list = [dict(g) for g in groups]

        cur.execute(f"""
            SELECT i.id, bt.counterparty, bt.description
            FROM {t('incomes')} i
            JOIN {t('bank_transactions')} bt ON bt.income_id = i.id
            WHERE i.income_group_id IS NULL
        """)
        rows = cur.fetchall()

        updated = 0
        for row in rows:
            group_id = detect_income_group(row['counterparty'], row['description'], groups_list)
            if group_id:
                cur.execute(
                    f"UPDATE {t('incomes')} SET income_group_id = %s WHERE id = %s",
                    (group_id, row['id'])
                )
                updated += 1

        conn.commit()
        return resp(200, {'updated': updated})


# Функция для создания новой группы приходов
# conn - подключение к базе данных
# data - словарь с данными группы (name, description)
# Возвращает созданную группу или ошибку валидации
def create_income_group(conn, data):
    name = (data.get('name') or '').strip()
    if not name:
        return resp(400, {'error': 'name is required'})
    description = (data.get('description') or '').strip()
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(
            f"INSERT INTO {t('income_groups')} (name, description) VALUES (%s, %s) RETURNING *",
            (name, description)
        )
        group = cur.fetchone()
        conn.commit()
        return resp(201, {'income_group': dict(group)})


# Функция для обновления данных группы приходов
# conn - подключение к базе данных
# data - словарь с данными для обновления (group_id, name, description, is_active)
# Возвращает обновленную группу или ошибку
def update_income_group(conn, data):
    group_id = data.get('group_id')
    if not group_id:
        return resp(400, {'error': 'group_id is required'})
    updates, params = [], []
    if 'name' in data and data['name'].strip():
        updates.append("name = %s"); params.append(data['name'].strip())
    if 'description' in data:
        updates.append("description = %s"); params.append(data.get('description', ''))
    if 'is_active' in data:
        updates.append("is_active = %s"); params.append(bool(data['is_active']))
    if not updates:
        return resp(400, {'error': 'Nothing to update'})
    params.append(group_id)
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(
            f"UPDATE {t('income_groups')} SET {', '.join(updates)} WHERE id = %s RETURNING *",
            params
        )
        group = cur.fetchone()
        if not group:
            return resp(404, {'error': 'Group not found'})
        conn.commit()
        return resp(200, {'income_group': dict(group)})


# Функция для удаления группы приходов
# conn - подключение к базе данных
# data - словарь с ID группы для удаления (group_id)
# Возвращает успешный результат или ошибку, если группа не найдена
def delete_income_group(conn, data):
    group_id = data.get('group_id')
    if not group_id:
        return resp(400, {'error': 'group_id is required'})
    with conn.cursor() as cur:
        cur.execute(f"UPDATE {t('incomes')} SET income_group_id = NULL WHERE income_group_id = %s", (group_id,))
        cur.execute(f"DELETE FROM {t('income_groups')} WHERE id = %s RETURNING id", (group_id,))
        row = cur.fetchone()
        if not row:
            return resp(404, {'error': 'Group not found'})
        conn.commit()
        return resp(200, {'deleted': True})


# Функция для получения списка перемещений между кассами
# conn - подключение к базе данных
# filters - словарь с фильтрами (from_cashbox_id, to_cashbox_id)
# Возвращает список перемещений с информацией о кассах-отправителях и получателях
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


# Функция для получения списка постоянных расходов
# conn - подключение к базе данных
# Возвращает список постоянных расходов с категориями
def get_fixed_costs(conn):
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(f"SELECT * FROM {t('fixed_costs')} ORDER BY category, name")
        return cur.fetchall()


# Функция для создания нового постоянного расхода
# conn - подключение к базе данных
# data - словарь с данными расхода (name, amount, period, category, comment)
# Возвращает созданный расход или ошибку валидации
def create_fixed_cost(conn, data):
    name = (data.get('name') or '').strip()
    amount = data.get('amount', 0)
    period = data.get('period', 'month')
    category = (data.get('category') or '').strip()
    comment = (data.get('comment') or '').strip()
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


# Функция для обновления данных постоянного расхода
# conn - подключение к базе данных
# data - словарь с данными для обновления (id, name, amount, period, category, comment, is_active)
# Возвращает обновленный расход или ошибку
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


# Функция для удаления постоянного расхода
# conn - подключение к базе данных
# data - словарь с ID расхода для удаления (id)
# Возвращает успешный результат
def delete_fixed_cost(conn, data):
    cost_id = data.get('id')
    if not cost_id:
        return resp(400, {'error': 'id is required'})
    with conn.cursor() as cur:
        cur.execute(f"DELETE FROM {t('fixed_costs')} WHERE id = %s", (cost_id,))
        conn.commit()
    return resp(200, {'success': True})


# Функция для импорта постоянных расходов из Excel
# conn - подключение к базе данных
# data - словарь со списком расходов (rows)
# Возвращает количество добавленных расходов
def import_fixed_costs(conn, data):
    """Bulk import постоянных расходов из Excel (массив строк)"""
    rows = data.get('rows', [])
    if not rows:
        return resp(400, {'error': 'rows is required'})
    inserted = 0
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        for row in rows:
            name = (row.get('name') or '').strip()
            amount_raw = row.get('amount', 0)
            try:
                amount = float(str(amount_raw).replace(',', '.').replace(' ', ''))
            except Exception:
                continue
            if not name or not amount:
                continue
            period = (row.get('period') or 'month').strip()
            if period not in ('day', 'week', 'month', 'year'):
                period = 'month'
            category = (row.get('category') or '').strip() or None
            comment = (row.get('comment') or '').strip() or None
            cur.execute(
                f"INSERT INTO {t('fixed_costs')} (name, amount, period, category, comment) VALUES (%s, %s, %s, %s, %s)",
                (name, amount, period, category, comment),
            )
            inserted += 1
        conn.commit()
    return resp(200, {'inserted': inserted})


# Функция для расчета экономики предприятия и точки безубыточности
# conn - подключение к базе данных
# month_offset - смещение месяца для расчета (0 - текущий месяц)
# Возвращает экономические показатели: выручка, расходы, прибыль, точки безубыточности
def get_economics(conn, month_offset=0):
    """Расчёт экономики предприятия и точки безубыточности за выбранный месяц"""
    from datetime import date
    import calendar

    today = date.today()
    # Вычисляем первый день выбранного месяца
    year = today.year
    month = today.month + month_offset
    while month <= 0:
        month += 12
        year -= 1
    while month > 12:
        month -= 12
        year += 1
    month_start = date(year, month, 1)
    month_start_str = month_start.isoformat()
    # Первый день следующего месяца
    if month == 12:
        month_end_next_str = date(year + 1, 1, 1).isoformat()
    else:
        month_end_next_str = date(year, month + 1, 1).isoformat()

    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        # Постоянные расходы за выбранный месяц (из списка расходов с группами типа 'fixed')
        cur.execute(f"""
            SELECT COALESCE(SUM(e.amount), 0) as total
            FROM {t('expenses')} e
            JOIN {t('expense_groups')} eg ON eg.id = e.expense_group_id
            WHERE eg.cost_type = 'fixed'
              AND COALESCE(e.operation_date, e.created_at::date) >= '{month_start_str}'::date
              AND COALESCE(e.operation_date, e.created_at::date) < '{month_end_next_str}'::date
        """)
        monthly_fixed = float(cur.fetchone()['total'])

        # Переменные расходы за выбранный месяц (из списка расходов с группами типа 'variable')
        cur.execute(f"""
            SELECT COALESCE(SUM(e.amount), 0) as total
            FROM {t('expenses')} e
            JOIN {t('expense_groups')} eg ON eg.id = e.expense_group_id
            WHERE eg.cost_type = 'variable'
              AND COALESCE(e.operation_date, e.created_at::date) >= '{month_start_str}'::date
              AND COALESCE(e.operation_date, e.created_at::date) < '{month_end_next_str}'::date
        """)
        month_variable = float(cur.fetchone()['total'])

        # Выручка за выбранный месяц (по дате поступления платежа)
        cur.execute(f"""
            SELECT COALESCE(SUM(amount), 0) as total
            FROM {t('payments')}
            WHERE COALESCE(operation_date, created_at::date) >= '{month_start_str}'::date
              AND COALESCE(operation_date, created_at::date) < '{month_end_next_str}'::date
        """)
        month_revenue = float(cur.fetchone()['total'])

        # Выручка за предыдущий месяц (по дате поступления платежа)
        prev_year = year
        prev_month = month - 1
        if prev_month <= 0:
            prev_month = 12
            prev_year -= 1
        prev_start = date(prev_year, prev_month, 1).isoformat()
        prev_end = month_start_str
        cur.execute(f"""
            SELECT COALESCE(SUM(amount), 0) as total
            FROM {t('payments')}
            WHERE COALESCE(operation_date, created_at::date) >= '{prev_start}'::date
              AND COALESCE(operation_date, created_at::date) < '{prev_end}'::date
        """)
        prev_month_revenue = float(cur.fetchone()['total'])

        # Среднемесячная выручка (3 месяца до выбранного)
        three_months_ago_year = year
        three_months_ago_month = month - 3
        while three_months_ago_month <= 0:
            three_months_ago_month += 12
            three_months_ago_year -= 1
        three_months_ago = date(three_months_ago_year, three_months_ago_month, 1).isoformat()
        cur.execute(f"""
            SELECT COALESCE(AVG(monthly_sum), 0) as avg_rev
            FROM (
                SELECT date_trunc('month', COALESCE(operation_date, created_at::date)) as mo, SUM(amount) as monthly_sum
                FROM {t('payments')}
                WHERE COALESCE(operation_date, created_at::date) >= '{three_months_ago}'::date
                  AND COALESCE(operation_date, created_at::date) < '{month_start_str}'::date
                GROUP BY mo
            ) sub
        """)
        avg_month_revenue = float(cur.fetchone()['avg_rev'])

        # Среднемесячные переменные расходы (3 месяца до выбранного)
        cur.execute(f"""
            SELECT COALESCE(AVG(monthly_sum), 0) as avg_exp
            FROM (
                SELECT date_trunc('month', COALESCE(operation_date::timestamp, created_at)) as mo,
                       SUM(amount) as monthly_sum
                FROM {t('expenses')}
                WHERE COALESCE(operation_date, created_at::date) >= '{three_months_ago}'::date
                  AND COALESCE(operation_date, created_at::date) < '{month_start_str}'::date
                GROUP BY mo
            ) sub
        """)
        avg_month_variable = float(cur.fetchone()['avg_exp'])

        # Количество платежей за выбранный месяц
        cur.execute(f"""
            SELECT COUNT(*) as cnt FROM {t('payments')}
            WHERE created_at::date >= '{month_start_str}'::date
              AND created_at::date < '{month_end_next_str}'::date
        """)
        closed_orders_month = int(cur.fetchone()['cnt'])

        # Расходы по группам за выбранный месяц
        # Проверяем наличие колонки parent_id
        cur.execute(f"""
            SELECT EXISTS (
                SELECT FROM information_schema.columns
                WHERE table_schema = '{SCHEMA}' AND table_name = 'expense_groups' AND column_name = 'parent_id'
            )
        """)
        has_parent_col = cur.fetchone()['exists']
        eg_parent_col = ", eg.parent_id" if has_parent_col else ""
        eg_order = "ORDER BY eg.parent_id NULLS FIRST, eg.name" if has_parent_col else "ORDER BY eg.name"

        cur.execute(f"""
            SELECT eg.id, eg.name, eg.cost_type {eg_parent_col},
                   COALESCE(SUM(e.amount), 0) as total_spent,
                   COUNT(e.id) as expense_count
            FROM {t('expense_groups')} eg
            LEFT JOIN {t('expenses')} e ON e.expense_group_id = eg.id
                AND COALESCE(e.operation_date, e.created_at::date) >= '{month_start_str}'::date
                AND COALESCE(e.operation_date, e.created_at::date) < '{month_end_next_str}'::date
            WHERE eg.is_active = TRUE
            GROUP BY eg.id, eg.name, eg.cost_type {eg_parent_col}
            {eg_order}
        """)
        expense_groups = [dict(r) for r in cur.fetchall()]

        # === KPI из заказ-нарядов ===
        # Распределяем РЕАЛЬНЫЕ платежи (month_revenue) по услугам и запчастям
        # через пропорцию состава каждого заказ-наряда
        cur.execute(f"""
            SELECT
                COALESCE(SUM(
                    p.amount * CASE
                        WHEN (COALESCE(wo_svc.svc, 0) + COALESCE(wo_pts.pts, 0)) > 0
                        THEN COALESCE(wo_svc.svc, 0) / (COALESCE(wo_svc.svc, 0) + COALESCE(wo_pts.pts, 0))
                        ELSE 1.0
                    END
                ), 0) as services_revenue,
                COALESCE(SUM(
                    p.amount * CASE
                        WHEN (COALESCE(wo_svc.svc, 0) + COALESCE(wo_pts.pts, 0)) > 0
                        THEN COALESCE(wo_pts.pts, 0) / (COALESCE(wo_svc.svc, 0) + COALESCE(wo_pts.pts, 0))
                        ELSE 0.0
                    END
                ), 0) as parts_revenue
            FROM {t('payments')} p
            LEFT JOIN (
                SELECT work_order_id, SUM(price * COALESCE(qty, 1)) as svc
                FROM {t('work_order_works')}
                GROUP BY work_order_id
            ) wo_svc ON wo_svc.work_order_id = p.work_order_id
            LEFT JOIN (
                SELECT work_order_id, SUM(sell_price * qty) as pts
                FROM {t('work_order_parts')}
                GROUP BY work_order_id
            ) wo_pts ON wo_pts.work_order_id = p.work_order_id
            WHERE COALESCE(p.operation_date, p.created_at::date) >= '{month_start_str}'::date
              AND COALESCE(p.operation_date, p.created_at::date) < '{month_end_next_str}'::date
        """)
        row = cur.fetchone()
        services_revenue = float(row['services_revenue'])
        parts_revenue = float(row['parts_revenue'])

        # Себестоимость запчастей из заказ-нарядов (пропорционально оплаченным)
        cur.execute(f"""
            SELECT
                COALESCE(SUM(
                    CASE
                        WHEN (COALESCE(wo_svc.svc, 0) + COALESCE(wo_pts.pts, 0)) > 0
                        THEN p.amount
                             * COALESCE(wo_pts.pts, 0) / (COALESCE(wo_svc.svc, 0) + COALESCE(wo_pts.pts, 0))
                             * CASE WHEN COALESCE(wo_pts.pts, 0) > 0
                                    THEN COALESCE(wo_cost.cst, 0) / COALESCE(wo_pts.pts, 1)
                                    ELSE 0 END
                        ELSE 0
                    END
                ), 0) as parts_cost
            FROM {t('payments')} p
            LEFT JOIN (
                SELECT work_order_id, SUM(price * COALESCE(qty, 1)) as svc
                FROM {t('work_order_works')}
                GROUP BY work_order_id
            ) wo_svc ON wo_svc.work_order_id = p.work_order_id
            LEFT JOIN (
                SELECT work_order_id, SUM(sell_price * qty) as pts
                FROM {t('work_order_parts')}
                GROUP BY work_order_id
            ) wo_pts ON wo_pts.work_order_id = p.work_order_id
            LEFT JOIN (
                SELECT work_order_id, SUM(purchase_price * qty) as cst
                FROM {t('work_order_parts')}
                GROUP BY work_order_id
            ) wo_cost ON wo_cost.work_order_id = p.work_order_id
            WHERE COALESCE(p.operation_date, p.created_at::date) >= '{month_start_str}'::date
              AND COALESCE(p.operation_date, p.created_at::date) < '{month_end_next_str}'::date
        """)
        parts_cost = float(cur.fetchone()['parts_cost'])

        # Нормочасы из заказ-нарядов (по дате создания, для аналитики)
        cur.execute(f"""
            SELECT
                COALESCE(SUM(ww.norm_hours * ww.qty), 0) as norm_hours_closed
            FROM {t('work_orders')} wo
            JOIN {t('work_order_works')} ww ON ww.work_order_id = wo.id
            WHERE wo.created_at::date >= '{month_start_str}'::date
              AND wo.created_at::date < '{month_end_next_str}'::date
        """)
        norm_hours_closed = float(cur.fetchone()['norm_hours_closed'])

        # Количество заказ-нарядов (машинозаездов) и уникальных клиентов
        cur.execute(f"""
            SELECT
                COUNT(*) as total_orders,
                COUNT(DISTINCT client_id) as unique_clients,
                COUNT(CASE WHEN client_id IN (
                    SELECT client_id FROM {t('work_orders')}
                    WHERE client_id IS NOT NULL
                      AND created_at::date < '{month_start_str}'::date
                ) THEN 1 END) as repeat_clients_orders,
                COUNT(CASE WHEN client_id NOT IN (
                    SELECT client_id FROM {t('work_orders')}
                    WHERE client_id IS NOT NULL
                      AND created_at::date < '{month_start_str}'::date
                ) OR client_id IS NULL THEN 1 END) as new_clients_orders
            FROM {t('work_orders')} wo
            WHERE wo.created_at::date >= '{month_start_str}'::date
              AND wo.created_at::date < '{month_end_next_str}'::date
        """)
        row = cur.fetchone()
        total_orders = int(row['total_orders'])
        unique_clients = int(row['unique_clients'])
        repeat_clients_orders = int(row['repeat_clients_orders'])
        new_clients_orders = int(row['new_clients_orders'])

        # Нормочасы проданные (norm_hours * qty по оплаченным работам)
        norm_hours_sold = norm_hours_closed  # считаем все закрытые нормочасы проданными

        # Выручка по типам оплаты (по дате поступления)
        cur.execute(f"""
            SELECT
                COALESCE(SUM(CASE WHEN payment_method = 'cash' THEN amount ELSE 0 END), 0) as cash_amount,
                COALESCE(SUM(CASE WHEN payment_method = 'card' THEN amount ELSE 0 END), 0) as card_amount,
                COALESCE(SUM(CASE WHEN payment_method = 'bank' THEN amount ELSE 0 END), 0) as bank_amount,
                COALESCE(SUM(CASE WHEN payment_method = 'sbp' THEN amount ELSE 0 END), 0) as sbp_amount,
                COUNT(*) as payments_count
            FROM {t('payments')}
            WHERE COALESCE(operation_date, created_at::date) >= '{month_start_str}'::date
              AND COALESCE(operation_date, created_at::date) < '{month_end_next_str}'::date
        """)
        row = cur.fetchone()
        cash_amount = float(row['cash_amount'])
        card_amount = float(row['card_amount'])
        bank_amount = float(row['bank_amount'])
        sbp_amount = float(row['sbp_amount'])

        # === Незакрытые и недоплаченные заказ-наряды ===
        cur.execute(f"""
            SELECT
                wo.id,
                wo.status,
                wo.client_name,
                wo.car_info,
                wo.created_at,
                COALESCE(SUM(ww.price * COALESCE(ww.qty, 1)), 0) +
                    COALESCE((SELECT SUM(wop.sell_price * wop.qty)
                              FROM {t('work_order_parts')} wop
                              WHERE wop.work_order_id = wo.id), 0) as order_total,
                COALESCE((SELECT SUM(p.amount)
                          FROM {t('payments')} p
                          WHERE p.work_order_id = wo.id), 0) as paid_amount
            FROM {t('work_orders')} wo
            LEFT JOIN {t('work_order_works')} ww ON ww.work_order_id = wo.id
            WHERE wo.status NOT IN ('cancelled', 'done')
            GROUP BY wo.id
            HAVING COALESCE(SUM(ww.price * COALESCE(ww.qty, 1)), 0) +
                   COALESCE((SELECT SUM(wop.sell_price * wop.qty)
                             FROM {t('work_order_parts')} wop
                             WHERE wop.work_order_id = wo.id), 0) >
                   COALESCE((SELECT SUM(p.amount)
                             FROM {t('payments')} p
                             WHERE p.work_order_id = wo.id), 0)
            ORDER BY wo.created_at DESC
        """)
        open_orders_rows = cur.fetchall()
        open_orders = []
        total_open_debt = 0.0
        for row in open_orders_rows:
            order_total = float(row['order_total'])
            paid_amount = float(row['paid_amount'])
            debt = order_total - paid_amount
            if debt < 0:
                debt = 0
            total_open_debt += debt
            open_orders.append({
                'id': row['id'],
                'status': row['status'],
                'client_name': row['client_name'],
                'car_info': row['car_info'] or '',
                'created_at': str(row['created_at'])[:10],
                'order_total': round(order_total, 2),
                'paid_amount': round(paid_amount, 2),
                'debt': round(debt, 2),
            })

        # Рабочих дней в месяце (считаем пн-пт)
        import calendar as cal_mod
        first_weekday, days_in_month = cal_mod.monthrange(year, month)
        working_days = sum(1 for d in range(1, days_in_month + 1)
                          if date(year, month, d).weekday() < 6)  # пн-сб
        today_obj = date.today()
        if year == today_obj.year and month == today_obj.month:
            days_passed = today_obj.day
        else:
            days_passed = days_in_month

        # === Проверка: services + parts должны сходиться с month_revenue ===
        # Погрешность допускается <= 1 коп (из-за округлений float)
        revenue_check_diff = abs((services_revenue + parts_revenue) - month_revenue)
        if revenue_check_diff > 0.01:
            print(f'[economics] WARNING: revenue check FAILED: '
                  f'services={services_revenue} + parts={parts_revenue} = {services_revenue + parts_revenue} '
                  f'!= month_revenue={month_revenue} (diff={revenue_check_diff:.4f})')
        else:
            print(f'[economics] revenue check OK: {services_revenue:.2f} + {parts_revenue:.2f} = {month_revenue:.2f}')

        # === Расчёты ===
        total_revenue = services_revenue + parts_revenue
        gross_profit_services = services_revenue  # без себестоимости работ (нет данных ФОТ)
        gross_profit_parts = parts_revenue - parts_cost
        gross_profit_total = gross_profit_services + gross_profit_parts

        parts_margin_pct = ((parts_revenue - parts_cost) / parts_revenue * 100) if parts_revenue > 0 else 0
        parts_ratio_to_services = (parts_revenue / services_revenue * 100) if services_revenue > 0 else 0
        services_share = (services_revenue / total_revenue * 100) if total_revenue > 0 else 0
        parts_share = (parts_revenue / total_revenue * 100) if total_revenue > 0 else 0

        avg_check = (month_revenue / closed_orders_month) if closed_orders_month > 0 else 0
        avg_check_services = (services_revenue / total_orders) if total_orders > 0 else 0
        avg_check_parts = (parts_revenue / total_orders) if total_orders > 0 else 0
        avg_revenue_per_day = (month_revenue / days_passed) if days_passed > 0 else 0
        orders_per_day = (total_orders / days_passed) if days_passed > 0 else 0

        # Нормочасовые показатели (от реальных поступлений за услуги)
        norm_hour_rate = (services_revenue / norm_hours_sold) if norm_hours_sold > 0 else 0
        avg_norm_hours_per_order = (norm_hours_sold / total_orders) if total_orders > 0 else 0

        # Коэффициент повторных клиентов
        repeat_rate = (repeat_clients_orders / total_orders * 100) if total_orders > 0 else 0
        new_clients_rate = (new_clients_orders / total_orders * 100) if total_orders > 0 else 0

        # Доли оплат
        cash_share = (cash_amount / month_revenue * 100) if month_revenue > 0 else 0
        card_share = (card_amount / month_revenue * 100) if month_revenue > 0 else 0
        bank_share = (bank_amount / month_revenue * 100) if month_revenue > 0 else 0

        # Прогноз на конец месяца
        revenue_forecast = (month_revenue / days_passed * days_in_month) if days_passed > 0 else 0

        # Валовая прибыль (GP) = выручка минус себестоимость товаров (запчастей) в заказ-нарядах
        gross_profit = month_revenue - parts_cost
        margin_pct = (gross_profit / month_revenue * 100) if month_revenue > 0 else 0

        # Точка безубыточности
        avg_variable_ratio = (avg_month_variable / avg_month_revenue) if avg_month_revenue > 0 else 0
        if avg_variable_ratio < 1 and avg_variable_ratio >= 0:
            bep_revenue = monthly_fixed / (1 - avg_variable_ratio) if (1 - avg_variable_ratio) > 0 else 0
        else:
            bep_revenue = 0

        bep_orders = (bep_revenue / avg_check) if avg_check > 0 else 0
        # Операционная прибыль (EBIT) = GP − все операционные расходы (коммерческие + управленческие)
        operating_profit = gross_profit - month_variable - monthly_fixed
        safety_margin_pct = ((month_revenue - bep_revenue) / month_revenue * 100) if month_revenue > 0 and bep_revenue > 0 else 0

        return {
            # Базовые
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
            'expense_groups': expense_groups,
            'month_start': month_start_str,
            # Выручка по статьям
            'services_revenue': round(services_revenue, 2),
            'parts_revenue': round(parts_revenue, 2),
            'parts_cost': round(parts_cost, 2),
            'total_revenue_orders': round(total_revenue, 2),
            'services_share': round(services_share, 1),
            'parts_share': round(parts_share, 1),
            # Валовая прибыль
            'gross_profit_parts': round(gross_profit_parts, 2),
            'parts_margin_pct': round(parts_margin_pct, 1),
            'parts_ratio_to_services': round(parts_ratio_to_services, 1),
            # Средние чеки
            'avg_check_services': round(avg_check_services, 2),
            'avg_check_parts': round(avg_check_parts, 2),
            'avg_revenue_per_day': round(avg_revenue_per_day, 2),
            'revenue_forecast': round(revenue_forecast, 2),
            # Машинозаезды
            'total_orders': total_orders,
            'unique_clients': unique_clients,
            'repeat_clients_orders': repeat_clients_orders,
            'new_clients_orders': new_clients_orders,
            'repeat_rate': round(repeat_rate, 1),
            'new_clients_rate': round(new_clients_rate, 1),
            'orders_per_day': round(orders_per_day, 1),
            # Нормочасы
            'norm_hours_closed': round(norm_hours_closed, 2),
            'norm_hours_sold': round(norm_hours_sold, 2),
            'norm_hour_rate': round(norm_hour_rate, 2),
            'avg_norm_hours_per_order': round(avg_norm_hours_per_order, 2),
            # Оплаты по типам
            'cash_amount': cash_amount,
            'card_amount': card_amount,
            'bank_amount': bank_amount,
            'sbp_amount': sbp_amount,
            'cash_share': round(cash_share, 1),
            'card_share': round(card_share, 1),
            'bank_share': round(bank_share, 1),
            # Период
            'days_in_month': days_in_month,
            'days_passed': days_passed,
            'working_days': working_days,
            # Незакрытые и недоплаченные заказ-наряды
            'open_orders': open_orders,
            'total_open_debt': round(total_open_debt, 2),
            # Проверка сходимости (для отладки)
            'revenue_check_ok': revenue_check_diff <= 0.01,
            'revenue_check_diff': round(revenue_check_diff, 4),
        }


def create_expense_group(conn, data):
    name = data.get('name', '').strip()
    description = data.get('description', '').strip()
    parent_id = data.get('parent_id')
    cost_type = data.get('cost_type', 'variable')
    if not name:
        return resp(400, {'error': 'name is required'})

    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cols = ['name', 'description', 'cost_type']
        vals = [name, description, cost_type if cost_type in ('fixed', 'variable') else 'variable']
        if parent_id:
            cols.append('parent_id')
            vals.append(int(parent_id))
        placeholders = ', '.join(['%s'] * len(cols))
        col_str = ', '.join(cols)
        cur.execute(
            f"INSERT INTO {t('expense_groups')} ({col_str}) VALUES ({placeholders}) RETURNING *",
            vals,
        )
        group = cur.fetchone()
        conn.commit()
        return resp(201, {'expense_group': dict(group)})


def update_expense_group(conn, data):
    group_id = data.get('group_id')
    if not group_id:
        return resp(400, {'error': 'group_id is required'})

    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
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
        if 'parent_id' in data:
            updates.append("parent_id = %s")
            params.append(int(data['parent_id']) if data['parent_id'] else None)
        if 'cost_type' in data:
            ct = data['cost_type']
            updates.append("cost_type = %s")
            params.append(ct if ct in ('fixed', 'variable') else 'variable')

        if not updates:
            return resp(400, {'error': 'Nothing to update'})

        params.append(group_id)
        cur.execute(
            f"UPDATE {t('expense_groups')} SET {', '.join(updates)} WHERE id = %s RETURNING *",
            params,
        )
        group = cur.fetchone()
        if not group:
            return resp(404, {'error': 'Group not found'})
        conn.commit()
        return resp(200, {'expense_group': dict(group)})


def delete_expense_group(conn, data):
    group_id = data.get('group_id')
    if not group_id:
        return resp(400, {'error': 'group_id is required'})
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(f"UPDATE {t('expenses')} SET expense_group_id = NULL WHERE expense_group_id = %s", (group_id,))
        cur.execute(f"DELETE FROM {t('expense_groups')} WHERE id = %s RETURNING id", (group_id,))
        row = cur.fetchone()
        if not row:
            return resp(404, {'error': 'Group not found'})
        conn.commit()
        return resp(200, {'deleted': True})


def get_expenses_by_group(conn, params):
    group_id = params.get('group_id')
    if not group_id:
        return resp(400, {'error': 'group_id is required'})
    month_offset = int(params.get('month_offset', 0))
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(f"""
            SELECT e.*, cb.name as cashbox_name, c.name as client_name
            FROM {t('expenses')} e
            LEFT JOIN {t('cashboxes')} cb ON cb.id = e.cashbox_id
            LEFT JOIN {t('clients')} c ON c.id = e.client_id
            WHERE e.expense_group_id = %s
              AND date_trunc('month', COALESCE(e.operation_date, e.created_at::date))
                  = date_trunc('month', CURRENT_DATE + ({month_offset} * INTERVAL '1 month'))
            ORDER BY COALESCE(e.operation_date, e.created_at) DESC
            LIMIT 100
        """, (group_id,))
        rows = cur.fetchall()
        return resp(200, {'expenses': [dict(r) for r in rows]})


_finance_action_labels = {
    'create_payment':       'Создан платёж',
    'update_payment':       'Изменён платёж',
    'create_expense':       'Создан расход',
    'update_expense':       'Изменён расход',
    'create_income':        'Создан приход',
    'update_income':        'Изменён приход',
    'create_transfer':      'Перемещение между кассами',
    'create_cashbox':       'Создана касса',
    'update_cashbox':       'Изменена касса',
    'delete_cashbox':       'Удалена касса',
    'create_expense_group': 'Создана группа расходов',
    'update_expense_group': 'Изменена группа расходов',
    'delete_expense_group': 'Удалена группа расходов',
    'create_income_group':  'Создана группа приходов',
    'update_income_group':  'Изменена группа приходов',
    'delete_income_group':  'Удалена группа приходов',
    'create_fixed_cost':    'Создан постоянный расход',
    'update_fixed_cost':    'Изменён постоянный расход',
    'delete_fixed_cost':    'Удалён постоянный расход',
    'import_fixed_costs':   'Импорт постоянных расходов',
}


def _finance_log(event_obj, action, result, body):
    if result.get('statusCode', 200) >= 300:
        return
    token = _get_log_token(event_obj)
    user = get_user_by_token(token)
    ip = (event_obj.get('requestContext') or {}).get('identity', {}).get('sourceIp')
    resp_body = json.loads(result.get('body', '{}'))
    # Определяем entity
    entity_id = None
    entity_label = ''
    for key in ('payment', 'expense', 'income', 'transfer', 'cashbox', 'expense_group', 'income_group', 'fixed_cost'):
        obj = resp_body.get(key)
        if obj and isinstance(obj, dict):
            entity_id = obj.get('id')
            amount = obj.get('amount') or obj.get('sum') or ''
            name = obj.get('name') or obj.get('description') or obj.get('title') or ''
            if amount:
                entity_label = f"{name} {amount} руб." if name else f"{amount} руб."
            else:
                entity_label = str(name)
            break
    desc = ''
    if body.get('amount'):
        desc = f"сумма: {body['amount']} руб."
    elif body.get('sum'):
        desc = f"сумма: {body['sum']} руб."
    write_log(
        user=user,
        module='finance',
        action=_finance_action_labels.get(action, action),
        entity_type=action.split('_', 1)[-1] if '_' in action else action,
        entity_id=entity_id,
        entity_label=entity_label,
        description=desc,
        ip_address=ip,
    )


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
                ms = params.get('month_start')
                me = params.get('month_end')
                groups = get_expense_groups(conn, ms, me)
                return resp(200, {'expense_groups': [dict(g) for g in groups]})
            elif section == 'expenses_by_group':
                return get_expenses_by_group(conn, params)
            elif section == 'income_groups':
                ms = params.get('month_start')
                me = params.get('month_end')
                groups = get_income_groups(conn, ms, me)
                return resp(200, {'income_groups': [dict(g) for g in groups]})
            elif section == 'incomes_by_group':
                return get_incomes_by_group(conn, params)
            elif section == 'fixed_costs':
                rows = get_fixed_costs(conn)
                return resp(200, {'fixed_costs': [dict(r) for r in rows]})
            elif section == 'economics':
                month_offset = int(params.get('month_offset', 0))
                return resp(200, get_economics(conn, month_offset))
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
                'import_fixed_costs': lambda: import_fixed_costs(conn, body),
                'create_expense_group': lambda: create_expense_group(conn, body),
                'update_expense_group': lambda: update_expense_group(conn, body),
                'delete_expense_group': lambda: delete_expense_group(conn, body),
                'create_income_group': lambda: create_income_group(conn, body),
                'update_income_group': lambda: update_income_group(conn, body),
                'delete_income_group': lambda: delete_income_group(conn, body),
                'auto_assign_income_groups': lambda: auto_assign_income_groups(conn),
                'create_fixed_cost': lambda: create_fixed_cost(conn, body),
                'update_fixed_cost': lambda: update_fixed_cost(conn, body),
                'delete_fixed_cost': lambda: delete_fixed_cost(conn, body),
            }

            handler_fn = actions_map.get(action)
            if handler_fn:
                result = handler_fn()
                _finance_log(event, action, result, body)
                return result

            return resp(400, {'error': 'Unknown action'})

        return resp(405, {'error': 'Method not allowed'})
    except Exception as e:
        import traceback
        print(f"[finance] ERROR: {e}\n{traceback.format_exc()}")
        return resp(400, {'error': str(e)})
    finally:
        conn.close()
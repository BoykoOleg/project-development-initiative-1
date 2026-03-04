import os
import psycopg2
from datetime import datetime

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "public")
MAX_HISTORY = 80


def t(name):
    return f"{SCHEMA}.{name}"


def get_db_connection():
    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    conn.autocommit = True
    return conn


def _safe_query(conn, query, label, params=None):
    cur = conn.cursor()
    try:
        cur.execute(query, params)
        result = cur.fetchall()
        cur.close()
        return result
    except Exception as e:
        print(f"[DB] WARN {label}: {e}")
        cur.close()
        return []


def load_history(conn, chat_id: int, limit: int = MAX_HISTORY) -> list:
    cur = conn.cursor()
    try:
        cur.execute(f"""
            SELECT role, content FROM (
                SELECT role, content, created_at
                FROM {t('bot_messages')}
                WHERE chat_id = %s
                ORDER BY created_at DESC
                LIMIT %s
            ) sub ORDER BY created_at ASC
        """, (chat_id, limit))
        rows = cur.fetchall()
        return [{"role": r[0], "content": r[1]} for r in rows]
    except Exception as e:
        print(f"[DB] load_history error: {e}")
        return []
    finally:
        cur.close()


def save_message(conn, chat_id: int, role: str, content: str):
    cur = conn.cursor()
    try:
        cur.execute(f"""
            INSERT INTO {t('bot_messages')} (chat_id, role, content)
            VALUES (%s, %s, %s)
        """, (chat_id, role, content))
    except Exception as e:
        print(f"[DB] save_message error: {e}")
    finally:
        cur.close()


def fetch_db_context(conn) -> str:
    context_parts = []

    rows = _safe_query(conn, f"""
        SELECT id, client_name, phone, car_info, status, comment, created_at
        FROM {t('orders')}
        ORDER BY created_at DESC LIMIT 30
    """, "orders")
    if rows:
        orders_text = "ЗАЯВКИ (последние 30):\n"
        for o in rows:
            orders_text += f"  ID:{o[0]} | {o[1]} | тел:{o[2]} | авто:{o[3]} | статус:{o[4]} | {o[6].strftime('%d.%m.%Y') if o[6] else ''} | {o[5] or ''}\n"
        context_parts.append(orders_text)

    rows = _safe_query(conn, f"""
        SELECT wo.id, wo.client_name, wo.car_info, wo.status,
               wo.master, wo.created_at,
               COALESCE(SUM(ww.price * ww.qty * (1 - COALESCE(ww.discount,0)/100.0)), 0) +
               COALESCE(SUM(wp.sell_price * wp.qty), 0) as total
        FROM {t('work_orders')} wo
        LEFT JOIN {t('work_order_works')} ww ON ww.work_order_id = wo.id
        LEFT JOIN {t('work_order_parts')} wp ON wp.work_order_id = wo.id
        GROUP BY wo.id, wo.client_name, wo.car_info, wo.status, wo.master, wo.created_at
        ORDER BY wo.created_at DESC LIMIT 30
    """, "work_orders")
    if rows:
        wo_text = "ЗАКАЗ-НАРЯДЫ (последние 30):\n"
        for w in rows:
            wo_text += f"  ID:{w[0]} | {w[1]} | авто:{w[2]} | статус:{w[3]} | мастер:{w[4]} | {w[5].strftime('%d.%m.%Y') if w[5] else ''} | сумма:{w[6]:.0f}₽\n"
        context_parts.append(wo_text)

    rows = _safe_query(conn, f"SELECT name, type, balance FROM {t('cashboxes')} WHERE is_active = TRUE", "cashboxes")
    if rows:
        cash_text = "КАССЫ:\n"
        for cb in rows:
            cash_text += f"  {cb[0]} ({cb[1]}): {cb[2]:.0f}₽\n"
        context_parts.append(cash_text)

    income_rows = _safe_query(conn, f"""
        SELECT COALESCE(SUM(amount), 0) as income
        FROM {t('payments')}
        WHERE created_at >= date_trunc('month', NOW())
    """, "payments_income")
    expense_rows = _safe_query(conn, f"""
        SELECT COALESCE(SUM(amount), 0) as expenses
        FROM {t('expenses')}
        WHERE created_at >= date_trunc('month', NOW())
    """, "expenses")

    income_val = income_rows[0][0] if income_rows else 0
    expense_val = expense_rows[0][0] if expense_rows else 0
    now = datetime.now()
    context_parts.append(
        f"ФИНАНСЫ (текущий месяц {now.strftime('%B %Y')}):\n"
        f"  Доходы: {income_val:.0f}₽\n"
        f"  Расходы: {expense_val:.0f}₽\n"
        f"  Прибыль: {(income_val - expense_val):.0f}₽"
    )

    rows = _safe_query(conn, f"""
        SELECT p.amount, p.payment_method, p.comment, p.created_at, cb.name
        FROM {t('payments')} p
        LEFT JOIN {t('cashboxes')} cb ON p.cashbox_id = cb.id
        ORDER BY p.created_at DESC LIMIT 10
    """, "payments_list")
    if rows:
        pay_text = "ПОСЛЕДНИЕ ПЛАТЕЖИ (10 шт):\n"
        for p in rows:
            pay_text += f"  {p[3].strftime('%d.%m.%Y') if p[3] else ''} | {p[0]:.0f}₽ | {p[1]} | касса:{p[4]} | {p[2] or ''}\n"
        context_parts.append(pay_text)

    cl_rows = _safe_query(conn, f"SELECT COUNT(*) FROM {t('clients')}", "clients_count")
    clients_count = cl_rows[0][0] if cl_rows else 0
    context_parts.append(f"ВСЕГО КЛИЕНТОВ В БАЗЕ: {clients_count}")

    return "\n\n".join(context_parts)


def get_cashboxes(conn) -> list:
    rows = _safe_query(conn, f"SELECT id, name, type, balance FROM {t('cashboxes')} WHERE is_active = TRUE ORDER BY id", "cashboxes_list")
    return [{"id": r[0], "name": r[1], "type": r[2], "balance": float(r[3])} for r in rows]


def get_expense_groups(conn) -> list:
    rows = _safe_query(conn, f"SELECT id, name FROM {t('expense_groups')} WHERE is_active = TRUE ORDER BY id", "expense_groups_list")
    return [{"id": r[0], "name": r[1]} for r in rows]


def get_employees_list(conn) -> list:
    role_map = {"director": "Директор", "manager": "Менеджер", "mechanic": "Механик", "installer": "Установщик"}
    rows = _safe_query(conn, f"SELECT id, name, role FROM {t('employees')} WHERE is_active = TRUE ORDER BY id", "employees_list")
    return [{"id": r[0], "name": r[1], "role": role_map.get(r[2], r[2])} for r in rows]


def get_clients_list(conn) -> list:
    rows = _safe_query(conn, f"SELECT id, name, phone FROM {t('clients')} ORDER BY id DESC LIMIT 50", "clients_list")
    clients = [{"id": r[0], "name": r[1], "phone": r[2] or "", "cars": []} for r in rows]
    if clients:
        client_ids = [c["id"] for c in clients]
        placeholders = ",".join(["%s"] * len(client_ids))
        car_rows = _safe_query(conn, f"SELECT id, client_id, brand, model, year, license_plate, vin FROM {t('cars')} WHERE client_id IN ({placeholders}) AND is_active = TRUE ORDER BY id", "cars_list", client_ids)
        cars_by_client = {}
        for r in car_rows:
            cid = r[1]
            if cid not in cars_by_client:
                cars_by_client[cid] = []
            car_info = f"{r[2]} {r[3]}".strip()
            if r[4]:
                car_info += f" ({r[4]})"
            extras = []
            if r[5]:
                extras.append(f"гос.номер:{r[5]}")
            if r[6]:
                extras.append(f"VIN:{r[6]}")
            if extras:
                car_info += " " + ", ".join(extras)
            cars_by_client[cid].append({"id": r[0], "info": car_info})
        for c in clients:
            c["cars"] = cars_by_client.get(c["id"], [])
    return clients


def get_bot_settings(conn) -> dict:
    defaults = {
        "system_prompt": None,
        "ai_model": "deepseek-v3-20250324",
        "language": "ru",
    }
    try:
        cur = conn.cursor()
        cur.execute(f"SELECT key, value FROM {t('bot_settings')}")
        rows = cur.fetchall()
        for key, value in rows:
            defaults[key] = value
    except Exception as e:
        print(f"[settings] error loading: {e}")
    return defaults

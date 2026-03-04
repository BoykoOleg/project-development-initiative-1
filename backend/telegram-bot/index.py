"""
Telegram-бот с ИИ для управления автосервисом.
Обрабатывает сообщения пользователей, работает с БД через прямые запросы,
формирует ответы через OpenAI на основе реальных данных системы.
v5
"""

import json
import os
import re
import requests
import psycopg2
from datetime import datetime
from openai import OpenAI

TELEGRAM_API = "https://api.telegram.org/bot"
SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "public")


def t(name):
    return f"{SCHEMA}.{name}"


def get_db_connection():
    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    conn.autocommit = True
    return conn


def send_message(bot_token: str, chat_id: int, text: str, parse_mode: str = "", reply_markup: dict = None):
    url = f"{TELEGRAM_API}{bot_token}/sendMessage"
    payload = {"chat_id": chat_id, "text": text}
    if parse_mode:
        payload["parse_mode"] = parse_mode
    if reply_markup:
        payload["reply_markup"] = reply_markup
    r = requests.post(url, json=payload, timeout=10)
    if not r.ok:
        print(f"[TG] send error {r.status_code}: {r.text[:200]}")


def send_start_menu(bot_token: str, chat_id: int):
    text = (
        "👋 Добро пожаловать в систему автосервиса!\n\n"
        "Я ваш ИИ-помощник. Могу:\n"
        "• Показать заявки и заказ-наряды\n"
        "• Создать новую заявку\n"
        "• Сформировать финансовый отчёт\n"
        "• Ответить на любой вопрос по данным\n\n"
        "Выберите действие или напишите свой вопрос:"
    )
    keyboard = {
        "keyboard": [
            [{"text": "📋 Заявки"}, {"text": "🔧 Заказ-наряды"}],
            [{"text": "💰 Финансовый отчёт"}, {"text": "➕ Создать заявку"}],
            [{"text": "📊 Сводка по кассам"}]
        ],
        "resize_keyboard": True,
        "persistent": True
    }
    send_message(bot_token, chat_id, text, reply_markup=keyboard)


MAX_HISTORY = 80


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


def _safe_query(conn, query, label):
    cur = conn.cursor()
    try:
        cur.execute(query)
        result = cur.fetchall()
        cur.close()
        return result
    except Exception as e:
        print(f"[DB] WARN {label}: {e}")
        cur.close()
        return []


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


def create_order_in_db(conn, client_name: str, phone: str, car: str, comment: str) -> int:
    cur = conn.cursor()
    cur.execute(f"""
        INSERT INTO {t('orders')} (client_name, phone, car_info, comment, status, source)
        VALUES (%s, %s, %s, %s, 'new', 'telegram')
        RETURNING id
    """, (client_name, phone, car, comment))
    order_id = cur.fetchone()[0]
    conn.commit()
    cur.close()
    return order_id


def update_work_order_status_in_db(conn, work_order_id: int, status: str) -> bool:
    valid_statuses = ["new", "in-progress", "done", "issued"]
    if status not in valid_statuses:
        return False
    cur = conn.cursor()
    cur.execute(f"UPDATE {t('work_orders')} SET status = %s WHERE id = %s", (status, work_order_id))
    updated = cur.rowcount > 0
    conn.commit()
    cur.close()
    return updated


def get_work_order_detail(conn, work_order_id: int) -> str:
    cur = conn.cursor()

    cur.execute(f"""
        SELECT wo.id, wo.client_name, wo.car_info,
               wo.status, wo.master, wo.created_at, wo.issued_at
        FROM {t('work_orders')} wo
        WHERE wo.id = %s
    """, (work_order_id,))
    wo = cur.fetchone()
    if not wo:
        return f"Заказ-наряд #{work_order_id} не найден."

    cur.execute(f"SELECT name, qty, price, discount FROM {t('work_order_works')} WHERE work_order_id = %s", (work_order_id,))
    works = cur.fetchall()

    cur.execute(f"SELECT name, qty, sell_price FROM {t('work_order_parts')} WHERE work_order_id = %s", (work_order_id,))
    parts = cur.fetchall()

    total_works = sum(w[1] * w[2] * (1 - (w[3] or 0) / 100) for w in works)
    total_parts = sum(p[1] * p[2] for p in parts)
    total = total_works + total_parts

    status_map = {"new": "Новый", "in-progress": "В работе", "done": "Готов", "issued": "Выдан"}

    result = f"📋 Заказ-наряд #{wo[0]}\n"
    result += f"Клиент: {wo[1]}\n"
    result += f"Авто: {wo[2]}\n"
    result += f"Статус: {status_map.get(wo[3], wo[3])}\n"
    result += f"Мастер: {wo[4] or 'не назначен'}\n"
    result += f"Создан: {wo[5].strftime('%d.%m.%Y') if wo[5] else '—'}\n"
    if wo[6]:
        result += f"Выдан: {wo[6].strftime('%d.%m.%Y')}\n"

    if works:
        result += "\n🔧 Работы:\n"
        for w in works:
            price = w[1] * w[2] * (1 - (w[3] or 0) / 100)
            result += f"  • {w[0]} x{w[1]} = {price:.0f}₽\n"

    if parts:
        result += "\n🔩 Запчасти:\n"
        for p in parts:
            result += f"  • {p[0]} x{p[1]} = {p[1]*p[2]:.0f}₽\n"

    result += f"\n💰 Итого: {total:.0f}₽"
    cur.close()
    return result


def find_or_create_client(conn, name: str, phone: str) -> int:
    cur = conn.cursor()
    if phone:
        cur.execute(f"SELECT id FROM {t('clients')} WHERE phone = %s LIMIT 1", (phone,))
        row = cur.fetchone()
        if row:
            cur.close()
            return row[0]
    if name:
        cur.execute(f"SELECT id FROM {t('clients')} WHERE name ILIKE %s LIMIT 1", (name,))
        row = cur.fetchone()
        if row:
            cur.close()
            return row[0]
    cur.execute(f"""
        INSERT INTO {t('clients')} (name, phone) VALUES (%s, %s) RETURNING id
    """, (name or "Без имени", phone or ""))
    client_id = cur.fetchone()[0]
    cur.close()
    return client_id


def find_or_create_car(conn, client_id: int, car_info: str) -> int:
    cur = conn.cursor()
    if car_info:
        cur.execute(f"SELECT id FROM {t('cars')} WHERE client_id = %s AND (brand || ' ' || model) ILIKE %s LIMIT 1",
                     (client_id, f"%{car_info[:30]}%"))
        row = cur.fetchone()
        if row:
            cur.close()
            return row[0]
    parts = car_info.split(maxsplit=1) if car_info else ["", ""]
    brand = parts[0] if len(parts) > 0 else ""
    model = parts[1] if len(parts) > 1 else ""
    cur.execute(f"""
        INSERT INTO {t('cars')} (client_id, brand, model) VALUES (%s, %s, %s) RETURNING id
    """, (client_id, brand or car_info or "Неизвестно", model or ""))
    car_id = cur.fetchone()[0]
    cur.close()
    return car_id


def create_work_order_in_db(conn, client_name: str, phone: str, car_info: str,
                             master: str = "", works: list = None, parts: list = None) -> int:
    client_id = find_or_create_client(conn, client_name, phone)
    car_id = find_or_create_car(conn, client_id, car_info) if car_info else None

    cur = conn.cursor()
    cur.execute(f"""
        INSERT INTO {t('work_orders')} (client_id, car_id, client_name, car_info, status, master)
        VALUES (%s, %s, %s, %s, 'new', %s)
        RETURNING id
    """, (client_id, car_id, client_name, car_info or "", master or ""))
    wo_id = cur.fetchone()[0]

    if works:
        for w in works:
            cur.execute(f"""
                INSERT INTO {t('work_order_works')} (work_order_id, name, price, qty)
                VALUES (%s, %s, %s, %s)
            """, (wo_id, w.get("name", "Работа"), float(w.get("price", 0)), float(w.get("qty", 1))))

    if parts:
        for p in parts:
            cur.execute(f"""
                INSERT INTO {t('work_order_parts')} (work_order_id, name, sell_price, qty)
                VALUES (%s, %s, %s, %s)
            """, (wo_id, p.get("name", "Запчасть"), float(p.get("price", 0)), int(p.get("qty", 1))))

    cur.close()
    return wo_id


def add_works_to_wo(conn, wo_id: int, works: list) -> int:
    cur = conn.cursor()
    count = 0
    for w in works:
        cur.execute(f"""
            INSERT INTO {t('work_order_works')} (work_order_id, name, price, qty)
            VALUES (%s, %s, %s, %s)
        """, (wo_id, w.get("name", "Работа"), float(w.get("price", 0)), float(w.get("qty", 1))))
        count += 1
    cur.close()
    return count


def add_parts_to_wo(conn, wo_id: int, parts: list) -> int:
    cur = conn.cursor()
    count = 0
    for p in parts:
        cur.execute(f"""
            INSERT INTO {t('work_order_parts')} (work_order_id, name, sell_price, qty)
            VALUES (%s, %s, %s, %s)
        """, (wo_id, p.get("name", "Запчасть"), float(p.get("price", 0)), int(p.get("qty", 1))))
        count += 1
    cur.close()
    return count


def create_expense_in_db(conn, amount: float, comment: str, cashbox_id: int, expense_group_id: int) -> int:
    cur = conn.cursor()
    cur.execute(f"""
        INSERT INTO {t('expenses')} (amount, comment, cashbox_id, expense_group_id)
        VALUES (%s, %s, %s, %s)
        RETURNING id
    """, (amount, comment, cashbox_id, expense_group_id))
    expense_id = cur.fetchone()[0]
    cur.execute(f"UPDATE {t('cashboxes')} SET balance = balance - %s WHERE id = %s", (amount, cashbox_id))
    cur.close()
    return expense_id


def create_payment_in_db(conn, amount: float, comment: str, cashbox_id: int, payment_method: str, work_order_id: int = None) -> int:
    cur = conn.cursor()
    cur.execute(f"""
        INSERT INTO {t('payments')} (amount, comment, cashbox_id, payment_method, work_order_id)
        VALUES (%s, %s, %s, %s, %s)
        RETURNING id
    """, (amount, comment, cashbox_id, payment_method, work_order_id))
    payment_id = cur.fetchone()[0]
    cur.execute(f"UPDATE {t('cashboxes')} SET balance = balance + %s WHERE id = %s", (amount, cashbox_id))
    if work_order_id:
        cur.execute(f"UPDATE {t('work_orders')} SET status = 'issued' WHERE id = %s AND status = 'done'", (work_order_id,))
    cur.close()
    return payment_id


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
    return [{"id": r[0], "name": r[1], "phone": r[2] or ""} for r in rows]


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


SYSTEM_PROMPT = """Ты — Юра, помощник в автосервисе. Общаешься в Telegram с сотрудниками и владельцем.

Твой стиль: живой, дружелюбный, по делу. Не формальный. Пишешь как опытный коллега. Без пустых вступлений типа "Конечно!" или "Хорошо!". Отвечаешь сразу по существу.

Статусы: new = новая, approved = подтверждена, in-progress = в работе, done = готово, issued = выдано/закрыто.

КАССЫ (актуальные id и названия):
{cashboxes}

КАТЕГОРИИ РАСХОДОВ:
{expense_groups}

СОТРУДНИКИ:
{employees}

КЛИЕНТЫ В БАЗЕ:
{clients_info}

Метод оплаты (payment_method): cash = наличные, card = карта/терминал, bank = перевод.

━━━ КОМАНДЫ ━━━

СОЗДАТЬ ЗАЯВКУ — когда просят принять новую заявку от клиента.
Нужно: имя клиента, телефон, авто, что сделать. Если чего-то нет — спроси.
CMD::{{"action": "create_order", "client_name": "...", "phone": "...", "car": "...", "comment": "..."}}

СОЗДАТЬ ЗАКАЗ-НАРЯД — когда нужно открыть заказ-наряд (начать работу по машине).
Обязательно: имя клиента, авто. Необязательно: телефон, мастер, работы, запчасти.
Клиент автоматически создастся в базе если его ещё нет (ищется по телефону или имени).
Работы: список с name, price, qty. Запчасти: список с name, price, qty.
CMD::{{"action": "create_work_order", "client_name": "Иванов Сергей", "phone": "+79001234567", "car_info": "Toyota Camry", "master": "Виталий Петрович", "works": [{{"name": "Замена масла", "price": 2000, "qty": 1}}], "parts": [{{"name": "Фильтр масляный", "price": 800, "qty": 1}}]}}

ДОБАВИТЬ РАБОТЫ В ЗАКАЗ-НАРЯД — когда к существующему заказ-наряду нужно добавить работы.
CMD::{{"action": "add_works", "work_order_id": 5, "works": [{{"name": "Диагностика", "price": 1500, "qty": 1}}]}}

ДОБАВИТЬ ЗАПЧАСТИ В ЗАКАЗ-НАРЯД — когда к существующему заказ-наряду нужно добавить запчасти.
CMD::{{"action": "add_parts", "work_order_id": 5, "parts": [{{"name": "Колодки тормозные", "price": 3500, "qty": 2}}]}}

СОЗДАТЬ РАСХОД — когда говорят потратили/купили/заплатили/расход/снял деньги.
Определи категорию по смыслу (закупка материалов → id 3, зарплата → id 2, аренда → id 1, коммунальные → id 4, остальное → id 5).
Если касса не указана явно — используй ту, где больше денег или которая логична по контексту.
CMD::{{"action": "create_expense", "amount": 80000, "comment": "Покупка маяков, Олег", "cashbox_id": 4, "expense_group_id": 3}}

СОЗДАТЬ ПОСТУПЛЕНИЕ — когда говорят пришли деньги/получили оплату/внесли/поступление (НЕ оплата заказ-наряда).
CMD::{{"action": "create_payment", "amount": 50000, "comment": "Поступление от клиента", "cashbox_id": 1, "payment_method": "cash"}}

ОПЛАТА ЗАКАЗ-НАРЯДА — когда клиент платит за конкретный заказ-наряд (упоминают номер или имя клиента + оплата).
Если заказ-наряд готов (done) — после оплаты он станет issued автоматически.
CMD::{{"action": "pay_work_order", "work_order_id": 5, "amount": 15000, "cashbox_id": 1, "payment_method": "cash", "comment": "Оплата от клиента"}}

ИЗМЕНИТЬ СТАТУС ЗАКАЗ-НАРЯДА:
CMD::{{"action": "update_wo_status", "id": 123, "status": "in-progress"}}

ДЕТАЛИ ЗАКАЗ-НАРЯДА:
CMD::{{"action": "get_wo_detail", "id": 123}}

━━━ ВАЖНО ━━━
— ВСЕ данные (заказ-наряды, заявки, клиенты, работы, запчасти) создаются ТОЛЬКО через CMD:: команды в реальной базе данных. НИКОГДА не выдумывай данные и не храни их «у себя». Если тебя просят создать заказ-наряд — используй CMD:: create_work_order. Если просят добавить работу — CMD:: add_works.
— CMD:: только когда реально нужно действие
— Одно сообщение = одна CMD:: строка
— В обычных ответах — только текст, никаких JSON и кодовых блоков
— Если не хватает данных для команды (имя, авто, сумма) — уточни, не угадывай
— После выполнения действия коротко подтверди своими словами
— Когда показываешь заказ-наряды/заявки — бери данные ТОЛЬКО из секции "ДАННЫЕ ИЗ БАЗЫ" ниже, не придумывай

Сегодня: {today}

ДАННЫЕ ИЗ БАЗЫ:
{db_context}
"""


def process_ai_action(conn, action_data: dict, bot_token: str, chat_id: int):
    action = action_data.get("action")

    if action == "create_order":
        order_id = create_order_in_db(
            conn,
            action_data.get("client_name", ""),
            action_data.get("phone", ""),
            action_data.get("car", ""),
            action_data.get("comment", "")
        )
        send_message(bot_token, chat_id, f"✅ Заявка #{order_id} успешно создана!")

    elif action == "update_wo_status":
        wo_id = action_data.get("id")
        status = action_data.get("status")
        status_map = {"new": "Новый", "in-progress": "В работе", "done": "Готов", "issued": "Выдан"}
        if update_work_order_status_in_db(conn, wo_id, status):
            send_message(bot_token, chat_id, f"✅ Заказ-наряд #{wo_id} переведён в статус «{status_map.get(status, status)}»")
        else:
            send_message(bot_token, chat_id, f"❌ Не удалось обновить заказ-наряд #{wo_id}.")

    elif action == "get_wo_detail":
        wo_id = action_data.get("id")
        detail = get_work_order_detail(conn, wo_id)
        send_message(bot_token, chat_id, detail)

    elif action == "create_expense":
        amount = float(action_data.get("amount", 0))
        comment = action_data.get("comment", "")
        cashbox_id = int(action_data.get("cashbox_id", 1))
        group_id = int(action_data.get("expense_group_id", 5))
        if amount <= 0:
            send_message(bot_token, chat_id, "Не указана сумма расхода.")
            return
        expense_id = create_expense_in_db(conn, amount, comment, cashbox_id, group_id)
        send_message(bot_token, chat_id, f"✅ Расход #{expense_id} на {amount:,.0f}₽ записан.")

    elif action == "create_payment":
        amount = float(action_data.get("amount", 0))
        comment = action_data.get("comment", "")
        cashbox_id = int(action_data.get("cashbox_id", 1))
        method = action_data.get("payment_method", "cash")
        if amount <= 0:
            send_message(bot_token, chat_id, "Не указана сумма поступления.")
            return
        payment_id = create_payment_in_db(conn, amount, comment, cashbox_id, method)
        send_message(bot_token, chat_id, f"✅ Поступление #{payment_id} на {amount:,.0f}₽ записано.")

    elif action == "pay_work_order":
        wo_id = action_data.get("work_order_id")
        amount = float(action_data.get("amount", 0))
        cashbox_id = int(action_data.get("cashbox_id", 1))
        method = action_data.get("payment_method", "cash")
        comment = action_data.get("comment", f"Оплата заказ-наряда #{wo_id}")
        if amount <= 0:
            send_message(bot_token, chat_id, "Не указана сумма оплаты.")
            return
        payment_id = create_payment_in_db(conn, amount, comment, cashbox_id, method, work_order_id=wo_id)
        send_message(bot_token, chat_id, f"✅ Оплата {amount:,.0f}₽ по заказ-наряду #{wo_id} записана (платёж #{payment_id}).")

    elif action == "create_work_order":
        client_name = action_data.get("client_name", "")
        phone = action_data.get("phone", "")
        car_info = action_data.get("car_info", "")
        master = action_data.get("master", "")
        works = action_data.get("works", [])
        parts = action_data.get("parts", [])
        if not client_name:
            send_message(bot_token, chat_id, "Не указано имя клиента для заказ-наряда.")
            return
        wo_id = create_work_order_in_db(conn, client_name, phone, car_info, master, works, parts)
        total_works = sum(float(w.get("price", 0)) * float(w.get("qty", 1)) for w in works)
        total_parts = sum(float(p.get("price", 0)) * int(p.get("qty", 1)) for p in parts)
        total = total_works + total_parts
        msg = f"✅ Заказ-наряд #{wo_id} создан!\nКлиент: {client_name}\nАвто: {car_info or '—'}"
        if master:
            msg += f"\nМастер: {master}"
        if works:
            msg += f"\nРабот: {len(works)} шт."
        if parts:
            msg += f"\nЗапчастей: {len(parts)} шт."
        if total > 0:
            msg += f"\nСумма: {total:,.0f}₽"
        send_message(bot_token, chat_id, msg)

    elif action == "add_works":
        wo_id = action_data.get("work_order_id")
        works = action_data.get("works", [])
        if not wo_id or not works:
            send_message(bot_token, chat_id, "Не указан заказ-наряд или список работ.")
            return
        count = add_works_to_wo(conn, wo_id, works)
        total = sum(float(w.get("price", 0)) * float(w.get("qty", 1)) for w in works)
        send_message(bot_token, chat_id, f"✅ Добавлено {count} работ в заказ-наряд #{wo_id} на {total:,.0f}₽")

    elif action == "add_parts":
        wo_id = action_data.get("work_order_id")
        parts = action_data.get("parts", [])
        if not wo_id or not parts:
            send_message(bot_token, chat_id, "Не указан заказ-наряд или список запчастей.")
            return
        count = add_parts_to_wo(conn, wo_id, parts)
        total = sum(float(p.get("price", 0)) * int(p.get("qty", 1)) for p in parts)
        send_message(bot_token, chat_id, f"✅ Добавлено {count} запчастей в заказ-наряд #{wo_id} на {total:,.0f}₽")


def handler(event: dict, context) -> dict:
    """
    Webhook-обработчик Telegram-бота с ИИ.
    Принимает обновления от Telegram, обрабатывает сообщения через OpenAI
    с контекстом из базы данных автосервиса.
    """
    headers = {"Access-Control-Allow-Origin": "*"}

    if event.get("httpMethod") == "OPTIONS":
        return {
            "statusCode": 200,
            "headers": {**headers, "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type"},
            "body": ""
        }

    bot_token = os.environ.get("TELEGRAM_BOT_TOKEN", "")
    openai_key = os.environ.get("OPENAI_API_KEY", "")

    if event.get("httpMethod") == "GET":
        db_ok = False
        db_error = ""
        try:
            conn_test = get_db_connection()
            cur = conn_test.cursor()
            cur.execute(f"SELECT COUNT(*) FROM {t('orders')}")
            count = cur.fetchone()[0]
            cur.close()
            conn_test.close()
            db_ok = True
        except Exception as e:
            db_error = str(e)

        wh_info = {}
        if bot_token:
            try:
                r = requests.get(f"{TELEGRAM_API}{bot_token}/getWebhookInfo", timeout=5)
                wh_info = r.json()
            except Exception as e:
                wh_info = {"error": str(e)}

        return {
            "statusCode": 200,
            "headers": headers,
            "body": json.dumps({
                "bot_token_set": bool(bot_token),
                "openai_key_set": bool(openai_key),
                "db_ok": db_ok,
                "db_error": db_error,
                "webhook": wh_info
            })
        }

    if not bot_token or not openai_key:
        return {"statusCode": 500, "headers": headers, "body": json.dumps({"error": "Missing secrets"})}

    body = event.get("body", "{}")
    if isinstance(body, str):
        try:
            update = json.loads(body)
        except (json.JSONDecodeError, TypeError):
            update = {}
    elif isinstance(body, dict):
        update = body
    else:
        update = {}

    if not isinstance(update, dict):
        update = {}

    message = update.get("message") or update.get("edited_message")
    if not message:
        return {"statusCode": 200, "headers": headers, "body": json.dumps({"ok": True})}

    chat_id = message["chat"]["id"]
    user_text = message.get("text", "").strip()

    # Голосовое сообщение → транскрибируем через Whisper
    voice = message.get("voice") or message.get("audio")
    if voice and not user_text:
        file_id = voice.get("file_id")
        print(f"[VOICE] file_id={file_id!r}")
        try:
            # Получаем путь к файлу
            file_info = requests.get(
                f"{TELEGRAM_API}{bot_token}/getFile",
                params={"file_id": file_id},
                timeout=10
            ).json()
            file_path = file_info["result"]["file_path"]
            file_url = f"https://api.telegram.org/file/bot{bot_token}/{file_path}"

            # Скачиваем аудио
            audio_bytes = requests.get(file_url, timeout=30).content
            print(f"[VOICE] downloaded {len(audio_bytes)} bytes")

            # Отправляем в Whisper
            import io
            ai_client_whisper = OpenAI(api_key=openai_key, base_url="https://api.laozhang.ai/v1")
            transcript = ai_client_whisper.audio.transcriptions.create(
                model="whisper-1",
                file=("voice.ogg", io.BytesIO(audio_bytes), "audio/ogg"),
            )
            user_text = transcript.text.strip()
            print(f"[VOICE] transcribed: {user_text!r}")

            if not user_text:
                send_message(bot_token, chat_id, "🎙 Не удалось разобрать голосовое сообщение, попробуйте ещё раз.")
                return {"statusCode": 200, "headers": headers, "body": json.dumps({"ok": True})}

            send_message(bot_token, chat_id, f"🎙 Распознано: {user_text}")
        except Exception as e:
            print(f"[VOICE] error: {e}")
            send_message(bot_token, chat_id, f"⚠️ Не удалось обработать голосовое сообщение: {e}")
            return {"statusCode": 200, "headers": headers, "body": json.dumps({"ok": True})}

    if not user_text:
        return {"statusCode": 200, "headers": headers, "body": json.dumps({"ok": True})}

    if user_text in ("/start", "/menu"):
        send_start_menu(bot_token, chat_id)
        return {"statusCode": 200, "headers": headers, "body": json.dumps({"ok": True})}

    button_map = {
        "📋 Заявки": "Покажи последние заявки с их статусами",
        "🔧 Заказ-наряды": "Покажи последние заказ-наряды с их статусами и суммами",
        "💰 Финансовый отчёт": "Сформируй финансовый отчёт за текущий месяц: доходы, расходы, прибыль",
        "➕ Создать заявку": "Хочу создать новую заявку",
        "📊 Сводка по кассам": "Покажи текущие остатки по всем кассам",
    }
    if user_text in button_map:
        user_text = button_map[user_text]

    print(f"[DB] SCHEMA={SCHEMA!r}")
    try:
        conn = get_db_connection()
        db_context = fetch_db_context(conn)
        cashboxes = get_cashboxes(conn)
        expense_groups = get_expense_groups(conn)
        bot_settings = get_bot_settings(conn)
        employees_list = get_employees_list(conn)
        clients_list = get_clients_list(conn)
    except Exception as e:
        import traceback
        print(f"[DB] ERROR: {type(e).__name__}: {e}\n{traceback.format_exc()}")
        send_message(bot_token, chat_id, f"⚠️ Ошибка подключения к БД: {type(e).__name__}: {e}")
        return {"statusCode": 200, "headers": headers, "body": json.dumps({"ok": True})}

    try:
        cashboxes_str = "\n".join([f"  id={c['id']} | {c['name']} ({c['type']}) | баланс: {c['balance']:,.0f}₽" for c in cashboxes])
        groups_str = "\n".join([f"  id={g['id']} | {g['name']}" for g in expense_groups])
        employees_str = "\n".join([f"  id={e['id']} | {e['name']} ({e['role']})" for e in employees_list]) or "  нет сотрудников"
        clients_str = "\n".join([f"  id={c['id']} | {c['name']} | тел:{c['phone']}" for c in clients_list]) or "  нет клиентов"

        custom_prompt = bot_settings.get("system_prompt")
        ai_model = bot_settings.get("ai_model", "deepseek-v3-20250324")
        language = bot_settings.get("language", "ru")

        base_prompt = custom_prompt if custom_prompt else SYSTEM_PROMPT
        lang_note = f"\n\nЯзык общения: {language}." if language and language != "ru" else ""

        system_content = base_prompt.format(
            today=datetime.now().strftime("%d.%m.%Y"),
            db_context=db_context,
            cashboxes=cashboxes_str,
            expense_groups=groups_str,
            employees=employees_str,
            clients_info=clients_str
        ) + lang_note

        raw_limit = bot_settings.get("history_limit", str(MAX_HISTORY))
        try:
            history_limit = int(raw_limit) if int(raw_limit) >= 0 else MAX_HISTORY
        except (ValueError, TypeError):
            history_limit = MAX_HISTORY

        history = [] if history_limit == 0 else load_history(conn, chat_id, history_limit)
        save_message(conn, chat_id, "user", user_text)

        messages = [{"role": "system", "content": system_content}] + history + [{"role": "user", "content": user_text}]

        print(f"[AI] user_text={user_text!r}, history={len(history)} msgs")
        print(f"[AI] model={ai_model!r}")
        ai_client = OpenAI(api_key=openai_key, base_url="https://api.laozhang.ai/v1")
        response = ai_client.chat.completions.create(
            model=ai_model,
            messages=messages,
            max_tokens=1500,
            temperature=0.4
        )

        ai_reply = response.choices[0].message.content.strip()
        print(f"[AI] reply={ai_reply!r}")

        cmd_match = re.search(r'CMD::\s*(\{.*?\})', ai_reply, re.DOTALL)
        if cmd_match:
            print(f"[AI] action detected: {cmd_match.group(1)}")
            try:
                action_data = json.loads(cmd_match.group(1))
                process_ai_action(conn, action_data, bot_token, chat_id)
                clean = re.sub(r'CMD::\s*\{.*?\}', '', ai_reply, flags=re.DOTALL).strip()
                reply_to_save = clean or f"✅ Выполнено: {action_data.get('action')}"
                save_message(conn, chat_id, "assistant", reply_to_save)
            except (json.JSONDecodeError, Exception) as ex:
                print(f"[AI] action error: {ex}")
                clean = re.sub(r'CMD::\s*\{.*?\}', '', ai_reply, flags=re.DOTALL).strip()
                if clean:
                    send_message(bot_token, chat_id, clean, parse_mode="")
                    save_message(conn, chat_id, "assistant", clean)
        else:
            send_message(bot_token, chat_id, ai_reply, parse_mode="")
            save_message(conn, chat_id, "assistant", ai_reply)

    except Exception as e:
        print(f"[AI] ERROR: {type(e).__name__}: {e}")
        send_message(bot_token, chat_id, f"⚠️ Ошибка: {e}")
    finally:
        try:
            conn.close()
        except Exception:
            pass

    return {"statusCode": 200, "headers": headers, "body": json.dumps({"ok": True})}
"""
Telegram-бот с ИИ для управления автосервисом.
Обрабатывает сообщения пользователей, работает с БД через прямые запросы,
формирует ответы через OpenAI на основе реальных данных системы.
"""

import json
import os
import re
import requests
import psycopg2
from datetime import datetime
from openai import OpenAI

TELEGRAM_API = "https://api.telegram.org/bot"


def get_db_connection():
    schema = os.environ.get("MAIN_DB_SCHEMA", "public")
    conn = psycopg2.connect(os.environ["DATABASE_URL"], options=f"-c search_path={schema}")
    conn.autocommit = True
    return conn


def send_message(bot_token: str, chat_id: int, text: str, parse_mode: str = "Markdown", reply_markup: dict = None):
    url = f"{TELEGRAM_API}{bot_token}/sendMessage"
    payload = {"chat_id": chat_id, "text": text, "parse_mode": parse_mode}
    if reply_markup:
        payload["reply_markup"] = reply_markup
    requests.post(url, json=payload, timeout=10)


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


def fetch_db_context(conn) -> str:
    """Получаем актуальные данные из БД для контекста ИИ"""
    cur = conn.cursor()
    context_parts = []

    # Заявки (последние 30)
    cur.execute("""
        SELECT id, client_name, phone, car, status, comment, created_at
        FROM orders
        ORDER BY created_at DESC LIMIT 30
    """)
    orders = cur.fetchall()
    if orders:
        orders_text = "ЗАЯВКИ (последние 30):\n"
        for o in orders:
            orders_text += f"  ID:{o[0]} | {o[1]} | тел:{o[2]} | авто:{o[3]} | статус:{o[4]} | {o[6].strftime('%d.%m.%Y') if o[6] else ''} | {o[5] or ''}\n"
        context_parts.append(orders_text)

    # Заказ-наряды (последние 30)
    cur.execute("""
        SELECT wo.id, c.name as client, ca.make||' '||ca.model as car, wo.status,
               wo.master, wo.created_at,
               COALESCE(SUM(ww.price * ww.quantity * (1 - COALESCE(ww.discount,0)/100.0)), 0) +
               COALESCE(SUM(wp.sale_price * wp.quantity), 0) as total
        FROM work_orders wo
        LEFT JOIN clients c ON wo.client_id = c.id
        LEFT JOIN cars ca ON wo.car_id = ca.id
        LEFT JOIN work_order_works ww ON ww.work_order_id = wo.id
        LEFT JOIN work_order_parts wp ON wp.work_order_id = wo.id
        GROUP BY wo.id, c.name, ca.make, ca.model, wo.status, wo.master, wo.created_at
        ORDER BY wo.created_at DESC LIMIT 30
    """)
    wos = cur.fetchall()
    if wos:
        wo_text = "ЗАКАЗ-НАРЯДЫ (последние 30):\n"
        for w in wos:
            wo_text += f"  ID:{w[0]} | {w[1]} | авто:{w[2]} | статус:{w[3]} | мастер:{w[4]} | {w[5].strftime('%d.%m.%Y') if w[5] else ''} | сумма:{w[6]:.0f}₽\n"
        context_parts.append(wo_text)

    # Кассы
    cur.execute("SELECT name, type, balance FROM cashboxes WHERE is_active = TRUE")
    cashboxes = cur.fetchall()
    if cashboxes:
        cash_text = "КАССЫ:\n"
        for cb in cashboxes:
            cash_text += f"  {cb[0]} ({cb[1]}): {cb[2]:.0f}₽\n"
        context_parts.append(cash_text)

    # Доходы за текущий месяц
    cur.execute("""
        SELECT COALESCE(SUM(amount), 0) as income
        FROM payments
        WHERE created_at >= date_trunc('month', NOW())
    """)
    income = cur.fetchone()

    # Расходы за текущий месяц
    cur.execute("""
        SELECT COALESCE(SUM(amount), 0) as expenses
        FROM expenses
        WHERE created_at >= date_trunc('month', NOW())
    """)
    expense = cur.fetchone()

    now = datetime.now()
    context_parts.append(
        f"ФИНАНСЫ (текущий месяц {now.strftime('%B %Y')}):\n"
        f"  Доходы: {income[0]:.0f}₽\n"
        f"  Расходы: {expense[0]:.0f}₽\n"
        f"  Прибыль: {(income[0] - expense[0]):.0f}₽"
    )

    # Последние платежи
    cur.execute("""
        SELECT p.amount, p.payment_method, p.comment, p.created_at, cb.name
        FROM payments p
        LEFT JOIN cashboxes cb ON p.cashbox_id = cb.id
        ORDER BY p.created_at DESC LIMIT 10
    """)
    payments = cur.fetchall()
    if payments:
        pay_text = "ПОСЛЕДНИЕ ПЛАТЕЖИ (10 шт):\n"
        for p in payments:
            pay_text += f"  {p[3].strftime('%d.%m.%Y') if p[3] else ''} | {p[0]:.0f}₽ | {p[1]} | касса:{p[4]} | {p[2] or ''}\n"
        context_parts.append(pay_text)

    # Клиенты
    cur.execute("SELECT COUNT(*) FROM clients")
    clients_count = cur.fetchone()[0]
    context_parts.append(f"ВСЕГО КЛИЕНТОВ В БАЗЕ: {clients_count}")

    cur.close()
    return "\n\n".join(context_parts)


def create_order_in_db(conn, client_name: str, phone: str, car: str, comment: str) -> int:
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO orders (client_name, phone, car, comment, status, source)
        VALUES (%s, %s, %s, %s, 'new', 'telegram')
        RETURNING id
    """, (client_name, phone, car, comment))
    order_id = cur.fetchone()[0]
    cur.close()
    return order_id


def update_work_order_status_in_db(conn, work_order_id: int, status: str) -> bool:
    valid_statuses = ["new", "in-progress", "done", "issued"]
    if status not in valid_statuses:
        return False
    cur = conn.cursor()
    cur.execute("UPDATE work_orders SET status = %s WHERE id = %s", (status, work_order_id))
    updated = cur.rowcount > 0
    cur.close()
    return updated


def get_work_order_detail(conn, work_order_id: int) -> str:
    cur = conn.cursor()

    cur.execute("""
        SELECT wo.id, c.name, c.phone,
               ca.make||' '||ca.model||' '||COALESCE(ca.year::text,'') as car,
               wo.status, wo.master, wo.created_at, wo.issued_at
        FROM work_orders wo
        LEFT JOIN clients c ON wo.client_id = c.id
        LEFT JOIN cars ca ON wo.car_id = ca.id
        WHERE wo.id = %s
    """, (work_order_id,))
    wo = cur.fetchone()
    if not wo:
        return f"Заказ-наряд #{work_order_id} не найден."

    cur.execute("SELECT name, quantity, price, discount FROM work_order_works WHERE work_order_id = %s", (work_order_id,))
    works = cur.fetchall()

    cur.execute("SELECT name, quantity, sale_price FROM work_order_parts WHERE work_order_id = %s", (work_order_id,))
    parts = cur.fetchall()

    total_works = sum(w[1] * w[2] * (1 - (w[3] or 0) / 100) for w in works)
    total_parts = sum(p[1] * p[2] for p in parts)
    total = total_works + total_parts

    status_map = {"new": "Новый", "in-progress": "В работе", "done": "Готов", "issued": "Выдан"}

    result = f"📋 Заказ-наряд #{wo[0]}\n"
    result += f"Клиент: {wo[1]} | тел: {wo[2]}\n"
    result += f"Авто: {wo[3]}\n"
    result += f"Статус: {status_map.get(wo[4], wo[4])}\n"
    result += f"Мастер: {wo[5] or 'не назначен'}\n"
    result += f"Создан: {wo[6].strftime('%d.%m.%Y') if wo[6] else '—'}\n"
    if wo[7]:
        result += f"Выдан: {wo[7].strftime('%d.%m.%Y')}\n"

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


SYSTEM_PROMPT = """Ты — ИИ-помощник автосервиса. Ты работаешь внутри Telegram-бота.
У тебя есть доступ к актуальным данным базы данных системы.

Ты умеешь:
1. Отвечать на вопросы о заявках, заказ-нарядах, клиентах, финансах
2. Формировать финансовые отчёты по данным из БД
3. Создавать новые заявки (когда пользователь явно просит)
4. Изменять статус заказ-нарядов

Когда нужно создать заявку — запроси у пользователя: имя клиента, телефон, авто (марка/модель), что нужно сделать.
Когда все данные есть — ответь строго в формате JSON-команды:
{{"action": "create_order", "client_name": "...", "phone": "...", "car": "...", "comment": "..."}}

Когда нужно изменить статус заказ-наряда — ответь в формате:
{{"action": "update_wo_status", "id": 123, "status": "in-progress"}}
(допустимые статусы: new, in-progress, done, issued)

Когда нужна детальная информация о конкретном заказ-наряде — ответь в формате:
{{"action": "get_wo_detail", "id": 123}}

Во всех остальных случаях — отвечай обычным текстом на русском языке.
Будь лаконичен, профессионален, используй данные из БД для точных ответов.
Сегодняшняя дата: {today}

ДАННЫЕ ИЗ БАЗЫ ДАННЫХ:
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

    # GET /ping — диагностика
    if event.get("httpMethod") == "GET":
        db_ok = False
        db_error = ""
        try:
            conn_test = get_db_connection()
            cur = conn_test.cursor()
            cur.execute("SELECT COUNT(*) FROM orders")
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

    if not user_text:
        return {"statusCode": 200, "headers": headers, "body": json.dumps({"ok": True})}

    # Команда /start — показываем меню
    if user_text in ("/start", "/menu"):
        send_start_menu(bot_token, chat_id)
        return {"statusCode": 200, "headers": headers, "body": json.dumps({"ok": True})}

    # Кнопки меню — превращаем в понятные запросы для ИИ
    button_map = {
        "📋 Заявки": "Покажи последние заявки с их статусами",
        "🔧 Заказ-наряды": "Покажи последние заказ-наряды с их статусами и суммами",
        "💰 Финансовый отчёт": "Сформируй финансовый отчёт за текущий месяц: доходы, расходы, прибыль",
        "➕ Создать заявку": "Хочу создать новую заявку",
        "📊 Сводка по кассам": "Покажи текущие остатки по всем кассам",
    }
    if user_text in button_map:
        user_text = button_map[user_text]

    try:
        conn = get_db_connection()
        db_context = fetch_db_context(conn)
    except Exception as e:
        send_message(bot_token, chat_id, f"⚠️ Ошибка подключения к БД: {type(e).__name__}: {e}")
        return {"statusCode": 200, "headers": headers, "body": json.dumps({"ok": True})}

    try:
        system_content = SYSTEM_PROMPT.format(
            today=datetime.now().strftime("%d.%m.%Y"),
            db_context=db_context
        )

        client = OpenAI(api_key=openai_key, base_url="https://api.laozhang.ai/v1")
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_content},
                {"role": "user", "content": user_text}
            ],
            max_tokens=1000,
            temperature=0.3
        )

        ai_reply = response.choices[0].message.content.strip()

        # Проверяем, нет ли JSON-команды в ответе ИИ
        json_match = re.search(r'\{[^{}]*"action"[^{}]*\}', ai_reply, re.DOTALL)
        if json_match:
            try:
                action_data = json.loads(json_match.group())
                process_ai_action(conn, action_data, bot_token, chat_id)
            except json.JSONDecodeError:
                send_message(bot_token, chat_id, ai_reply)
        else:
            send_message(bot_token, chat_id, ai_reply)

    except Exception as e:
        send_message(bot_token, chat_id, f"⚠️ Ошибка: {e}")
    finally:
        try:
            conn.close()
        except Exception:
            pass

    return {"statusCode": 200, "headers": headers, "body": json.dumps({"ok": True})}
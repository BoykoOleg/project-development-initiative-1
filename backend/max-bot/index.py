"""
Бот для Макс (MAX messenger) с ИИ.
Общается с клиентами, собирает данные заявки (имя, описание, телефон, авто),
создаёт заявку в системе и уведомляет владельца.

API: https://platform-api.max.ru
Auth: заголовок Authorization: {token}
Отправка: POST /messages?user_id={user_id}  {"text": "..."}
Вебхук: POST /subscriptions {"url": "...", "update_types": ["message_created", "bot_started"]}
Update структура:
  {
    "update_type": "message_created",
    "timestamp": 1234567890,
    "message": {
      "sender": {"user_id": 123, "first_name": "Иван"},
      "recipient": {"chat_id": "456", "user_id": 789},
      "body": {"text": "Привет"},
      "timestamp": 1234567890
    }
  }
  Для bot_started: {"update_type": "bot_started", "chat_id": 123, "user": {"user_id": 123, ...}}
"""

import json
import os
import re
import traceback
import psycopg2
import psycopg2.extras
import requests
from datetime import datetime
from openai import OpenAI

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "public")
MAX_API = "https://platform-api.max.ru"

SYSTEM_PROMPT = """Ты — вежливый менеджер по продажам установочного центра. Общаешься с клиентами в мессенджере Макс.
Твоя цель — привлечь клиентов которые обращаются к тебе за помощью. от твоей работы зависит развите и судьба установочного центра. 

Правила:
— Общайся естественно и дружелюбно, по-русски.
— Задавай вопросы по одному, не спрашивай всё сразу.
— Когда работа с клиентом закончена  — подтверди это клиенту и скажи что заявка принята.
— Не придумывай цены, сроки, гарантии — для этого с клиентом свяжется мастер.
— Как только у тебя есть имя, телефон, автомобиль и описание проблемы — создай заявку через команду CMD.

Когда все 4 поля собраны, верни в ответе строку вида:
CMD::{{"action":"create_order","client":"ИМЯ","phone":"ТЕЛЕФОН","car":"МАРКА МОДЕЛЬ ГОД","comment":"ОПИСАНИЕ"}}

После CMD:: напиши клиенту подтверждение: "Отлично! Заявка принята. Наш мастер свяжется с вами в ближайшее время."

Сегодня: {today}
"""

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}


def t(name):
    return f"{SCHEMA}.{name}"


def resp(status, body):
    return {
        "statusCode": status,
        "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
        "body": json.dumps(body, default=str, ensure_ascii=False),
    }


def ok():
    return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}


# ── Макс API ──────────────────────────────────────────────────────────────────

def send_to_user(token: str, user_id, text: str):
    """Отправить личное сообщение пользователю по user_id."""
    try:
        r = requests.post(
            f"{MAX_API}/messages",
            params={"user_id": str(user_id)},
            headers={"Authorization": token, "Content-Type": "application/json"},
            json={"text": text},
            timeout=10,
        )
        print(f"[MAX] send user_id={user_id} status={r.status_code} body={r.text[:200]}")
    except Exception as e:
        print(f"[MAX] send error: {e}")


def register_webhook(token: str, webhook_url: str):
    """Зарегистрировать вебхук в Макс."""
    try:
        r = requests.post(
            f"{MAX_API}/subscriptions",
            headers={"Authorization": token, "Content-Type": "application/json"},
            json={"url": webhook_url, "update_types": ["message_created", "bot_started"]},
            timeout=10,
        )
        return r.json()
    except Exception as e:
        return {"error": str(e)}


# ── БД ────────────────────────────────────────────────────────────────────────

def get_conn():
    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    conn.autocommit = True
    return conn


def load_history(conn, chat_id: str, limit: int = 30) -> list:
    with conn.cursor() as cur:
        cur.execute(f"""
            SELECT role, content FROM (
                SELECT role, content, created_at
                FROM {t('bot_messages')}
                WHERE chat_id = %s
                ORDER BY created_at DESC
                LIMIT %s
            ) sub ORDER BY created_at ASC
        """, (chat_id, limit))
        return [{"role": r[0], "content": r[1]} for r in cur.fetchall()]


def save_message(conn, chat_id: str, role: str, content: str):
    with conn.cursor() as cur:
        cur.execute(
            f"INSERT INTO {t('bot_messages')} (chat_id, role, content) VALUES (%s, %s, %s)",
            (chat_id, role, content),
        )


# ── ИИ ────────────────────────────────────────────────────────────────────────

def call_ai(openai_key: str, messages: list) -> str:
    client = OpenAI(api_key=openai_key, base_url="https://api.laozhang.ai/v1")
    response = client.chat.completions.create(
        model="qwen3.5-plus-2026-02-15",
        messages=messages,
        max_tokens=1000,
        temperature=0.5,
    )
    return response.choices[0].message.content.strip()


def extract_cmd(text: str):
    """Извлекает JSON из CMD:: ... с учётом вложенных скобок."""
    idx = text.find("CMD::")
    if idx == -1:
        return None, text
    start = text.find("{", idx)
    if start == -1:
        return None, text
    depth = 0
    for i, ch in enumerate(text[start:], start):
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                json_str = text[start:i + 1]
                clean = (text[:idx] + text[i + 1:]).strip()
                return json_str, clean
    return None, text


# ── Создание заявки ───────────────────────────────────────────────────────────

def normalize_phone(phone: str) -> str:
    digits = re.sub(r"\D", "", phone)
    if len(digits) == 11 and digits[0] in ("7", "8"):
        digits = "7" + digits[1:]
    elif len(digits) == 10:
        digits = "7" + digits
    if len(digits) != 11:
        return phone.strip()
    return f"+7 ({digits[1:4]}) {digits[4:7]}-{digits[7:9]}-{digits[9:11]}"


def create_order_in_db(conn, data: dict) -> dict:
    client_name = data.get("client", "").strip()
    phone = normalize_phone(data.get("phone", "").strip())
    car = data.get("car", "").strip()
    comment = data.get("comment", "").strip()

    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        digits = re.sub(r"\D", "", phone)
        client_id = None
        if digits:
            cur.execute(f"SELECT id, phone FROM {t('clients')}")
            for row in cur.fetchall():
                c_digits = re.sub(r"\D", "", row["phone"] or "")
                if c_digits and c_digits == digits:
                    client_id = row["id"]
                    break

        if not client_id:
            cur.execute(
                f"INSERT INTO {t('clients')} (name, phone) VALUES (%s, %s) RETURNING id",
                (client_name, phone),
            )
            client_id = cur.fetchone()["id"]

        cur.execute(
            f"""INSERT INTO {t('orders')} (client_id, client_name, phone, car_info, service, status, comment, source)
               VALUES (%s, %s, %s, %s, %s, 'new', %s, 'max_bot') RETURNING id""",
            (client_id, client_name, phone, car, "", comment),
        )
        order_id = cur.fetchone()["id"]
        return {
            "id": order_id,
            "number": f"З-{str(order_id).zfill(4)}",
            "client": client_name,
            "phone": phone,
            "car": car,
            "comment": comment,
        }


# ── Главный обработчик ────────────────────────────────────────────────────────

def handler(event: dict, context) -> dict:
    """Вебхук бота Макс: принимает сообщения клиентов, ведёт ИИ-диалог, создаёт заявки."""

    if event.get("httpMethod") == "OPTIONS":
        return ok()

    bot_token = os.environ.get("MAX_BOT_TOKEN", "")
    openai_key = os.environ.get("OPENAI_API_KEY", "")
    admin_user_id = os.environ.get("MAX_ADMIN_CHAT_ID", "")

    # GET — healthcheck + регистрация вебхука
    if event.get("httpMethod") == "GET":
        params = event.get("queryStringParameters") or {}
        # ?register=1&url=https://... — зарегистрировать вебхук
        if params.get("register") and params.get("url") and bot_token:
            result = register_webhook(bot_token, params["url"])
            return resp(200, {"webhook_register": result})
        return resp(200, {
            "status": "ok",
            "token_set": bool(bot_token),
            "openai_set": bool(openai_key),
            "admin_set": bool(admin_user_id),
        })

    if not bot_token or not openai_key:
        return resp(500, {"error": "Missing MAX_BOT_TOKEN or OPENAI_API_KEY"})

    body = event.get("body", "{}")
    if isinstance(body, str):
        try:
            update = json.loads(body)
        except (json.JSONDecodeError, TypeError):
            update = {}
    else:
        update = body or {}

    print(f"[MAX] update: {json.dumps(update)[:600]}")

    update_type = update.get("update_type", "")

    # bot_started — клиент открыл бота впервые
    if update_type == "bot_started":
        user_id = (update.get("user") or {}).get("user_id") or update.get("chat_id")
        if user_id and bot_token:
            send_to_user(bot_token, user_id, "Привет! Я помощник автосервиса. Расскажите, что случилось с вашим автомобилем, и я запишу вас на ремонт.")
        return ok()

    # message_created — обычное сообщение
    if update_type != "message_created":
        return ok()

    msg = update.get("message", {})
    sender = msg.get("sender", {})
    user_id = sender.get("user_id")
    text = (msg.get("body") or {}).get("text", "").strip()

    if not user_id or not text:
        return ok()

    # Используем user_id как chat_id для хранения истории (bigint в БД)
    chat_key = int(user_id)

    conn = None
    try:
        conn = get_conn()
        save_message(conn, chat_key, "user", text)
        history = load_history(conn, chat_key, limit=20)

        system_content = SYSTEM_PROMPT.format(today=datetime.now().strftime("%d.%m.%Y"))
        messages = [{"role": "system", "content": system_content}] + history + [{"role": "user", "content": text}]

        ai_reply = call_ai(openai_key, messages)
        print(f"[AI] reply: {ai_reply[:300]}")

        json_str, clean_reply = extract_cmd(ai_reply)

        if json_str:
            try:
                order_data = json.loads(json_str)
                order = create_order_in_db(conn, order_data)
                confirm = clean_reply or "Заявка принята! Наш мастер свяжется с вами в ближайшее время."
                save_message(conn, chat_key, "assistant", confirm)
                send_to_user(bot_token, user_id, confirm)

                # Уведомление владельцу
                if admin_user_id:
                    notify = (
                        f"🔔 Новая заявка из Макс {order['number']}\n"
                        f"👤 {order['client']}\n"
                        f"📞 {order['phone']}\n"
                        f"🚗 {order['car']}\n"
                        f"📝 {order['comment']}"
                    )
                    send_to_user(bot_token, admin_user_id, notify)
            except Exception as ex:
                print(f"[ORDER] error: {ex}\n{traceback.format_exc()}")
                fallback = clean_reply or ai_reply
                save_message(conn, chat_key, "assistant", fallback)
                send_to_user(bot_token, user_id, fallback)
        else:
            save_message(conn, chat_key, "assistant", ai_reply)
            send_to_user(bot_token, user_id, ai_reply)

    except Exception as e:
        print(f"[MAX] error: {e}\n{traceback.format_exc()}")
        if bot_token and user_id:
            send_to_user(bot_token, user_id, "Произошла ошибка, попробуйте позже.")
    finally:
        if conn:
            conn.close()

    return ok()
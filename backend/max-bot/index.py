"""
Бот для Макс (VK Teams / Mail.ru) с ИИ.
Общается с клиентами, собирает данные заявки (имя, телефон, авто, описание),
создаёт заявку в системе и уведомляет владельца.
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

MAX_API = "https://api.max.ru/bot/v1"

SYSTEM_PROMPT = """Ты — вежливый помощник автосервиса. Общаешься с клиентами в мессенджере Макс.
Твоя цель — собрать данные для заявки: имя, телефон, марку и модель автомобиля, год выпуска, описание проблемы или нужной работы.

Правила:
— Общайся естественно и дружелюбно, по-русски.
— Задавай вопросы по одному, не спрашивай всё сразу.
— Когда все данные собраны — подтверди их клиенту и скажи что заявка принята.
— Не придумывай цены, сроки, гарантии — для этого с клиентом свяжется мастер.
— Как только у тебя есть имя, телефон, автомобиль и описание проблемы — создай заявку через команду CMD.

Когда все 4 поля собраны, верни в ответе строку вида:
CMD::{"action":"create_order","client":"ИМЯ","phone":"ТЕЛЕФОН","car":"МАРКА МОДЕЛЬ ГОД","comment":"ОПИСАНИЕ"}

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

def send_message(token: str, chat_id: str, text: str):
    try:
        requests.post(
            f"{MAX_API}/messages/send",
            headers={"Authorization": f"Bearer {token}"},
            json={"recipient": {"chat_id": chat_id}, "text": text},
            timeout=10,
        )
    except Exception as e:
        print(f"[MAX] send error: {e}")


# ── БД ────────────────────────────────────────────────────────────────────────

def get_conn():
    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    conn.autocommit = True
    return conn


def load_history(conn, chat_id: str, limit: int = 40) -> list:
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
        model="deepseek-v3-20250324",
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
        # Найти или создать клиента
        digits = re.sub(r"\D", "", phone)
        client_id = None
        if digits:
            cur.execute(f"SELECT id FROM {t('clients')} ORDER BY id")
            for row in cur.fetchall():
                c_digits = re.sub(r"\D", "", row["id"] and "" or "")
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
               VALUES (%s, %s, %s, %s, %s, 'new', %s, 'max_bot') RETURNING id, created_at""",
            (client_id, client_name, phone, car, "", comment),
        )
        row = cur.fetchone()
        return {
            "id": row["id"],
            "number": f"З-{str(row['id']).zfill(4)}",
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
    admin_chat_id = os.environ.get("MAX_ADMIN_CHAT_ID", "")

    if event.get("httpMethod") == "GET":
        return resp(200, {
            "status": "ok",
            "token_set": bool(bot_token),
            "openai_set": bool(openai_key),
            "admin_chat_set": bool(admin_chat_id),
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

    print(f"[MAX] update: {json.dumps(update)[:500]}")

    # Макс присылает обновления в поле updates[]
    updates = update.get("updates") or ([update] if update.get("message") else [])

    for upd in updates:
        try:
            msg = upd.get("message") or upd
            chat_id = None

            # Получаем chat_id из разных мест структуры Макс
            if msg.get("recipient"):
                chat_id = str(msg["recipient"].get("chat_id") or "")
            if not chat_id and msg.get("sender"):
                chat_id = str(msg["sender"].get("user_id") or "")
            if not chat_id:
                continue

            text = (msg.get("body", {}) or {}).get("text", "").strip()
            if not text:
                continue

            conn = get_conn()
            try:
                save_message(conn, chat_id, "user", text)
                history = load_history(conn, chat_id, limit=20)

                system_content = SYSTEM_PROMPT.format(today=datetime.now().strftime("%d.%m.%Y"))
                messages = [{"role": "system", "content": system_content}] + history + [{"role": "user", "content": text}]

                ai_reply = call_ai(openai_key, messages)
                print(f"[AI] reply: {ai_reply[:200]}")

                json_str, clean_reply = extract_cmd(ai_reply)

                if json_str:
                    try:
                        order_data = json.loads(json_str)
                        order = create_order_in_db(conn, order_data)
                        save_message(conn, chat_id, "assistant", clean_reply or "Заявка принята!")
                        send_message(bot_token, chat_id, clean_reply or "Заявка принята! Мастер свяжется с вами в ближайшее время.")

                        # Уведомление владельцу
                        if admin_chat_id:
                            notify = (
                                f"🔔 Новая заявка из Макс {order['number']}\n"
                                f"👤 {order['client']}\n"
                                f"📞 {order['phone']}\n"
                                f"🚗 {order['car']}\n"
                                f"📝 {order['comment']}"
                            )
                            send_message(bot_token, admin_chat_id, notify)
                    except Exception as ex:
                        print(f"[ORDER] error: {ex}\n{traceback.format_exc()}")
                        save_message(conn, chat_id, "assistant", clean_reply or ai_reply)
                        send_message(bot_token, chat_id, clean_reply or ai_reply)
                else:
                    save_message(conn, chat_id, "assistant", ai_reply)
                    send_message(bot_token, chat_id, ai_reply)

            finally:
                conn.close()

        except Exception as e:
            print(f"[MAX] handler error: {e}\n{traceback.format_exc()}")

    return ok()

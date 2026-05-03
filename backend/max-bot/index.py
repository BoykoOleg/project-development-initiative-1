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

import base64
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

def get_photo_url(attachment: dict) -> str:
    """Извлечь прямой URL фото из вложения Макс."""
    payload = attachment.get("payload", {})
    return payload.get("url", "")


def download_photo_b64(attachment: dict) -> tuple:
    """Скачать фото, принудительно конвертировать в JPEG через Pillow."""
    import io
    try:
        from PIL import Image
        has_pil = True
    except ImportError:
        has_pil = False

    payload = attachment.get("payload", {})
    photo_url = payload.get("url", "")

    if not photo_url:
        raise ValueError("No photo URL in attachment")

    r = requests.get(photo_url, timeout=20, allow_redirects=True)
    r.raise_for_status()
    photo_bytes = r.content
    print(f"[PHOTO] downloaded {len(photo_bytes)} bytes, content-type={r.headers.get('Content-Type')}")

    if has_pil:
        # Принудительно конвертируем в JPEG через Pillow
        img = Image.open(io.BytesIO(photo_bytes)).convert("RGB")
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=90)
        photo_bytes = buf.getvalue()

    b64 = base64.b64encode(photo_bytes).decode("utf-8")
    return b64, "image/jpeg"


def recognize_photo(openai_key: str, photo_url: str, b64: str, caption: str = "") -> str:
    """Распознать фото через GPT-4o Vision — сначала по URL, при ошибке через base64."""
    vision_prompt = (
        "Внимательно рассмотри фотографию и извлеки ВСЮ текстовую информацию.\n"
        "Если это документ (СТС, ПТС, права, страховка) — перечисли все поля и значения.\n"
        "Если это автомобиль — укажи марку, модель, цвет, госномер (если видны).\n"
        "Если есть ФИО, даты, телефоны, VIN, адреса — укажи всё.\n"
        "Если это фото запчасти — укажи название, артикул, маркировку.\n"
        "Ответь кратко, структурированно. Только факты с фото."
    )
    if caption:
        vision_prompt += f"\n\nПодпись к фото от пользователя: «{caption}»"

    ai_client = OpenAI(api_key=openai_key, base_url="https://api.laozhang.ai/v1", timeout=25.0)

    # Сначала пробуем через прямой URL (быстрее, не нужен base64)
    if photo_url:
        try:
            response = ai_client.chat.completions.create(
                model="gpt-4o",
                messages=[{
                    "role": "user",
                    "content": [
                        {"type": "text", "text": vision_prompt},
                        {"type": "image_url", "image_url": {"url": photo_url, "detail": "high"}},
                    ]
                }],
                max_tokens=800,
                temperature=0.2,
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            print(f"[PHOTO] URL method failed: {e}, trying base64...")

    # Fallback: base64
    response = ai_client.chat.completions.create(
        model="gpt-4o",
        messages=[{
            "role": "user",
            "content": [
                {"type": "text", "text": vision_prompt},
                {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{b64}", "detail": "high"}},
            ]
        }],
        max_tokens=800,
        temperature=0.2,
    )
    return response.choices[0].message.content.strip()


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

def call_ai(openai_key: str, messages: list, model: str = "deepseek-v3-20250324") -> str:
    client = OpenAI(api_key=openai_key, base_url="https://api.laozhang.ai/v1", timeout=25.0)
    response = client.chat.completions.create(
        model=model,
        messages=messages,
        max_tokens=500,
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


def check_all_fields_collected(openai_key: str, messages: list) -> dict | None:
    """
    Проверяет через ИИ — есть ли в истории все 4 поля заявки.
    Если да — возвращает {'client','phone','car','comment'}, иначе None.
    """
    client = OpenAI(api_key=openai_key, base_url="https://api.laozhang.ai/v1", timeout=15.0)
    check_prompt = (
        "Проанализируй переписку выше. Определи, собраны ли все данные для заявки:\n"
        "1. Имя клиента\n"
        "2. Номер телефона\n"
        "3. Автомобиль (марка, модель)\n"
        "4. Описание проблемы / услуги\n\n"
        "Если ВСЕ 4 поля есть — верни ТОЛЬКО JSON без пояснений:\n"
        "{\"ready\": true, \"client\": \"ИМЯ\", \"phone\": \"ТЕЛЕФОН\", \"car\": \"АВТО\", \"comment\": \"ОПИСАНИЕ\"}\n\n"
        "Если чего-то не хватает — верни: {\"ready\": false}\n"
        "ТОЛЬКО JSON, никакого другого текста."
    )
    try:
        resp = client.chat.completions.create(
            model="deepseek-v3-20250324",
            messages=messages + [{"role": "user", "content": check_prompt}],
            max_tokens=200,
            temperature=0.0,
        )
        raw = resp.choices[0].message.content.strip()
        # Извлекаем JSON из ответа
        start = raw.find("{")
        end = raw.rfind("}") + 1
        if start >= 0 and end > start:
            data = json.loads(raw[start:end])
            if data.get("ready"):
                return data
    except Exception as e:
        print(f"[CHECK_FIELDS] error: {e}")
    return None





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
    digits = re.sub(r"\D", "", phone)

    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        # Дедупликация: проверяем заявки за последние 60 минут с тем же телефоном и авто
        if digits:
            cur.execute(f"""
                SELECT id, client_name, phone, car_info, comment FROM {t('orders')}
                WHERE source = 'max_bot'
                  AND regexp_replace(phone, '[^0-9]', '', 'g') LIKE %s
                  AND car_info ILIKE %s
                  AND created_at > NOW() - INTERVAL '60 minutes'
                ORDER BY created_at DESC LIMIT 1
            """, (f"%{digits[-10:]}%", f"%{car[:15]}%"))
            existing = cur.fetchone()
            if existing:
                print(f"[ORDER] дубликат — заявка уже существует: З-{str(existing['id']).zfill(4)}")
                return {
                    "id": existing["id"],
                    "number": f"З-{str(existing['id']).zfill(4)}",
                    "client": existing["client_name"],
                    "phone": existing["phone"],
                    "car": existing["car_info"],
                    "comment": existing["comment"],
                    "duplicate": True,
                }

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

    # GET — healthcheck / статус / регистрация вебхука
    if event.get("httpMethod") == "GET":
        params = event.get("queryStringParameters") or {}

        if params.get("register") and params.get("url") and bot_token:
            result = register_webhook(bot_token, params["url"])
            return resp(200, {"webhook_register": result})

        # Считаем кол-во диалогов в истории
        history_count = 0
        ai_model_saved = "deepseek-v3-20250324"
        enabled_saved = True
        try:
            conn = get_conn()
            with conn.cursor() as cur:
                cur.execute(f"SELECT COUNT(DISTINCT chat_id) FROM {t('bot_messages')}")
                history_count = cur.fetchone()[0] or 0
                cur.execute(f"SELECT key, value FROM {t('bot_settings')} WHERE key IN ('max_ai_model','max_enabled')")
                for row in cur.fetchall():
                    if row[0] == "max_ai_model":
                        ai_model_saved = row[1]
                    elif row[0] == "max_enabled":
                        enabled_saved = row[1] != "false"
            conn.close()
        except Exception as e:
            print(f"[GET] db error: {e}")

        return resp(200, {
            "status": "ok",
            "token_set": bool(bot_token),
            "openai_set": bool(openai_key),
            "admin_set": bool(admin_user_id),
            "history_count": history_count,
            "ai_model": ai_model_saved,
            "enabled": enabled_saved,
        })

    # DELETE — очистить историю диалогов
    if event.get("httpMethod") == "DELETE":
        try:
            conn = get_conn()
            with conn.cursor() as cur:
                cur.execute(f"DELETE FROM {t('bot_messages')}")
            conn.close()
            return resp(200, {"ok": True, "cleared": True})
        except Exception as e:
            return resp(500, {"error": str(e)})

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

    # POST settings — сохранение настроек из UI
    if update.get("action") == "settings":
        try:
            conn = get_conn()
            with conn.cursor() as cur:
                if "ai_model" in update:
                    cur.execute(
                        f"INSERT INTO {t('bot_settings')} (key, value) VALUES ('max_ai_model', %s) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
                        (update["ai_model"],)
                    )
                if "enabled" in update:
                    cur.execute(
                        f"INSERT INTO {t('bot_settings')} (key, value) VALUES ('max_enabled', %s) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
                        (str(update["enabled"]).lower(),)
                    )
            conn.close()
            return resp(200, {"ok": True})
        except Exception as e:
            print(f"[SETTINGS] error: {e}")
            return resp(500, {"error": str(e)})

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
    body = msg.get("body") or {}
    text = body.get("text", "").strip()
    attachments = body.get("attachments") or []

    # Фильтруем вложения-изображения
    photo_attachments = [a for a in attachments if a.get("type") == "image"]

    if not user_id or (not text and not photo_attachments):
        return ok()

    # Сообщения от владельца/администратора игнорируем
    if str(user_id) == str(admin_user_id) or str(user_id) == "28855663":
        print(f"[MAX] игнорируем сообщение от администратора {user_id}")
        return ok()

    # Используем user_id как chat_id для хранения истории (bigint в БД)
    chat_key = int(user_id)

    conn = None
    try:
        conn = get_conn()

        # Читаем настройки из БД
        ai_model = "deepseek-v3-20250324"
        bot_enabled = True
        try:
            with conn.cursor() as cur:
                cur.execute(f"SELECT key, value FROM {t('bot_settings')} WHERE key IN ('max_ai_model','max_enabled')")
                for row in cur.fetchall():
                    if row[0] == "max_ai_model":
                        ai_model = row[1]
                    elif row[0] == "max_enabled":
                        bot_enabled = row[1] != "false"
        except Exception as e:
            print(f"[SETTINGS] read error: {e}")

        if not bot_enabled:
            print(f"[MAX] bot is disabled, ignoring message from {user_id}")
            conn.close()
            return ok()

        # Если есть фото — распознаём через Vision
        if photo_attachments:
            send_to_user(bot_token, user_id, "🔍 Читаю фото...")
            photo_texts = []
            for att in photo_attachments[:3]:  # максимум 3 фото
                try:
                    photo_url = get_photo_url(att)
                    b64, _ = download_photo_b64(att)
                    recognized = recognize_photo(openai_key, photo_url, b64, caption=text)
                    photo_texts.append(recognized)
                    print(f"[PHOTO] recognized: {recognized[:200]}")
                except Exception as pe:
                    print(f"[PHOTO] error: {pe}\n{traceback.format_exc()}")

            if photo_texts:
                photo_result = "\n\n---\n".join(photo_texts)
                user_message = f"[ФОТО] Клиент прислал фото. Вот что на нём:\n{photo_result}"
                if text:
                    user_message += f"\n\nПодпись клиента: «{text}»"
            else:
                send_to_user(bot_token, user_id, "Не удалось прочитать фото, попробуйте ещё раз.")
                return ok()
        else:
            user_message = text

        save_message(conn, chat_key, "user", user_message)
        history = load_history(conn, chat_key, limit=20)

        system_content = SYSTEM_PROMPT.format(today=datetime.now().strftime("%d.%m.%Y"))
        messages = [{"role": "system", "content": system_content}] + history[:-1] + [{"role": "user", "content": user_message}]

        ai_reply = call_ai(openai_key, messages, model=ai_model)
        print(f"[AI] reply: {ai_reply[:300]}")

        json_str, clean_reply = extract_cmd(ai_reply)

        # Проверяем: была ли уже создана заявка в этом диалоге
        order_already_done = any(
            m["role"] == "system" and m["content"].startswith("ORDER_CREATED:")
            for m in history
        )

        # ── Контроль: если CMD не найден и заявка ещё не создавалась ──
        if not json_str and not order_already_done:
            check_messages = [{"role": "system", "content": system_content}] + history
            fields = check_all_fields_collected(openai_key, check_messages)
            if fields:
                print(f"[CONTROL] ИИ забыл создать заявку! Создаём принудительно: {fields}")
                json_str = json.dumps(fields, ensure_ascii=False)
                confirmation_keywords = ["заявка", "принят", "свяж", "мастер", "записал"]
                has_confirm = any(kw in ai_reply.lower() for kw in confirmation_keywords)
                if not has_confirm:
                    ai_reply = ai_reply + "\n\nЗаявка принята! Наш мастер свяжется с вами в ближайшее время."
                clean_reply = ai_reply

        if json_str:
            try:
                order_data = json.loads(json_str)
                order = create_order_in_db(conn, order_data)

                if order.get("duplicate"):
                    # Дубликат — просто отвечаем клиенту, не уведомляем владельца повторно
                    print(f"[ORDER] дубликат пропущен: {order['number']}")
                    confirm = clean_reply or "Заявка принята! Наш мастер свяжется с вами в ближайшее время."
                    save_message(conn, chat_key, "assistant", confirm)
                    send_to_user(bot_token, user_id, confirm)
                else:
                    print(f"[ORDER] создана заявка {order['number']} для {order['client']}")
                    # Сохраняем флаг в историю чата — защита от повторного создания
                    save_message(conn, chat_key, "system", f"ORDER_CREATED:{order['number']}:{order['comment'][:50]}")
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
"""
Бот Макс с ИИ для управления автосервисом.
Обрабатывает сообщения сотрудников через мессенджер Макс,
работает с БД через прямые запросы, формирует ответы через OpenAI.

Переменные окружения:
  DATABASE_URL      — строка подключения PostgreSQL (обязательно)
  MAX_BOT_TOKEN     — токен бота в мессенджере Макс (обязательно)
  OPENAI_API_KEY    — ключ OpenAI (обязательно)
  MAIN_DB_SCHEMA    — схема БД (по умолчанию "public")
"""

import json
import os
import traceback
import requests
from datetime import datetime
from openai import OpenAI

from database import (
    MAX_HISTORY,
    get_db_connection,
    load_history,
    save_message,
    fetch_db_context,
    get_cashboxes,
    get_expense_groups,
    get_employees_list,
    get_clients_list,
    get_bot_settings,
    t,
)
from max_api import send_to_user, register_webhook, unregister_webhook, get_webhook_info
from photo import recognize_photos, buffer_photo, get_buffered_photos, is_group_processed
from actions import process_ai_action
from prompt import SYSTEM_PROMPT

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}


def _resp(status, body):
    return {
        "statusCode": status,
        "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
        "body": json.dumps(body, default=str, ensure_ascii=False),
    }


def _ok():
    return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}


def _extract_cmd_json(text: str):
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


def _build_system_prompt(conn, bot_settings):
    db_context = fetch_db_context(conn)
    cashboxes = get_cashboxes(conn)
    expense_groups = get_expense_groups(conn)
    employees_list = get_employees_list(conn)
    clients_list = get_clients_list(conn)

    cashboxes_str = "\n".join([f"  id={c['id']} | {c['name']} ({c['type']}) | баланс: {c['balance']:,.0f}₽" for c in cashboxes])
    groups_str = "\n".join([f"  id={g['id']} | {g['name']}" for g in expense_groups])
    employees_str = "\n".join([f"  id={e['id']} | {e['name']} ({e['role']})" for e in employees_list]) or "  нет сотрудников"

    clients_parts = []
    for c in clients_list:
        line = f"  id={c['id']} | {c['name']} | тел:{c['phone']}"
        if c.get("cars"):
            cars_str = "; ".join([f"авто#{car['id']}: {car['info']}" for car in c["cars"]])
            line += f" | {cars_str}"
        clients_parts.append(line)
    clients_str = "\n".join(clients_parts) or "  нет клиентов"

    prompt_data = dict(
        today=datetime.now().strftime("%d.%m.%Y"),
        db_context=db_context,
        cashboxes=cashboxes_str,
        expense_groups=groups_str,
        employees=employees_str,
        clients_info=clients_str,
    )

    custom_prompt = bot_settings.get("system_prompt")
    language = bot_settings.get("language", "ru")
    lang_note = f"\n\nЯзык общения: {language}." if language and language != "ru" else ""

    if custom_prompt:
        db_block = SYSTEM_PROMPT.format(**prompt_data)
        return custom_prompt + "\n\n" + db_block + lang_note
    return SYSTEM_PROMPT.format(**prompt_data) + lang_note


def _call_ai(openai_key, model, messages):
    ai_client = OpenAI(api_key=openai_key, base_url="https://api.laozhang.ai/v1", timeout=25.0)
    response = ai_client.chat.completions.create(
        model=model,
        messages=messages,
        max_tokens=4000,
        temperature=0.4
    )
    return response.choices[0].message.content.strip()


def _handle_ai_reply(conn, ai_reply, bot_token, user_id):
    json_str, clean_reply = _extract_cmd_json(ai_reply)
    if json_str:
        print(f"[AI] action detected: {json_str}")
        try:
            action_data = json.loads(json_str)
            process_ai_action(conn, action_data, bot_token, user_id)
            reply_to_save = clean_reply or f"Выполнено: {action_data.get('action')}"
            save_message(conn, int(user_id), "assistant", reply_to_save)
        except (json.JSONDecodeError, Exception) as ex:
            print(f"[AI] action error: {ex}")
            if clean_reply:
                send_to_user(bot_token, user_id, clean_reply)
                save_message(conn, int(user_id), "assistant", clean_reply)
            else:
                send_to_user(bot_token, user_id, f"Ошибка выполнения команды: {ex}")
    else:
        send_to_user(bot_token, user_id, ai_reply)
        save_message(conn, int(user_id), "assistant", ai_reply)


def _process_photos(bot_token, openai_key, message, user_text):
    """Обработка фото-вложений из сообщения Макс. Возвращает (user_text, should_stop)."""
    body = message.get("body") or {}
    attachments = body.get("attachments") or []
    photo_attachments = [a for a in attachments if a.get("type") == "image"]

    if not photo_attachments:
        return user_text, False

    photo_urls = []
    for att in photo_attachments:
        url = (att.get("payload") or {}).get("url", "")
        if url:
            photo_urls.append(url)

    if not photo_urls:
        return user_text, False

    caption = user_text or ""
    send_to_user(bot_token, message.get("_user_id"), f"Анализирую {len(photo_urls)} фото...")
    recognized = recognize_photos(bot_token, openai_key, photo_urls, caption)
    print(f"[PHOTO] recognized: {recognized!r}")

    result = f"[ФОТО] Я отправил {'фотографию' if len(photo_urls) == 1 else f'{len(photo_urls)} фотографий'}. Вот что на {'ней' if len(photo_urls) == 1 else 'них'} распознано:\n{recognized}"
    if caption:
        result += f"\n\nМой комментарий к фото: {caption}"
        result += "\n\nОтветь на мой вопрос/просьбу из подписи, используя данные с фото. НЕ выполняй никаких CMD:: команд автоматически — только опиши информацию. Я сам скажу что делать дальше."
    else:
        result += "\n\nОпиши мне что ты видишь на фото. НЕ выполняй никаких действий и команд — просто расскажи что распознал. Я сам скажу что делать дальше."

    return result, False


def handler(event: dict, context) -> dict:
    """
    Вебхук бота Макс с ИИ для управления автосервисом.
    Принимает сообщения сотрудников, обрабатывает через OpenAI с контекстом из БД.
    """

    if event.get("httpMethod") == "OPTIONS":
        return _ok()

    bot_token = os.environ.get("MAX_BOT_TOKEN", "")
    openai_key = os.environ.get("OPENAI_API_KEY", "")

    # GET — статус / регистрация вебхука
    if event.get("httpMethod") == "GET":
        params = event.get("queryStringParameters") or {}

        if params.get("register") and params.get("url") and bot_token:
            result = register_webhook(bot_token, params["url"])
            return _resp(200, {"webhook_register": result})

        if params.get("unregister") and bot_token:
            result = unregister_webhook(bot_token)
            return _resp(200, {"webhook_unregister": result})

        db_ok = False
        db_error = ""
        history_count = 0
        try:
            conn = get_db_connection()
            cur = conn.cursor()
            cur.execute(f"SELECT COUNT(*) FROM {t('orders')}")
            cur.fetchone()
            cur.execute(f"SELECT COUNT(DISTINCT chat_id) FROM {t('bot_messages')}")
            history_count = cur.fetchone()[0] or 0
            cur.close()
            conn.close()
            db_ok = True
        except Exception as e:
            db_error = str(e)

        webhook_info = get_webhook_info(bot_token) if bot_token else {}

        return _resp(200, {
            "status": "ok",
            "token_set": bool(bot_token),
            "openai_set": bool(openai_key),
            "db_ok": db_ok,
            "db_error": db_error,
            "history_count": history_count,
            "webhook": webhook_info,
        })

    # DELETE — очистить историю диалогов
    if event.get("httpMethod") == "DELETE":
        raw = event.get("body", "{}")
        try:
            body_data = json.loads(raw) if isinstance(raw, str) else (raw or {})
        except Exception:
            body_data = {}

        if body_data.get("action") == "unsubscribe":
            if not bot_token:
                return _resp(400, {"error": "MAX_BOT_TOKEN not set"})
            result = unregister_webhook(bot_token)
            return _resp(200, {"ok": True, "result": result})

        try:
            conn = get_db_connection()
            with conn.cursor() as cur:
                cur.execute(f"DELETE FROM {t('bot_messages')}")
            conn.close()
            return _resp(200, {"ok": True, "cleared": True})
        except Exception as e:
            return _resp(500, {"error": str(e)})

    # POST
    raw = event.get("body", "{}")
    try:
        update = json.loads(raw) if isinstance(raw, str) else (raw or {})
    except Exception:
        update = {}

    # POST settings — сохранение настроек из UI
    if update.get("action") == "settings":
        try:
            conn = get_db_connection()
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
            return _resp(200, {"ok": True})
        except Exception as e:
            return _resp(500, {"error": str(e)})

    # POST unsubscribe
    if update.get("action") == "unsubscribe":
        if not bot_token:
            return _resp(400, {"error": "MAX_BOT_TOKEN not set"})
        result = unregister_webhook(bot_token)
        return _resp(200, {"ok": True, "result": result})

    if not bot_token or not openai_key:
        return _resp(500, {"error": "Missing MAX_BOT_TOKEN or OPENAI_API_KEY"})

    print(f"[MAX] update: {json.dumps(update)[:400]}")

    update_type = update.get("update_type", "")

    # bot_started — клиент открыл бота впервые
    if update_type == "bot_started":
        user_id = (update.get("user") or {}).get("user_id") or update.get("chat_id")
        if user_id:
            send_to_user(bot_token, user_id, "Привет! Я помощник в автосервисе. Чем могу помочь?")
        return _ok()

    if update_type != "message_created":
        return _ok()

    msg = update.get("message", {})

    # Дедупликация по message_id
    message_mid = (msg.get("body") or {}).get("mid", "")
    if message_mid:
        try:
            conn_dedup = get_db_connection()
            with conn_dedup.cursor() as cur:
                cur.execute(
                    f"""INSERT INTO {t('processed_messages')} (mid) VALUES (%s)
                        ON CONFLICT (mid) DO NOTHING RETURNING mid""",
                    (message_mid,)
                )
                inserted = cur.fetchone()
            conn_dedup.close()
            if not inserted:
                print(f"[DEDUP] mid={message_mid} уже обработан — пропускаем")
                return _ok()
        except Exception as e:
            print(f"[DEDUP] error: {e}")

    sender = msg.get("sender", {})
    user_id = sender.get("user_id")
    body = msg.get("body") or {}
    user_text = body.get("text", "").strip()

    # Прикладываем user_id к сообщению для photo handler
    msg["_user_id"] = user_id

    if not user_id:
        return _ok()

    # Обработка фото-вложений
    attachments = body.get("attachments") or []
    photo_attachments = [a for a in attachments if a.get("type") == "image"]

    if photo_attachments:
        try:
            user_text, _ = _process_photos(bot_token, openai_key, msg, user_text)
        except Exception as e:
            print(f"[PHOTO] error: {e}")
            send_to_user(bot_token, user_id, f"Не удалось распознать фото: {e}")
            return _ok()

    if not user_text:
        return _ok()

    conn = None
    try:
        conn = get_db_connection()
        bot_settings = get_bot_settings(conn)
        ai_model = bot_settings.get("ai_model", "deepseek-v3-20250324")

        raw_limit = bot_settings.get("history_limit", str(MAX_HISTORY))
        try:
            history_limit = int(raw_limit) if int(raw_limit) >= 0 else MAX_HISTORY
        except (ValueError, TypeError):
            history_limit = MAX_HISTORY

        chat_id = int(user_id)
        history = [] if history_limit == 0 else load_history(conn, chat_id, history_limit)
        save_message(conn, chat_id, "user", user_text)

        system_content = _build_system_prompt(conn, bot_settings)
        messages = [{"role": "system", "content": system_content}] + history + [{"role": "user", "content": user_text}]
        print(f"[AI] user_id={user_id}, text={user_text!r}, history={len(history)}, model={ai_model!r}")

        ai_reply = _call_ai(openai_key, ai_model, messages)
        print(f"[AI] reply={ai_reply!r}")

        _handle_ai_reply(conn, ai_reply, bot_token, user_id)

    except Exception as e:
        print(f"[AI] ERROR: {type(e).__name__}: {e}\n{traceback.format_exc()}")
        send_to_user(bot_token, user_id, f"Ошибка: {e}")
    finally:
        if conn:
            try:
                conn.close()
            except Exception:
                pass

    return _ok()

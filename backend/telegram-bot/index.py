"""
Telegram-бот с ИИ для управления автосервисом.
Обрабатывает сообщения пользователей, работает с БД через прямые запросы,
формирует ответы через OpenAI на основе реальных данных системы.
v7 — генерация изображений
"""

import io
import json
import os
import re
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
from telegram_api import send_message, send_start_menu, send_photo, TELEGRAM_API
from photo import recognize_photos, buffer_photo, get_buffered_photos, is_group_processed
from actions import process_ai_action
from prompt import SYSTEM_PROMPT
from excel import process_excel_document


BUTTON_MAP = {
    "📋 Заявки": "Покажи последние заявки с их статусами",
    "🔧 Заказ-наряды": "Покажи последние заказ-наряды с их статусами и суммами",
    "💰 Финансовый отчёт": "Сформируй финансовый отчёт за текущий месяц: доходы, расходы, прибыль",
    "➕ Создать заявку": "Хочу создать новую заявку",
    "📊 Сводка по кассам": "Покажи текущие остатки по всем кассам",
}

# chat_id -> состояние ожидания генерации изображения
_IMAGE_GEN_STATES: dict = {}


IMAGE_GENERATE_URL = "https://functions.poehali.dev/f53a0a82-6a63-4026-a009-135e8c39a22b"


def _handle_image_generation(bot_token: str, openai_key: str, chat_id: int, user_text: str, message: dict, headers: dict):
    """Обрабатывает режим генерации изображения через image-generate функцию."""
    photo = message.get("photo")
    document = message.get("document")

    cancel_words = {"/cancel", "отмена", "выход", "стоп", "назад"}
    if user_text.lower() in cancel_words or user_text in BUTTON_MAP or user_text in ("/start", "/menu"):
        _IMAGE_GEN_STATES.pop(chat_id, None)
        if user_text in ("/start", "/menu"):
            send_start_menu(bot_token, chat_id)
        elif user_text not in BUTTON_MAP:
            send_message(bot_token, chat_id, "Генерация отменена.")
        return user_text not in BUTTON_MAP

    photo_file_id = None
    if photo:
        photo_file_id = photo[-1]["file_id"]
    elif document and document.get("mime_type", "").startswith("image/"):
        photo_file_id = document["file_id"]

    prompt = user_text.strip()
    image_b64 = ""

    if photo_file_id:
        file_info = requests.get(
            f"{TELEGRAM_API}{bot_token}/getFile",
            params={"file_id": photo_file_id},
            timeout=10
        ).json()
        file_path = file_info["result"]["file_path"]
        file_url = f"https://api.telegram.org/file/bot{bot_token}/{file_path}"
        img_bytes = requests.get(file_url, timeout=30).content
        import base64 as b64mod
        image_b64 = b64mod.b64encode(img_bytes).decode()
        caption = message.get("caption", "").strip()
        if caption and not prompt:
            prompt = caption

    if not prompt and not image_b64:
        send_message(bot_token, chat_id,
            "Пришли текстовый промпт или фото (с подписью или без).\n\n"
            "Или отправь /cancel для отмены.")
        return True

    send_message(bot_token, chat_id, "🎨 Генерирую изображение, подожди 15–30 секунд...")

    payload = {"prompt": prompt, "size": "1024x1024"}
    if image_b64:
        payload["image_b64"] = image_b64

    resp = requests.post(IMAGE_GENERATE_URL, json=payload, timeout=120)
    data = resp.json()

    if not data.get("url"):
        send_message(bot_token, chat_id, f"⚠️ Ошибка генерации: {data.get('error', 'неизвестная ошибка')}")
        return True

    cdn_url = data["url"]
    final_prompt = data.get("prompt_used", "")
    caption_text = f"✅ Готово!\n\nПромпт: {final_prompt[:200]}" if final_prompt else "✅ Готово!"

    send_photo(bot_token, chat_id, cdn_url, caption=caption_text)
    send_message(bot_token, chat_id,
        f"🔗 {cdn_url}\n\n"
        "Хочешь ещё? Отправь новый промпт или фото.\n"
        "Для выхода — /cancel")

    return True


def _ok_response(headers):
    return {"statusCode": 200, "headers": headers, "body": json.dumps({"ok": True})}


def _handle_health_check(bot_token, openai_key, headers):
    db_ok = False
    db_error = ""
    try:
        conn_test = get_db_connection()
        cur = conn_test.cursor()
        cur.execute(f"SELECT COUNT(*) FROM {t('orders')}")
        cur.fetchone()
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


def _transcribe_voice(bot_token, openai_key, message) -> str:
    voice = message.get("voice") or message.get("audio")
    if not voice:
        return ""
    file_id = voice.get("file_id")
    print(f"[VOICE] file_id={file_id!r}")

    file_info = requests.get(
        f"{TELEGRAM_API}{bot_token}/getFile",
        params={"file_id": file_id},
        timeout=10
    ).json()
    file_path = file_info["result"]["file_path"]
    file_url = f"https://api.telegram.org/file/bot{bot_token}/{file_path}"
    audio_bytes = requests.get(file_url, timeout=30).content
    print(f"[VOICE] downloaded {len(audio_bytes)} bytes")

    ai_client = OpenAI(api_key=openai_key, base_url="https://api.laozhang.ai/v1")
    transcript = ai_client.audio.transcriptions.create(
        model="whisper-1",
        file=("voice.ogg", io.BytesIO(audio_bytes), "audio/ogg"),
    )
    return transcript.text.strip()


def _process_photos(bot_token, openai_key, message, user_text, headers):
    photo = message.get("photo")
    document = message.get("document")
    photo_file_id = None
    if photo:
        photo_file_id = photo[-1]["file_id"]
    elif document and document.get("mime_type", "").startswith("image/"):
        photo_file_id = document["file_id"]

    if not photo_file_id:
        return user_text, None

    media_group_id = message.get("media_group_id")
    caption = message.get("caption", "").strip()

    if media_group_id:
        buf_conn = get_db_connection()
        if is_group_processed(buf_conn, media_group_id):
            buf_conn.close()
            return None, _ok_response(headers)
        buffer_photo(buf_conn, message["chat"]["id"], media_group_id, photo_file_id, caption)
        photos = get_buffered_photos(buf_conn, media_group_id)
        buf_conn.close()
        if not photos:
            return None, _ok_response(headers)
        file_ids = [p[0] for p in photos]
        album_caption = next((p[1] for p in photos if p[1]), "")
        print(f"[PHOTO] album {media_group_id}: {len(file_ids)} photos")
        send_message(bot_token, message["chat"]["id"], f"📷 Анализирую {len(file_ids)} фото...")
        recognized = recognize_photos(bot_token, openai_key, file_ids, album_caption)
        print(f"[PHOTO] album recognized: {recognized!r}")
        result = f"[ФОТО] Я отправил {len(file_ids)} фотографий. Вот что на них распознано:\n{recognized}"
        if album_caption:
            result += f"\n\nМой комментарий к фото: {album_caption}"
        result += "\n\nОпиши мне что ты видишь на фото. НЕ выполняй никаких действий и команд — просто расскажи что распознал. Я сам скажу что делать дальше."
        return result, None

    if not user_text:
        send_message(bot_token, message["chat"]["id"], "📷 Анализирую фото...")
        recognized = recognize_photos(bot_token, openai_key, [photo_file_id], caption)
        print(f"[PHOTO] recognized: {recognized!r}")
        result = f"[ФОТО] Я отправил фотографию. Вот что на ней распознано:\n{recognized}"
        if caption:
            result += f"\n\nМой комментарий к фото: {caption}"
        result += "\n\nОпиши мне что ты видишь на фото. НЕ выполняй никаких действий и команд — просто расскажи что распознал. Я сам скажу что делать дальше."
        return result, None

    combined_caption = caption or user_text
    send_message(bot_token, message["chat"]["id"], "📷 Анализирую фото...")
    recognized = recognize_photos(bot_token, openai_key, [photo_file_id], combined_caption)
    print(f"[PHOTO] recognized: {recognized!r}")
    result = f"[ФОТО] Я отправил фотографию с подписью: «{combined_caption}». Вот что на ней распознано:\n{recognized}\n\nОтветь на мой вопрос/просьбу из подписи, используя данные с фото. НЕ выполняй никаких CMD:: команд автоматически — только опиши информацию. Я сам скажу что делать дальше."
    return result, None


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
    ai_client = OpenAI(api_key=openai_key, base_url="https://api.laozhang.ai/v1")
    response = ai_client.chat.completions.create(
        model=model,
        messages=messages,
        max_tokens=4000,
        temperature=0.4
    )
    return response.choices[0].message.content.strip()


def _extract_cmd_json(text: str):
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


def _handle_ai_reply(conn, ai_reply, bot_token, chat_id):
    json_str, clean_reply = _extract_cmd_json(ai_reply)
    if json_str:
        print(f"[AI] action detected: {json_str}")
        try:
            action_data = json.loads(json_str)
            process_ai_action(conn, action_data, bot_token, chat_id)
            reply_to_save = clean_reply or f"✅ Выполнено: {action_data.get('action')}"
            save_message(conn, chat_id, "assistant", reply_to_save)
        except (json.JSONDecodeError, Exception) as ex:
            print(f"[AI] action error: {ex}")
            if clean_reply:
                send_message(bot_token, chat_id, clean_reply, parse_mode="")
                save_message(conn, chat_id, "assistant", clean_reply)
            else:
                send_message(bot_token, chat_id, f"⚠️ Ошибка выполнения команды: {ex}", parse_mode="")
    else:
        send_message(bot_token, chat_id, ai_reply, parse_mode="")
        save_message(conn, chat_id, "assistant", ai_reply)


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
        return _handle_health_check(bot_token, openai_key, headers)

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
        return _ok_response(headers)

    chat_id = message["chat"]["id"]
    user_text = message.get("text", "").strip()

    voice = message.get("voice") or message.get("audio")
    if voice and not user_text:
        try:
            user_text = _transcribe_voice(bot_token, openai_key, message)
            if not user_text:
                send_message(bot_token, chat_id, "🎙 Не удалось разобрать голосовое сообщение, попробуйте ещё раз.")
                return _ok_response(headers)
            send_message(bot_token, chat_id, f"🎙 Распознано: {user_text}")
        except Exception as e:
            print(f"[VOICE] error: {e}")
            send_message(bot_token, chat_id, f"⚠️ Не удалось обработать голосовое сообщение: {e}")
            return _ok_response(headers)

    try:
        user_text, early_return = _process_photos(bot_token, openai_key, message, user_text, headers)
        if early_return:
            return early_return
    except Exception as e:
        print(f"[PHOTO] error: {e}")
        send_message(bot_token, chat_id, f"⚠️ Не удалось распознать фото: {e}")
        return _ok_response(headers)

    # Обработка Excel-файлов (.xlsx)
    try:
        excel_text = process_excel_document(bot_token, message)
        if excel_text:
            filename = message.get("document", {}).get("file_name", "файл.xlsx")
            caption = message.get("caption", "").strip()
            send_message(bot_token, chat_id, f"📊 Читаю таблицу «{filename}»...")
            print(f"[EXCEL] parsed {len(excel_text)} chars from {filename}")
            if caption:
                user_text = f"[EXCEL] Я прислал таблицу «{filename}». Вот её содержимое:\n\n{excel_text}\n\nМой вопрос/просьба: {caption}"
            else:
                user_text = f"[EXCEL] Я прислал таблицу «{filename}». Вот её содержимое:\n\n{excel_text}\n\nПроанализируй данные и расскажи что в них содержится. Если я ничего не уточнил — просто опиши структуру и ключевые данные из таблицы."
    except Exception as e:
        print(f"[EXCEL] error: {e}")
        send_message(bot_token, chat_id, f"⚠️ Не удалось прочитать Excel-файл: {e}")
        return _ok_response(headers)

    if not user_text and not message.get("photo") and not message.get("document"):
        return _ok_response(headers)

    if user_text in ("/start", "/menu"):
        _IMAGE_GEN_STATES.pop(chat_id, None)
        send_start_menu(bot_token, chat_id)
        return _ok_response(headers)

    # Кнопка "Генерация" — входим в режим
    if user_text == "🎨 Генерация":
        _IMAGE_GEN_STATES[chat_id] = True
        send_message(bot_token, chat_id,
            "🎨 Режим генерации изображений\n\n"
            "Отправь мне:\n"
            "• Текстовый промпт — и я создам изображение\n"
            "• Фото — и я создам изображение в этом стиле\n"
            "• Фото с подписью — и я учту твой запрос\n\n"
            "Примеры:\n"
            "— «Логотип автосервиса с синими цветами»\n"
            "— «Рекламный баннер с акцией 20% скидка»\n\n"
            "Для выхода — /cancel"
        )
        return _ok_response(headers)

    # Если в режиме генерации — обрабатываем
    if chat_id in _IMAGE_GEN_STATES:
        try:
            handled = _handle_image_generation(bot_token, openai_key, chat_id, user_text, message, headers)
            if handled and user_text.lower() not in BUTTON_MAP:
                return _ok_response(headers)
        except Exception as e:
            print(f"[IMG-BOT] error: {e}")
            send_message(bot_token, chat_id, f"⚠️ Ошибка генерации: {e}")
            return _ok_response(headers)

    if not user_text:
        return _ok_response(headers)

    if user_text in BUTTON_MAP:
        user_text = BUTTON_MAP[user_text]

    print(f"[DB] SCHEMA={os.environ.get('MAIN_DB_SCHEMA', 'public')!r}")
    conn = None
    try:
        conn = get_db_connection()
        bot_settings = get_bot_settings(conn)
        system_content = _build_system_prompt(conn, bot_settings)
        ai_model = bot_settings.get("ai_model", "deepseek-v3-20250324")

        raw_limit = bot_settings.get("history_limit", str(MAX_HISTORY))
        try:
            history_limit = int(raw_limit) if int(raw_limit) >= 0 else MAX_HISTORY
        except (ValueError, TypeError):
            history_limit = MAX_HISTORY

        history = [] if history_limit == 0 else load_history(conn, chat_id, history_limit)
        save_message(conn, chat_id, "user", user_text)

        messages = [{"role": "system", "content": system_content}] + history + [{"role": "user", "content": user_text}]
        print(f"[AI] user_text={user_text!r}, history={len(history)} msgs, model={ai_model!r}")

        ai_reply = _call_ai(openai_key, ai_model, messages)
        print(f"[AI] reply={ai_reply!r}")

        _handle_ai_reply(conn, ai_reply, bot_token, chat_id)

    except Exception as e:
        print(f"[AI] ERROR: {type(e).__name__}: {e}\n{traceback.format_exc()}")
        send_message(bot_token, chat_id, f"⚠️ Ошибка: {e}")
    finally:
        if conn:
            try:
                conn.close()
            except Exception:
                pass

    return _ok_response(headers)
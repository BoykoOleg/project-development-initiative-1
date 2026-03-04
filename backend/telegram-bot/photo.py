import base64
import time
import requests
from openai import OpenAI
from database import t

TELEGRAM_API = "https://api.telegram.org/bot"


def download_photo_b64(bot_token: str, file_id: str) -> tuple:
    file_info = requests.get(
        f"{TELEGRAM_API}{bot_token}/getFile",
        params={"file_id": file_id},
        timeout=10
    ).json()
    file_path = file_info["result"]["file_path"]
    file_url = f"https://api.telegram.org/file/bot{bot_token}/{file_path}"
    photo_bytes = requests.get(file_url, timeout=30).content
    b64 = base64.b64encode(photo_bytes).decode("utf-8")
    ext = file_path.rsplit(".", 1)[-1].lower() if "." in file_path else "jpg"
    mime = {"jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png"}.get(ext, "image/jpeg")
    return b64, mime


def recognize_photos(bot_token: str, openai_key: str, file_ids: list, caption: str = "") -> str:
    count = len(file_ids)
    vision_prompt = (
        f"Внимательно рассмотри {'фотографию' if count == 1 else f'все {count} фотографий'} и извлеки ВСЮ текстовую информацию.\n"
        "Если это документ — перечисли все поля и значения.\n"
        "Если это автомобиль — укажи марку, модель, цвет, госномер (если видны).\n"
        "Если есть ФИО, даты, номера телефонов, VIN, адреса — укажи всё.\n"
        "Если это фото запчасти — укажи название, артикул, маркировку.\n"
    )
    if count > 1:
        vision_prompt += "Если фото связаны (например, две стороны документа) — объедини данные в единый результат.\n"
    vision_prompt += "Ответь кратко, структурированно, без лишних слов. Только факты с фото."
    if caption:
        vision_prompt += f"\n\nПользователь приложил подпись к фото: «{caption}»"

    content_parts = [{"type": "text", "text": vision_prompt}]
    for fid in file_ids:
        try:
            b64, mime = download_photo_b64(bot_token, fid)
            content_parts.append({
                "type": "image_url",
                "image_url": {"url": f"data:{mime};base64,{b64}", "detail": "high"}
            })
        except Exception as e:
            print(f"[PHOTO] download error for {fid}: {e}")

    if len(content_parts) < 2:
        return "Не удалось загрузить ни одно фото."

    ai_client = OpenAI(api_key=openai_key, base_url="https://api.laozhang.ai/v1")
    resp = ai_client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": content_parts}],
        max_tokens=1500,
        temperature=0.2
    )
    return resp.choices[0].message.content.strip()


def buffer_photo(conn, chat_id: int, media_group_id: str, file_id: str, caption: str = ""):
    cur = conn.cursor()
    cur.execute(f"""
        INSERT INTO {t('photo_buffer')} (chat_id, media_group_id, file_id, caption)
        VALUES (%s, %s, %s, %s)
    """, (chat_id, media_group_id, file_id, caption))
    cur.close()


def get_buffered_photos(conn, media_group_id: str) -> list:
    time.sleep(2)
    cur = conn.cursor()
    cur.execute(f"""
        SELECT file_id, caption FROM {t('photo_buffer')}
        WHERE media_group_id = %s AND processed = FALSE
        ORDER BY created_at ASC
    """, (media_group_id,))
    rows = cur.fetchall()
    cur.execute(f"""
        UPDATE {t('photo_buffer')} SET processed = TRUE
        WHERE media_group_id = %s
    """, (media_group_id,))
    cur.close()
    return rows


def is_group_processed(conn, media_group_id: str) -> bool:
    cur = conn.cursor()
    cur.execute(f"""
        SELECT COUNT(*) FROM {t('photo_buffer')}
        WHERE media_group_id = %s AND processed = TRUE
    """, (media_group_id,))
    count = cur.fetchone()[0]
    cur.close()
    return count > 0

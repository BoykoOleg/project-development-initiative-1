import base64
import io
import time
import requests
from openai import OpenAI
from database import t

MAX_API = "https://platform-api.max.ru"


def download_photo_b64(token: str, photo_url: str) -> tuple:
    """Скачать фото по URL из мессенджера Макс и вернуть base64 + mime."""
    try:
        from PIL import Image
        has_pil = True
    except ImportError:
        has_pil = False

    r = requests.get(photo_url, timeout=20, allow_redirects=True)
    r.raise_for_status()
    photo_bytes = r.content
    print(f"[PHOTO] downloaded {len(photo_bytes)} bytes")

    if has_pil:
        img = Image.open(io.BytesIO(photo_bytes)).convert("RGB")
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=90)
        photo_bytes = buf.getvalue()

    b64 = base64.b64encode(photo_bytes).decode("utf-8")
    return b64, "image/jpeg"


def recognize_photos(token: str, openai_key: str, photo_urls: list, caption: str = "") -> str:
    """Распознать одно или несколько фото через GPT-4o Vision."""
    count = len(photo_urls)
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

    for url in photo_urls:
        # Сначала пробуем по прямому URL
        try:
            content_parts.append({
                "type": "image_url",
                "image_url": {"url": url, "detail": "high"}
            })
        except Exception as e:
            print(f"[PHOTO] skipping url {url}: {e}")

    if len(content_parts) < 2:
        # Fallback: скачиваем и отправляем base64
        for url in photo_urls:
            try:
                b64, mime = download_photo_b64(token, url)
                content_parts.append({
                    "type": "image_url",
                    "image_url": {"url": f"data:{mime};base64,{b64}", "detail": "high"}
                })
            except Exception as e:
                print(f"[PHOTO] download error for {url}: {e}")

    if len(content_parts) < 2:
        return "Не удалось загрузить ни одно фото."

    ai_client = OpenAI(api_key=openai_key, base_url="https://api.laozhang.ai/v1", timeout=30.0)

    # Сначала пробуем по URL
    try:
        resp = ai_client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": content_parts}],
            max_tokens=1500,
            temperature=0.2
        )
        return resp.choices[0].message.content.strip()
    except Exception as e:
        print(f"[PHOTO] URL vision failed: {e}, trying base64...")

    # Fallback: пересобираем с base64
    b64_parts = [{"type": "text", "text": vision_prompt}]
    for url in photo_urls:
        try:
            b64, mime = download_photo_b64(token, url)
            b64_parts.append({
                "type": "image_url",
                "image_url": {"url": f"data:{mime};base64,{b64}", "detail": "high"}
            })
        except Exception as e:
            print(f"[PHOTO] b64 download error: {e}")

    if len(b64_parts) < 2:
        return "Не удалось загрузить ни одно фото."

    resp = ai_client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": b64_parts}],
        max_tokens=1500,
        temperature=0.2
    )
    return resp.choices[0].message.content.strip()


def buffer_photo(conn, chat_id: int, media_group_id: str, photo_url: str, caption: str = ""):
    """Сохранить фото в буфер для групповой обработки."""
    cur = conn.cursor()
    cur.execute(f"""
        INSERT INTO {t('photo_buffer')} (chat_id, media_group_id, file_id, caption, source, processed)
        VALUES (%s, %s, %s, %s, 'max', false)
    """, (chat_id, media_group_id, photo_url[:512], caption))
    cur.close()


def get_buffered_photos(conn, media_group_id: str) -> list:
    """Получить и пометить как обработанные все фото группы."""
    time.sleep(2)
    cur = conn.cursor()
    cur.execute(f"""
        SELECT file_id, caption FROM {t('photo_buffer')}
        WHERE media_group_id = %s AND source = 'max' AND processed = FALSE
        ORDER BY created_at ASC
    """, (media_group_id,))
    rows = cur.fetchall()
    cur.execute(f"""
        UPDATE {t('photo_buffer')} SET processed = TRUE
        WHERE media_group_id = %s AND source = 'max'
    """, (media_group_id,))
    cur.close()
    return rows


def is_group_processed(conn, media_group_id: str) -> bool:
    cur = conn.cursor()
    cur.execute(f"""
        SELECT COUNT(*) FROM {t('photo_buffer')}
        WHERE media_group_id = %s AND source = 'max' AND processed = TRUE
    """, (media_group_id,))
    count = cur.fetchone()[0]
    cur.close()
    return count > 0

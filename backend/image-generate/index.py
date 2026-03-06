"""
Генерация изображений (логотипы, рекламные баннеры) через DALL-E 3.
Принимает текстовый промпт и/или base64-фото для анализа и улучшения промпта.
Возвращает URL готового изображения, загруженного в S3.
"""

import base64
import json
import os
import uuid
import requests
from openai import OpenAI


HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
}


def _get_client() -> OpenAI:
    return OpenAI(
        api_key=os.environ["OPENAI_API_KEY"],
        base_url="https://api.laozhang.ai/v1",
    )


def _analyze_photo_and_build_prompt(client: OpenAI, image_b64: str, user_prompt: str) -> str:
    """Анализирует фото и строит улучшенный промпт для генерации."""
    analysis_messages = [
        {
            "role": "user",
            "content": [
                {
                    "type": "image_url",
                    "image_url": {"url": f"data:image/jpeg;base64,{image_b64}"},
                },
                {
                    "type": "text",
                    "text": (
                        f"Пользователь хочет создать изображение: {user_prompt}\n\n"
                        "На основе этого фото и запроса пользователя составь подробный промпт на английском языке "
                        "для генерации изображения через DALL-E 3. "
                        "Учти стиль, цвета, элементы с фото. "
                        "Верни ТОЛЬКО промпт, без объяснений."
                    ),
                },
            ],
        }
    ]
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=analysis_messages,
        max_tokens=500,
    )
    return response.choices[0].message.content.strip()


def _translate_prompt(client: OpenAI, prompt: str) -> str:
    """Переводит и улучшает промпт на английский для DALL-E."""
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "user",
                "content": (
                    f"Переведи и улучши этот промпт на английский язык для генерации изображения в DALL-E 3. "
                    f"Сделай его более детальным и профессиональным. "
                    f"Верни ТОЛЬКО промпт, без пояснений.\n\nПромпт: {prompt}"
                ),
            }
        ],
        max_tokens=300,
    )
    return response.choices[0].message.content.strip()


def _generate_image(client: OpenAI, prompt: str, size: str = "1024x1024", model: str = "dall-e-3") -> str:
    """Генерирует изображение и возвращает URL."""
    response = client.images.generate(
        model=model,
        prompt=prompt,
        n=1,
        size=size,
        quality="standard",
    )
    return response.data[0].url


def _upload_to_s3(image_url: str) -> str:
    """Скачивает изображение и загружает в S3, возвращает CDN URL."""
    import boto3

    img_bytes = requests.get(image_url, timeout=30).content
    key = f"generated/{uuid.uuid4().hex}.png"

    s3 = boto3.client(
        "s3",
        endpoint_url="https://bucket.poehali.dev",
        aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"],
    )
    s3.put_object(Bucket="files", Key=key, Body=img_bytes, ContentType="image/png")

    project_id = os.environ["AWS_ACCESS_KEY_ID"]
    return f"https://cdn.poehali.dev/projects/{project_id}/bucket/{key}"


def handler(event: dict, context) -> dict:
    """
    Генерация изображений для логотипов и рекламных материалов.
    POST: { prompt, image_b64?, size? }
    GET: health-check
    """
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": HEADERS, "body": ""}

    if event.get("httpMethod") == "GET":
        return {
            "statusCode": 200,
            "headers": HEADERS,
            "body": json.dumps({"ok": True, "service": "image-generate"}),
        }

    body_raw = event.get("body", "{}")
    try:
        body = json.loads(body_raw) if isinstance(body_raw, str) else body_raw
    except (json.JSONDecodeError, TypeError):
        body = {}

    user_prompt = (body.get("prompt") or "").strip()
    image_b64 = (body.get("image_b64") or "").strip()
    size = body.get("size", "1024x1024")
    model = (body.get("model") or "dall-e-3").strip() or "dall-e-3"

    if size not in ("1024x1024", "1792x1024", "1024x1792"):
        size = "1024x1024"

    if not user_prompt and not image_b64:
        return {
            "statusCode": 400,
            "headers": HEADERS,
            "body": json.dumps({"error": "Укажите промпт или загрузите фото"}),
        }

    client = _get_client()

    if image_b64:
        print(f"[IMG] analyzing photo, user_prompt={user_prompt!r}")
        final_prompt = _analyze_photo_and_build_prompt(client, image_b64, user_prompt or "логотип в этом стиле")
        print(f"[IMG] prompt from photo: {final_prompt!r}")
    else:
        print(f"[IMG] translating prompt: {user_prompt!r}")
        final_prompt = _translate_prompt(client, user_prompt)
        print(f"[IMG] translated prompt: {final_prompt!r}")

    print(f"[IMG] generating image size={size} model={model}")
    dall_e_url = _generate_image(client, final_prompt, size, model)

    print(f"[IMG] uploading to S3")
    cdn_url = _upload_to_s3(dall_e_url)
    print(f"[IMG] done: {cdn_url}")

    return {
        "statusCode": 200,
        "headers": HEADERS,
        "body": json.dumps({
            "url": cdn_url,
            "prompt_used": final_prompt,
        }),
    }
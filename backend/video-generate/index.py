import json
import os
import time
import urllib.request
import boto3
from openai import OpenAI


CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}

# sora — через laozhang с отдельным ключом LAOZHANG_SORA_KEY
# kling/hailuo — через laozhang с обычным OPENAI_API_KEY
VIDEO_MODELS = {
    "sora-2": {
        "label": "Sora 2",
        "provider": "sora",
        "model": "sora-2",
        "durations": [5, 10, 20],
        "sizes": {"16:9": "1280x720", "9:16": "720x1280", "1:1": "1080x1080"},
    },
    "sora-1": {
        "label": "Sora 1",
        "provider": "sora",
        "model": "sora-1",
        "durations": [5, 10, 20],
        "sizes": {"16:9": "1280x720", "9:16": "720x1280", "1:1": "1080x1080"},
    },
    "kling-v2-master": {
        "label": "Kling v2 Master",
        "provider": "kling",
        "model": "kling-video/v2/master/text-to-video",
        "durations": [5, 10],
        "sizes": {"16:9": "16:9", "9:16": "9:16", "1:1": "1:1"},
    },
    "kling-v1.5-pro": {
        "label": "Kling v1.5 Pro",
        "provider": "kling",
        "model": "kling-video/v1.5/pro/text-to-video",
        "durations": [5, 10],
        "sizes": {"16:9": "16:9", "9:16": "9:16", "1:1": "1:1"},
    },
    "kling-v1-standard": {
        "label": "Kling v1 Standard",
        "provider": "kling",
        "model": "kling-video/v1/standard/text-to-video",
        "durations": [5, 10],
        "sizes": {"16:9": "16:9", "9:16": "9:16", "1:1": "1:1"},
    },
    "hailuo-01": {
        "label": "Hailuo (MiniMax) 01",
        "provider": "kling",
        "model": "video-01",
        "durations": [6],
        "sizes": {"16:9": "16:9", "9:16": "9:16", "1:1": "1:1"},
    },
}

AIML_BASE_URL = "https://api.aimlapi.com/v2"


def handler(event: dict, context) -> dict:
    """Генерация видео через Sora 2 или Kling AI по промпту. Сохраняет результат в S3."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    if event.get("httpMethod") == "GET":
        return {
            "statusCode": 200,
            "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
            "body": json.dumps({"status": "ok", "service": "video-generate", "models": list(VIDEO_MODELS.keys())}),
        }

    try:
        body = json.loads(event.get("body") or "{}")
    except (json.JSONDecodeError, TypeError):
        body = {}

    user_prompt = (body.get("prompt") or "").strip()
    model_key = body.get("model", "sora-2")
    aspect_ratio = body.get("aspect_ratio", "16:9")
    duration = int(body.get("duration", 5))

    if model_key not in VIDEO_MODELS:
        model_key = "sora-2"

    cfg = VIDEO_MODELS[model_key]

    if aspect_ratio not in cfg["sizes"]:
        aspect_ratio = "16:9"
    if duration not in cfg["durations"]:
        duration = cfg["durations"][0]

    if not user_prompt:
        return {
            "statusCode": 400,
            "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
            "body": json.dumps({"error": "Нужен промпт для генерации видео"}),
        }

    translate_client = OpenAI(
        api_key=os.environ["OPENAI_API_KEY"],
        base_url="https://api.laozhang.ai/v1",
    )

    final_prompt = user_prompt
    if not _is_english(user_prompt):
        final_prompt = _translate_prompt(translate_client, user_prompt)
        print(f"[VID] translated: {final_prompt!r}")

    print(f"[VID] model={model_key} provider={cfg['provider']} aspect={aspect_ratio} duration={duration}s")

    if cfg["provider"] == "sora":
        cdn_url = _generate_sora(cfg, final_prompt, aspect_ratio, duration)
    else:
        cdn_url = _generate_kling(cfg, final_prompt, aspect_ratio, duration)

    print(f"[VID] saved to S3: {cdn_url}")

    return {
        "statusCode": 200,
        "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
        "body": json.dumps({
            "url": cdn_url,
            "prompt_used": final_prompt,
            "model": cfg["label"],
            "aspect_ratio": aspect_ratio,
            "duration": duration,
        }),
    }


def _is_english(text: str) -> bool:
    latin = sum(1 for c in text if c.isalpha() and ord(c) < 128)
    total = sum(1 for c in text if c.isalpha())
    return total > 0 and latin / total > 0.8


def _translate_prompt(client: OpenAI, prompt: str) -> str:
    resp = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "Translate the following video generation prompt to English. Return ONLY the translated text, no explanations."},
            {"role": "user", "content": prompt},
        ],
        max_tokens=500,
        temperature=0.3,
    )
    return resp.choices[0].message.content.strip()


def _generate_sora(cfg: dict, prompt: str, aspect_ratio: str, duration: int) -> str:
    client = OpenAI(
        api_key=os.environ["LAOZHANG_SORA_KEY"],
        base_url="https://api.laozhang.ai/v1",
    )

    response = client.chat.completions.create(
        model="sora_video2",
        messages=[{
            "role": "user",
            "content": [{"type": "text", "text": prompt}],
        }],
        timeout=300,
    )

    video_url = response.choices[0].message.content
    print(f"[VID] sora video_url: {video_url[:80]}")

    if not video_url or not video_url.startswith("http"):
        raise RuntimeError(f"Sora returned unexpected content: {video_url}")

    return _save_to_s3(video_url)


def _generate_kling(cfg: dict, prompt: str, aspect_ratio: str, duration: int) -> str:
    api_key = os.environ.get("AIML_API_KEY", "")
    size = cfg["sizes"][aspect_ratio]

    data = {
        "model": cfg["model"],
        "prompt": prompt,
        "ratio": size,
        "duration": str(duration),
    }
    result = _aiml_request(api_key, "POST", "/generate/video", data)
    print(f"[VID] kling create: {json.dumps(result)[:200]}")
    generation_id = result["id"]

    for attempt in range(120):
        time.sleep(5)
        result = _aiml_request(api_key, "GET", f"/generate/video?generation_id={generation_id}&model={cfg['model']}")
        status = result.get("status", "")
        print(f"[VID] kling poll #{attempt} status={status}")
        if status == "completed":
            return _save_to_s3(result["video"]["url"])
        if status in ("failed", "error"):
            raise RuntimeError(f"Kling failed: {result.get('error', 'unknown')}")

    raise RuntimeError("Kling generation timeout")


def _aiml_request(api_key: str, method: str, path: str, data: dict | None = None) -> dict:
    url = f"{AIML_BASE_URL}{path}"
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode())


def _save_to_s3(video_url: str) -> str:
    with urllib.request.urlopen(video_url, timeout=60) as resp:
        video_bytes = resp.read()

    s3 = boto3.client(
        "s3",
        endpoint_url="https://bucket.poehali.dev",
        aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"],
    )

    key = f"ai-videos/{int(time.time())}.mp4"
    s3.put_object(Bucket="files", Key=key, Body=video_bytes, ContentType="video/mp4")

    project_id = os.environ["AWS_ACCESS_KEY_ID"]
    return f"https://cdn.poehali.dev/projects/{project_id}/bucket/{key}"
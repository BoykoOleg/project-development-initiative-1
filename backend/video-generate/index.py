import json
import os
import base64
import time
import urllib.request
import urllib.error
import boto3
from openai import OpenAI


CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}

VIDEO_MODELS = {
    "kling-v1-standard": {
        "model": "kling-video/v1/standard/text-to-video",
        "label": "Kling v1 Standard",
        "durations": [5, 10],
        "aspect_ratios": ["16:9", "9:16", "1:1"],
    },
    "kling-v1-pro": {
        "model": "kling-video/v1/pro/text-to-video",
        "label": "Kling v1 Pro",
        "durations": [5, 10],
        "aspect_ratios": ["16:9", "9:16", "1:1"],
    },
    "kling-v1.5-pro": {
        "model": "kling-video/v1.5/pro/text-to-video",
        "label": "Kling v1.5 Pro",
        "durations": [5, 10],
        "aspect_ratios": ["16:9", "9:16", "1:1"],
    },
    "kling-v2-master": {
        "model": "kling-video/v2/master/text-to-video",
        "label": "Kling v2 Master",
        "durations": [5, 10],
        "aspect_ratios": ["16:9", "9:16", "1:1"],
    },
    "hailuo-01": {
        "model": "video-01",
        "label": "Hailuo (MiniMax) 01",
        "durations": [6],
        "aspect_ratios": ["16:9", "9:16", "1:1"],
    },
    "hailuo-01-live": {
        "model": "video-01-live",
        "label": "Hailuo 01 Live",
        "durations": [6],
        "aspect_ratios": ["16:9", "9:16", "1:1"],
    },
}

AIML_BASE_URL = "https://api.aimlapi.com/v2"


def handler(event: dict, context) -> dict:
    """Генерация видео через AIML API (Kling AI, Hailuo) по промпту. Сохраняет результат в S3."""
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
    model_key = body.get("model", "kling-v1-standard")
    aspect_ratio = body.get("aspect_ratio", "16:9")
    duration = int(body.get("duration", 5))

    if model_key not in VIDEO_MODELS:
        model_key = "kling-v1-standard"

    model_cfg = VIDEO_MODELS[model_key]

    if aspect_ratio not in model_cfg["aspect_ratios"]:
        aspect_ratio = "16:9"
    if duration not in model_cfg["durations"]:
        duration = model_cfg["durations"][0]

    if not user_prompt:
        return {
            "statusCode": 400,
            "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
            "body": json.dumps({"error": "Нужен промпт для генерации видео"}),
        }

    openai_client = OpenAI(
        api_key=os.environ["OPENAI_API_KEY"],
        base_url="https://api.laozhang.ai/v1",
    )

    final_prompt = user_prompt
    if not _is_english(user_prompt):
        final_prompt = _translate_prompt(openai_client, user_prompt)
        print(f"[VID] translated: {final_prompt!r}")

    print(f"[VID] model={model_key} aspect={aspect_ratio} duration={duration}s")

    api_key = os.environ["AIML_API_KEY"]
    generation_id = _create_generation(api_key, model_cfg["model"], final_prompt, aspect_ratio, duration)
    print(f"[VID] generation_id={generation_id}")

    video_url = _poll_generation(api_key, model_cfg["model"], generation_id)
    print(f"[VID] got video url: {video_url[:60]}...")

    cdn_url = _save_to_s3(video_url)
    print(f"[VID] saved to S3: {cdn_url}")

    return {
        "statusCode": 200,
        "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
        "body": json.dumps({
            "url": cdn_url,
            "prompt_used": final_prompt,
            "model": model_cfg["label"],
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


def _api_request(api_key: str, method: str, path: str, data: dict | None = None) -> dict:
    url = f"{AIML_BASE_URL}{path}"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode())


def _create_generation(api_key: str, model: str, prompt: str, aspect_ratio: str, duration: int) -> str:
    data = {
        "model": model,
        "prompt": prompt,
        "ratio": aspect_ratio,
        "duration": str(duration),
    }
    result = _api_request(api_key, "POST", "/generate/video", data)
    print(f"[VID] create response: {json.dumps(result)[:200]}")
    return result["id"]


def _poll_generation(api_key: str, model: str, generation_id: str) -> str:
    for attempt in range(120):
        time.sleep(5)
        result = _api_request(api_key, "GET", f"/generate/video?generation_id={generation_id}&model={model}")
        status = result.get("status", "")
        print(f"[VID] poll #{attempt} status={status}")
        if status == "completed":
            return result["video"]["url"]
        if status in ("failed", "error"):
            raise RuntimeError(f"Video generation failed: {result.get('error', 'unknown')}")
    raise RuntimeError("Video generation timeout after 10 minutes")


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

import json
import os
import base64
import time
import boto3
from openai import OpenAI


CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}


def handler(event: dict, context) -> dict:
    """Генерация видео через OpenAI Sora 2 по промпту и/или видео-референсу. Сохраняет результат в S3."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    if event.get("httpMethod") == "GET":
        return {
            "statusCode": 200,
            "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
            "body": json.dumps({"status": "ok", "service": "video-generate"}),
        }

    try:
        body = json.loads(event.get("body") or "{}")
    except (json.JSONDecodeError, TypeError):
        body = {}

    user_prompt = (body.get("prompt") or "").strip()
    video_b64 = (body.get("video_b64") or "").strip()
    video_name = (body.get("video_name") or "input.mp4").strip()
    resolution = body.get("resolution", "720p")
    duration = int(body.get("duration", 5))

    if resolution not in ("480p", "720p", "1080p"):
        resolution = "720p"
    if duration not in (5, 10, 20):
        duration = 5

    client = OpenAI(api_key=os.environ["OPENAI_API_KEY"], base_url="https://api.laozhang.ai/v1")

    if not user_prompt and not video_b64:
        return {
            "statusCode": 400,
            "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
            "body": json.dumps({"error": "Нужен промпт или видео-референс"}),
        }

    final_prompt = user_prompt
    if user_prompt and not _is_english(user_prompt):
        final_prompt = _translate_prompt(client, user_prompt)
        print(f"[VID] translated: {final_prompt!r}")

    print(f"[VID] generating resolution={resolution} duration={duration}s")

    input_video_id = None
    if video_b64:
        input_video_id = _upload_video(client, video_b64, video_name)
        print(f"[VID] uploaded input video: {input_video_id}")

    video_bytes = _generate_video(client, final_prompt, resolution, duration, input_video_id)
    print(f"[VID] got video bytes from sora, size={len(video_bytes)}")

    cdn_url = _save_to_s3(video_bytes)
    print(f"[VID] saved to S3: {cdn_url}")

    return {
        "statusCode": 200,
        "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
        "body": json.dumps({
            "url": cdn_url,
            "prompt_used": final_prompt,
            "resolution": resolution,
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


def _upload_video(client: OpenAI, video_b64: str, filename: str) -> str:
    video_bytes = base64.b64decode(video_b64)
    file_tuple = (filename, video_bytes, "video/mp4")
    response = client.files.create(file=file_tuple, purpose="vision")
    return response.id


RESOLUTION_MAP = {
    "480p": "720x480",
    "720p": "1280x720",
    "1080p": "1920x1080",
}

DURATION_MAP = {5: 4, 10: 8, 20: 12}


def _generate_video(client: OpenAI, prompt: str, resolution: str, duration: int, input_video_id: str | None) -> bytes:
    size = RESOLUTION_MAP.get(resolution, "1280x720")
    seconds = DURATION_MAP.get(duration, 4)

    params = {
        "model": "sora-2",
        "prompt": prompt,
        "size": size,
        "seconds": seconds,
    }
    if input_video_id:
        params["input_reference"] = input_video_id

    response = client.videos.create(**params)
    job_id = response.id

    for _ in range(120):
        job = client.videos.retrieve(video_id=job_id)
        if job.status == "completed":
            break
        if job.status == "failed":
            raise RuntimeError(f"Sora generation failed: {getattr(job, 'error', 'unknown')}")
        time.sleep(5)
    else:
        raise RuntimeError("Sora generation timeout")

    video_content = client.videos.download_content(video_id=job_id)
    return bytes(video_content)


def _save_to_s3(video_bytes: bytes) -> str:

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
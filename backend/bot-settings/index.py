"""
Получение и сохранение настроек Telegram-бота (system_prompt, ai_model, language).
"""

import json
import os
import psycopg2

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "public")


def t(name):
    return f"{SCHEMA}.{name}"


def get_db():
    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    conn.autocommit = True
    return conn


CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
}


def handler(event: dict, context) -> dict:
    """GET — получить настройки, POST — сохранить настройки бота."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    method = event.get("httpMethod", "GET")
    conn = get_db()
    cur = conn.cursor()

    if method == "GET":
        cur.execute(f"SELECT key, value FROM {t('bot_settings')}")
        rows = cur.fetchall()
        settings = {row[0]: row[1] for row in rows}
        return {
            "statusCode": 200,
            "headers": CORS_HEADERS,
            "body": json.dumps(settings, ensure_ascii=False),
        }

    if method == "POST":
        body = json.loads(event.get("body") or "{}")
        allowed_keys = {"system_prompt", "ai_model", "language"}
        updated = []
        for key, value in body.items():
            if key not in allowed_keys:
                continue
            cur.execute(
                f"""
                INSERT INTO {t('bot_settings')} (key, value, updated_at)
                VALUES (%s, %s, NOW())
                ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
                """,
                (key, str(value)),
            )
            updated.append(key)
        return {
            "statusCode": 200,
            "headers": CORS_HEADERS,
            "body": json.dumps({"ok": True, "updated": updated}),
        }

    return {"statusCode": 405, "headers": CORS_HEADERS, "body": json.dumps({"error": "Method not allowed"})}

"""
CRUD для базы знаний бота (bot_knowledge).
GET / — список всех записей
POST / — создать запись
PUT /{id} — обновить запись
DELETE /{id} — удалить запись
GET /export — весь контент одним текстом (для системного промпта бота)
"""

import json
import os
import psycopg2
import psycopg2.extras

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "public")

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}


def t(name):
    return f"{SCHEMA}.{name}"


def get_conn():
    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    conn.autocommit = True
    return conn


def resp(status, body):
    return {
        "statusCode": status,
        "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
        "body": json.dumps(body, default=str, ensure_ascii=False),
    }


def handler(event: dict, context) -> dict:
    """Управление базой знаний бота: разделы, услуги, цены, сотрудники, график."""

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    method = event.get("httpMethod", "GET")
    path = event.get("path", "/")
    params = event.get("queryStringParameters") or {}

    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:

            # GET /export — весь контент одним текстом для системного промпта
            if method == "GET" and params.get("export") == "1":
                cur.execute(f"""
                    SELECT section, title, content FROM {t('bot_knowledge')}
                    WHERE is_active = TRUE
                    ORDER BY sort_order ASC, id ASC
                """)
                rows = cur.fetchall()
                lines = []
                for row in rows:
                    lines.append(f"## {row['title']}\n{row['content']}")
                return resp(200, {"text": "\n\n".join(lines)})

            # GET / — список всех записей
            if method == "GET":
                cur.execute(f"""
                    SELECT id, section, title, content, is_active, sort_order, updated_at
                    FROM {t('bot_knowledge')}
                    ORDER BY sort_order ASC, id ASC
                """)
                return resp(200, {"items": cur.fetchall()})

            # POST / — создать запись
            if method == "POST":
                body = json.loads(event.get("body") or "{}")
                cur.execute(f"""
                    INSERT INTO {t('bot_knowledge')} (section, title, content, is_active, sort_order)
                    VALUES (%s, %s, %s, %s, %s) RETURNING *
                """, (
                    body.get("section", "other"),
                    body.get("title", "").strip(),
                    body.get("content", "").strip(),
                    body.get("is_active", True),
                    body.get("sort_order", 0),
                ))
                return resp(200, {"item": cur.fetchone()})

            # PUT — обновить запись
            if method == "PUT":
                body = json.loads(event.get("body") or "{}")
                item_id = body.get("id") or path.strip("/").split("/")[-1]
                cur.execute(f"""
                    UPDATE {t('bot_knowledge')}
                    SET section = %s, title = %s, content = %s, is_active = %s,
                        sort_order = %s, updated_at = NOW()
                    WHERE id = %s RETURNING *
                """, (
                    body.get("section", "other"),
                    body.get("title", "").strip(),
                    body.get("content", "").strip(),
                    body.get("is_active", True),
                    body.get("sort_order", 0),
                    int(item_id),
                ))
                return resp(200, {"item": cur.fetchone()})

            # DELETE — удалить запись
            if method == "DELETE":
                body = json.loads(event.get("body") or "{}")
                item_id = body.get("id") or path.strip("/").split("/")[-1]
                cur.execute(f"DELETE FROM {t('bot_knowledge')} WHERE id = %s RETURNING id", (int(item_id),))
                deleted = cur.fetchone()
                return resp(200, {"deleted": bool(deleted)})

    finally:
        conn.close()

    return resp(400, {"error": "Unknown request"})

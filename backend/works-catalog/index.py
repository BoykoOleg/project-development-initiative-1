"""
Каталог работ и настройки нормо-часа.
GET    /          — список всех работ
POST   /          — создать работу
PUT    /          — обновить работу (id в body)
DELETE /          — удалить работу (id в query)
GET    /?action=settings  — получить настройки (стоимость нормо-часа)
POST   /?action=settings  — сохранить настройки
"""
import json
import os
import psycopg2

HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-User-Id, X-Auth-Token",
    "Content-Type": "application/json",
}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": HEADERS, "body": ""}

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}
    action = params.get("action", "")

    conn = get_conn()
    cur = conn.cursor()

    try:
        # ── Settings ──────────────────────────────────────────────────────
        if action == "settings":
            if method == "GET":
                cur.execute("SELECT key, value FROM system_settings WHERE key = 'norm_hour_price'")
                row = cur.fetchone()
                price = float(row[1]) if row else 2000.0
                return {"statusCode": 200, "headers": HEADERS, "body": json.dumps({"norm_hour_price": price})}

            if method == "POST":
                body = json.loads(event.get("body") or "{}")
                price = float(body.get("norm_hour_price", 2000))
                cur.execute(
                    "INSERT INTO system_settings (key, value, updated_at) VALUES ('norm_hour_price', %s, NOW()) "
                    "ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()",
                    (str(price),)
                )
                conn.commit()
                return {"statusCode": 200, "headers": HEADERS, "body": json.dumps({"norm_hour_price": price})}

        # ── Works catalog ─────────────────────────────────────────────────
        if method == "GET":
            search = params.get("search", "")
            if search:
                cur.execute(
                    "SELECT id, code, name, norm_hours, is_active FROM works_catalog "
                    "WHERE is_active = TRUE AND (LOWER(name) LIKE %s OR LOWER(code) LIKE %s) ORDER BY code",
                    (f"%{search.lower()}%", f"%{search.lower()}%")
                )
            else:
                cur.execute(
                    "SELECT id, code, name, norm_hours, is_active FROM works_catalog ORDER BY code"
                )
            rows = cur.fetchall()
            works = [{"id": r[0], "code": r[1], "name": r[2], "norm_hours": float(r[3]), "is_active": r[4]} for r in rows]
            return {"statusCode": 200, "headers": HEADERS, "body": json.dumps({"works": works})}

        if method == "POST":
            body = json.loads(event.get("body") or "{}")
            cur.execute(
                "INSERT INTO works_catalog (code, name, norm_hours) VALUES (%s, %s, %s) RETURNING id",
                (body["code"], body["name"], float(body.get("norm_hours", 1.0)))
            )
            new_id = cur.fetchone()[0]
            conn.commit()
            return {"statusCode": 200, "headers": HEADERS, "body": json.dumps({"id": new_id, "ok": True})}

        if method == "PUT":
            body = json.loads(event.get("body") or "{}")
            cur.execute(
                "UPDATE works_catalog SET code=%s, name=%s, norm_hours=%s, is_active=%s, updated_at=NOW() WHERE id=%s",
                (body["code"], body["name"], float(body.get("norm_hours", 1.0)), body.get("is_active", True), body["id"])
            )
            conn.commit()
            return {"statusCode": 200, "headers": HEADERS, "body": json.dumps({"ok": True})}

        if method == "DELETE":
            work_id = params.get("id")
            cur.execute("DELETE FROM works_catalog WHERE id=%s", (work_id,))
            conn.commit()
            return {"statusCode": 200, "headers": HEADERS, "body": json.dumps({"ok": True})}

        return {"statusCode": 405, "headers": HEADERS, "body": json.dumps({"error": "Method not allowed"})}

    finally:
        cur.close()
        conn.close()

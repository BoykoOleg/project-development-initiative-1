import os
import json
import base64
import gzip
from datetime import datetime
import psycopg2
import psycopg2.extras
import boto3


SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "public")

# Таблицы для синхронизации (клиенты → авто, порядок важен из-за FK)
SYNC_TABLES = ["clients", "cars"]


def _get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def _s3_client():
    return boto3.client(
        "s3",
        endpoint_url="https://bucket.poehali.dev",
        aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"],
    )


def _val(v) -> str:
    if v is None:
        return "NULL"
    if isinstance(v, bool):
        return "TRUE" if v else "FALSE"
    if isinstance(v, (int, float)):
        return str(v)
    if isinstance(v, datetime):
        return f"'{v.isoformat()}'"
    escaped = str(v).replace("'", "''")
    return f"'{escaped}'"


def _dump_clients_and_cars(schema: str) -> bytes:
    """Дампит только клиентов и авто в JSON-формате для синхронизации."""
    conn = _get_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    result = {}
    for table in SYNC_TABLES:
        cur.execute(f'SELECT * FROM "{schema}"."{table}" ORDER BY id')
        rows = cur.fetchall()
        result[table] = [dict(r) for r in rows]

    cur.close()
    conn.close()

    raw = json.dumps(result, ensure_ascii=False, default=str).encode("utf-8")
    return gzip.compress(raw)


def _sync_clients_and_cars(gz_bytes: bytes) -> dict:
    """
    Синхронизирует клиентов и авто из файла в базу проекта.
    Стратегия: INSERT IF NOT EXISTS по уникальному ключу (phone для clients, vin для cars).
    Если запись уже есть — пропускаем (побеждает база проекта).
    Возвращает статистику.
    """
    data = json.loads(gzip.decompress(gz_bytes).decode("utf-8"))
    schema = SCHEMA

    conn = _get_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    stats = {"clients_added": 0, "clients_skipped": 0, "cars_added": 0, "cars_skipped": 0}

    # ── Клиенты: уникальный ключ — phone ──────────────────────────────────────
    # Загружаем существующие телефоны → строим маппинг phone → id
    cur.execute(f'SELECT id, phone FROM "{schema}"."clients"')
    existing_clients = {row["phone"]: row["id"] for row in cur.fetchall()}

    # phone из файла → новый id в базе проекта (для привязки авто)
    file_client_id_to_project_id = {}

    for c in data.get("clients", []):
        phone = c.get("phone", "").strip()
        file_id = c.get("id")

        if phone in existing_clients:
            # Уже есть — запоминаем маппинг id
            file_client_id_to_project_id[file_id] = existing_clients[phone]
            stats["clients_skipped"] += 1
        else:
            # Новый клиент — вставляем без id (auto-increment)
            cur.execute(
                f"""INSERT INTO "{schema}"."clients" (name, phone, email, inn, comment, created_at)
                    VALUES (%s, %s, %s, %s, %s, %s) RETURNING id""",
                (
                    c.get("name", ""),
                    phone,
                    c.get("email", ""),
                    c.get("inn", ""),
                    c.get("comment", ""),
                    c.get("created_at"),
                ),
            )
            new_id = cur.fetchone()["id"]
            file_client_id_to_project_id[file_id] = new_id
            existing_clients[phone] = new_id
            stats["clients_added"] += 1

    # ── Авто: уникальный ключ — vin (непустой) или brand+model+client_id ──────
    cur.execute(f'SELECT vin, brand, model, client_id FROM "{schema}"."cars"')
    existing_cars_vin = set()
    existing_cars_combo = set()
    for row in cur.fetchall():
        if row["vin"]:
            existing_cars_vin.add(row["vin"].strip().upper())
        else:
            existing_cars_combo.add((row["brand"], row["model"], row["client_id"]))

    for car in data.get("cars", []):
        file_client_id = car.get("client_id")
        project_client_id = file_client_id_to_project_id.get(file_client_id)

        if project_client_id is None:
            stats["cars_skipped"] += 1
            continue

        vin = (car.get("vin") or "").strip().upper()

        if vin and vin in existing_cars_vin:
            stats["cars_skipped"] += 1
            continue

        combo = (car.get("brand", ""), car.get("model", ""), project_client_id)
        if not vin and combo in existing_cars_combo:
            stats["cars_skipped"] += 1
            continue

        cur.execute(
            f"""INSERT INTO "{schema}"."cars"
                (client_id, brand, model, year, vin, license_plate, is_active, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)""",
            (
                project_client_id,
                car.get("brand", ""),
                car.get("model", ""),
                car.get("year", ""),
                car.get("vin", ""),
                car.get("license_plate"),
                car.get("is_active", True),
                car.get("created_at"),
            ),
        )
        if vin:
            existing_cars_vin.add(vin)
        else:
            existing_cars_combo.add(combo)
        stats["cars_added"] += 1

    conn.commit()
    cur.close()
    conn.close()
    return stats


def handler(event: dict, context) -> dict:
    """Выгрузка и синхронизация клиентов и авто между базами данных."""
    cors = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token",
    }

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors, "body": ""}

    method = event.get("httpMethod", "GET")
    action = (event.get("queryStringParameters") or {}).get("action", "")

    # ── Выгрузка: дамп клиентов и авто → S3 → ссылка ─────────────────────────
    if method == "POST" and action == "dump":
        schema = SCHEMA
        gz_bytes = _dump_clients_and_cars(schema)

        ts = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        key = f"backups/sync_{schema}_{ts}.json.gz"

        s3 = _s3_client()
        s3.put_object(Bucket="files", Key=key, Body=gz_bytes, ContentType="application/gzip")

        key_id = os.environ["AWS_ACCESS_KEY_ID"]
        url = f"https://cdn.poehali.dev/projects/{key_id}/bucket/{key}"

        return {
            "statusCode": 200,
            "headers": {**cors, "Content-Type": "application/json"},
            "body": json.dumps({
                "success": True,
                "url": url,
                "filename": f"sync_{ts}.json.gz",
                "size": len(gz_bytes),
            }),
        }

    # ── Синхронизация: загрузить файл → добавить только новые ────────────────
    if method == "POST" and action == "restore":
        body = json.loads(event.get("body") or "{}")
        confirm = body.get("confirm", "")
        file_b64 = body.get("data", "")

        if confirm != "YES_RESTORE":
            return {
                "statusCode": 400,
                "headers": {**cors, "Content-Type": "application/json"},
                "body": json.dumps({"success": False, "error": "Требуется подтверждение"}),
            }

        if not file_b64:
            return {
                "statusCode": 400,
                "headers": {**cors, "Content-Type": "application/json"},
                "body": json.dumps({"success": False, "error": "Файл не передан"}),
            }

        gz_bytes = base64.b64decode(file_b64)
        stats = _sync_clients_and_cars(gz_bytes)

        return {
            "statusCode": 200,
            "headers": {**cors, "Content-Type": "application/json"},
            "body": json.dumps({
                "success": True,
                "message": (
                    f"Синхронизация завершена: "
                    f"клиентов добавлено {stats['clients_added']}, пропущено {stats['clients_skipped']}; "
                    f"авто добавлено {stats['cars_added']}, пропущено {stats['cars_skipped']}."
                ),
                "stats": stats,
            }),
        }

    return {
        "statusCode": 400,
        "headers": {**cors, "Content-Type": "application/json"},
        "body": json.dumps({"success": False, "error": "Неверный запрос"}),
    }

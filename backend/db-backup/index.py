import os
import json
import base64
import gzip
from datetime import datetime
import psycopg2
import psycopg2.extras
import boto3


def _get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def _s3_client():
    return boto3.client(
        "s3",
        endpoint_url="https://bucket.poehali.dev",
        aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"],
    )


def _dump_schema(schema: str) -> bytes:
    """Генерирует SQL-дамп всех таблиц схемы и возвращает gzip-bytes."""
    conn = _get_conn()
    cur = conn.cursor()

    lines = [f"-- backup | schema: {schema}\n"]
    lines.append("SET client_encoding = 'UTF8';\n")
    lines.append(f"SET search_path = {schema}, public;\n\n")

    cur.execute(
        "SELECT table_name FROM information_schema.tables "
        "WHERE table_schema = %s AND table_type = 'BASE TABLE' ORDER BY table_name",
        (schema,),
    )
    tables = [row[0] for row in cur.fetchall()]

    for table in tables:
        cur.execute(f'SELECT * FROM "{schema}"."{table}"')
        rows = cur.fetchall()
        cols = [desc[0] for desc in cur.description]

        lines.append(f"-- Table: {table}\n")
        lines.append(f'DELETE FROM "{schema}"."{table}";\n')

        for row in rows:
            values = []
            for v in row:
                if v is None:
                    values.append("NULL")
                elif isinstance(v, bool):
                    values.append("TRUE" if v else "FALSE")
                elif isinstance(v, (int, float)):
                    values.append(str(v))
                else:
                    escaped = str(v).replace("'", "''")
                    values.append(f"'{escaped}'")
            cols_str = ", ".join(f'"{c}"' for c in cols)
            vals_str = ", ".join(values)
            lines.append(
                f'INSERT INTO "{schema}"."{table}" ({cols_str}) VALUES ({vals_str});\n'
            )
        lines.append("\n")

    cur.close()
    conn.close()
    raw = "".join(lines).encode("utf-8")
    return gzip.compress(raw)


def _restore_dump(gz_bytes: bytes):
    """Восстанавливает дамп из gzip-bytes."""
    sql_text = gzip.decompress(gz_bytes).decode("utf-8")
    conn = _get_conn()
    cur = conn.cursor()
    for line in sql_text.splitlines():
        line = line.strip()
        if not line or line.startswith("--") or line.startswith("SET "):
            continue
        try:
            cur.execute(line)
        except Exception:
            conn.rollback()
            raise
    conn.commit()
    cur.close()
    conn.close()


def handler(event: dict, context) -> dict:
    """Выгрузка дампа в S3 и загрузка дампа из файла. Используется для резервного копирования."""
    cors = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token",
    }

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors, "body": ""}

    method = event.get("httpMethod", "GET")
    action = (event.get("queryStringParameters") or {}).get("action", "")

    # ── Выгрузка: создать дамп → сохранить в S3 → вернуть ссылку ────────────
    if method == "POST" and action == "dump":
        schema = os.environ.get("MAIN_DB_SCHEMA", "public")
        gz_bytes = _dump_schema(schema)

        ts = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        key = f"backups/backup_{schema}_{ts}.sql.gz"

        s3 = _s3_client()
        s3.put_object(
            Bucket="files",
            Key=key,
            Body=gz_bytes,
            ContentType="application/gzip",
        )

        key_id = os.environ["AWS_ACCESS_KEY_ID"]
        url = f"https://cdn.poehali.dev/projects/{key_id}/bucket/{key}"

        return {
            "statusCode": 200,
            "headers": {**cors, "Content-Type": "application/json"},
            "body": json.dumps({
                "success": True,
                "url": url,
                "filename": f"backup_{schema}_{ts}.sql.gz",
                "size": len(gz_bytes),
            }),
        }

    # ── Загрузка: принять base64 файла → восстановить ────────────────────────
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
        _restore_dump(gz_bytes)

        return {
            "statusCode": 200,
            "headers": {**cors, "Content-Type": "application/json"},
            "body": json.dumps({"success": True, "message": "База данных восстановлена"}),
        }

    return {
        "statusCode": 400,
        "headers": {**cors, "Content-Type": "application/json"},
        "body": json.dumps({"success": False, "error": "Неверный запрос"}),
    }

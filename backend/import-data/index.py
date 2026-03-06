import json
import os
import psycopg2
import re

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "public")


def t(name):
    return f"{SCHEMA}.{name}"


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def normalize_phone(phone: str) -> str:
    if not phone:
        return ""
    digits = re.sub(r"\D", "", str(phone))
    if len(digits) == 11 and digits.startswith("8"):
        digits = "7" + digits[1:]
    if len(digits) == 10:
        digits = "7" + digits
    return "+" + digits if digits else ""


def import_clients(rows: list[dict]) -> dict:
    """Импорт клиентов из Excel. Строки: name, phone, email, comment"""
    conn = get_conn()
    cur = conn.cursor()
    created = 0
    skipped = 0
    errors = []

    for i, row in enumerate(rows):
        name = str(row.get("name") or row.get("ФИО") or row.get("Имя") or "").strip()
        phone = str(row.get("phone") or row.get("Телефон") or "").strip()
        email = str(row.get("email") or row.get("Email") or "").strip()
        comment = str(row.get("comment") or row.get("Комментарий") or row.get("Примечания") or "").strip()

        if not name:
            skipped += 1
            continue

        phone = normalize_phone(phone)

        try:
            cur.execute(
                f"SELECT id FROM {t('clients')} WHERE name = %s AND phone = %s",
                (name, phone)
            )
            if cur.fetchone():
                skipped += 1
                continue

            cur.execute(
                f"INSERT INTO {t('clients')} (name, phone, email, comment) VALUES (%s, %s, %s, %s)",
                (name, phone, email, comment)
            )
            created += 1
        except Exception as e:
            errors.append(f"Строка {i + 2}: {str(e)}")

    conn.commit()
    cur.close()
    conn.close()
    return {"created": created, "skipped": skipped, "errors": errors}


def import_works(rows: list[dict]) -> dict:
    """Импорт каталога работ из Excel. Строки: code, name, norm_hours"""
    conn = get_conn()
    cur = conn.cursor()
    created = 0
    skipped = 0
    errors = []

    for i, row in enumerate(rows):
        name = str(row.get("name") or row.get("Наименование") or row.get("Работа") or "").strip()
        code = str(row.get("code") or row.get("Код") or "").strip()
        norm_hours_raw = row.get("norm_hours") or row.get("Нормо-часы") or row.get("Н/ч") or 0
        try:
            norm_hours = float(str(norm_hours_raw).replace(",", "."))
        except Exception:
            norm_hours = 0.0

        if not name:
            skipped += 1
            continue

        try:
            cur.execute(f"SELECT id FROM {t('works_catalog')} WHERE name = %s", (name,))
            if cur.fetchone():
                skipped += 1
                continue

            cur.execute(
                f"INSERT INTO {t('works_catalog')} (code, name, norm_hours, is_active) VALUES (%s, %s, %s, true)",
                (code, name, norm_hours)
            )
            created += 1
        except Exception as e:
            errors.append(f"Строка {i + 2}: {str(e)}")

    conn.commit()
    cur.close()
    conn.close()
    return {"created": created, "skipped": skipped, "errors": errors}


def import_products(rows: list[dict]) -> dict:
    """Импорт номенклатуры из Excel. Строки: sku, name, category, unit, purchase_price, min_quantity"""
    conn = get_conn()
    cur = conn.cursor()
    created = 0
    skipped = 0
    errors = []
    counter = 0

    for i, row in enumerate(rows):
        name = str(row.get("name") or row.get("Наименование") or "").strip()
        sku = str(row.get("sku") or row.get("Артикул") or row.get("SKU") or "").strip()
        category = str(row.get("category") or row.get("Категория") or "").strip()
        unit = str(row.get("unit") or row.get("Ед.") or row.get("Единица") or "шт").strip() or "шт"
        description = str(row.get("description") or row.get("Описание") or "").strip()

        purchase_price_raw = row.get("purchase_price") or row.get("Цена") or row.get("Закупочная цена") or 0
        min_quantity_raw = row.get("min_quantity") or row.get("Мин. остаток") or 0

        try:
            purchase_price = float(str(purchase_price_raw).replace(",", "."))
        except Exception:
            purchase_price = 0.0
        try:
            min_quantity = int(float(str(min_quantity_raw).replace(",", ".")))
        except Exception:
            min_quantity = 0

        if not name:
            skipped += 1
            continue

        if not sku:
            counter += 1
            sku = f"IMP-{counter:05d}"

        try:
            cur.execute(f"SELECT id FROM {t('products')} WHERE sku = %s", (sku,))
            if cur.fetchone():
                skipped += 1
                continue

            cur.execute(
                f"""INSERT INTO {t('products')} (sku, name, description, category, unit, purchase_price, min_quantity, is_active)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, true)""",
                (sku, name, description, category, unit, purchase_price, min_quantity)
            )
            created += 1
        except Exception as e:
            errors.append(f"Строка {i + 2}: {str(e)}")

    conn.commit()
    cur.close()
    conn.close()
    return {"created": created, "skipped": skipped, "errors": errors}


CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}


def handler(event: dict, context) -> dict:
    """Импорт данных из Excel (клиенты, работы, номенклатура)"""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    if event.get("httpMethod") != "POST":
        return {"statusCode": 405, "headers": CORS_HEADERS, "body": json.dumps({"error": "Method not allowed"})}

    body = json.loads(event.get("body") or "{}")
    entity = body.get("entity")
    rows = body.get("rows", [])

    if not entity:
        return {"statusCode": 400, "headers": CORS_HEADERS, "body": json.dumps({"error": "entity required"})}

    if not rows:
        return {"statusCode": 400, "headers": CORS_HEADERS, "body": json.dumps({"error": "rows required"})}

    if entity == "clients":
        result = import_clients(rows)
    elif entity == "works":
        result = import_works(rows)
    elif entity == "products":
        result = import_products(rows)
    else:
        return {"statusCode": 400, "headers": CORS_HEADERS, "body": json.dumps({"error": f"Unknown entity: {entity}"})}

    return {"statusCode": 200, "headers": CORS_HEADERS, "body": json.dumps(result)}
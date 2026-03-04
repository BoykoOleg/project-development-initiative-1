import time
from database import t


def create_order_in_db(conn, client_name: str, phone: str, car: str, comment: str) -> int:
    cur = conn.cursor()
    cur.execute(f"""
        INSERT INTO {t('orders')} (client_name, phone, car_info, comment, status, source)
        VALUES (%s, %s, %s, %s, 'new', 'telegram')
        RETURNING id
    """, (client_name, phone, car, comment))
    order_id = cur.fetchone()[0]
    conn.commit()
    cur.close()
    return order_id


def update_work_order_status_in_db(conn, work_order_id: int, status: str) -> bool:
    valid_statuses = ["new", "in-progress", "done", "issued"]
    if status not in valid_statuses:
        return False
    cur = conn.cursor()
    cur.execute(f"UPDATE {t('work_orders')} SET status = %s WHERE id = %s", (status, work_order_id))
    updated = cur.rowcount > 0
    conn.commit()
    cur.close()
    return updated


def get_work_order_detail(conn, work_order_id: int) -> str:
    cur = conn.cursor()

    cur.execute(f"""
        SELECT wo.id, wo.client_name, wo.car_info,
               wo.status, wo.master, wo.created_at, wo.issued_at
        FROM {t('work_orders')} wo
        WHERE wo.id = %s
    """, (work_order_id,))
    wo = cur.fetchone()
    if not wo:
        return f"Заказ-наряд #{work_order_id} не найден."

    cur.execute(f"SELECT name, qty, price, discount FROM {t('work_order_works')} WHERE work_order_id = %s", (work_order_id,))
    works = cur.fetchall()

    cur.execute(f"SELECT name, qty, sell_price FROM {t('work_order_parts')} WHERE work_order_id = %s", (work_order_id,))
    parts = cur.fetchall()

    total_works = sum(w[1] * w[2] * (1 - (w[3] or 0) / 100) for w in works)
    total_parts = sum(p[1] * p[2] for p in parts)
    total = total_works + total_parts

    status_map = {"new": "Новый", "in-progress": "В работе", "done": "Готов", "issued": "Выдан"}

    result = f"📋 Заказ-наряд #{wo[0]}\n"
    result += f"Клиент: {wo[1]}\n"
    result += f"Авто: {wo[2]}\n"
    result += f"Статус: {status_map.get(wo[3], wo[3])}\n"
    result += f"Мастер: {wo[4] or 'не назначен'}\n"
    result += f"Создан: {wo[5].strftime('%d.%m.%Y') if wo[5] else '—'}\n"
    if wo[6]:
        result += f"Выдан: {wo[6].strftime('%d.%m.%Y')}\n"

    if works:
        result += "\n🔧 Работы:\n"
        for w in works:
            price = w[1] * w[2] * (1 - (w[3] or 0) / 100)
            result += f"  • {w[0]} x{w[1]} = {price:.0f}₽\n"

    if parts:
        result += "\n🔩 Запчасти:\n"
        for p in parts:
            result += f"  • {p[0]} x{p[1]} = {p[1]*p[2]:.0f}₽\n"

    result += f"\n💰 Итого: {total:.0f}₽"
    cur.close()
    return result


def find_or_create_client(conn, name: str, phone: str) -> int:
    cur = conn.cursor()
    if phone:
        cur.execute(f"SELECT id FROM {t('clients')} WHERE phone = %s LIMIT 1", (phone,))
        row = cur.fetchone()
        if row:
            cur.close()
            return row[0]
    if name:
        cur.execute(f"SELECT id FROM {t('clients')} WHERE name ILIKE %s LIMIT 1", (name,))
        row = cur.fetchone()
        if row:
            cur.close()
            return row[0]
    cur.execute(f"""
        INSERT INTO {t('clients')} (name, phone) VALUES (%s, %s) RETURNING id
    """, (name or "Без имени", phone or ""))
    client_id = cur.fetchone()[0]
    cur.close()
    return client_id


def find_or_create_car(conn, client_id: int, car_info: str) -> int:
    cur = conn.cursor()
    if car_info:
        cur.execute(f"SELECT id FROM {t('cars')} WHERE client_id = %s AND (brand || ' ' || model) ILIKE %s LIMIT 1",
                     (client_id, f"%{car_info[:30]}%"))
        row = cur.fetchone()
        if row:
            cur.close()
            return row[0]
    parts = car_info.split(maxsplit=1) if car_info else ["", ""]
    brand = parts[0] if len(parts) > 0 else ""
    model = parts[1] if len(parts) > 1 else ""
    cur.execute(f"""
        INSERT INTO {t('cars')} (client_id, brand, model) VALUES (%s, %s, %s) RETURNING id
    """, (client_id, brand or car_info or "Неизвестно", model or ""))
    car_id = cur.fetchone()[0]
    cur.close()
    return car_id


def create_work_order_in_db(conn, client_name: str, phone: str, car_info: str,
                             master: str = "", works: list = None, parts: list = None) -> int:
    client_id = find_or_create_client(conn, client_name, phone)
    car_id = find_or_create_car(conn, client_id, car_info) if car_info else None

    cur = conn.cursor()
    cur.execute(f"""
        INSERT INTO {t('work_orders')} (client_id, car_id, client_name, car_info, status, master)
        VALUES (%s, %s, %s, %s, 'new', %s)
        RETURNING id
    """, (client_id, car_id, client_name, car_info or "", master or ""))
    wo_id = cur.fetchone()[0]

    if works:
        for w in works:
            cur.execute(f"""
                INSERT INTO {t('work_order_works')} (work_order_id, name, price, qty)
                VALUES (%s, %s, %s, %s)
            """, (wo_id, w.get("name", "Работа"), float(w.get("price", 0)), float(w.get("qty", 1))))

    if parts:
        for p in parts:
            cur.execute(f"""
                INSERT INTO {t('work_order_parts')} (work_order_id, name, sell_price, qty)
                VALUES (%s, %s, %s, %s)
            """, (wo_id, p.get("name", "Запчасть"), float(p.get("price", 0)), int(p.get("qty", 1))))

    cur.close()
    return wo_id


def add_works_to_wo(conn, wo_id: int, works: list) -> int:
    cur = conn.cursor()
    count = 0
    for w in works:
        cur.execute(f"""
            INSERT INTO {t('work_order_works')} (work_order_id, name, price, qty)
            VALUES (%s, %s, %s, %s)
        """, (wo_id, w.get("name", "Работа"), float(w.get("price", 0)), float(w.get("qty", 1))))
        count += 1
    cur.close()
    return count


def add_parts_to_wo(conn, wo_id: int, parts: list) -> int:
    cur = conn.cursor()
    count = 0
    for p in parts:
        cur.execute(f"""
            INSERT INTO {t('work_order_parts')} (work_order_id, name, sell_price, qty)
            VALUES (%s, %s, %s, %s)
        """, (wo_id, p.get("name", "Запчасть"), float(p.get("price", 0)), int(p.get("qty", 1))))
        count += 1
    cur.close()
    return count


def create_expense_in_db(conn, amount: float, comment: str, cashbox_id: int, expense_group_id: int) -> int:
    cur = conn.cursor()
    cur.execute(f"""
        INSERT INTO {t('expenses')} (amount, comment, cashbox_id, expense_group_id)
        VALUES (%s, %s, %s, %s)
        RETURNING id
    """, (amount, comment, cashbox_id, expense_group_id))
    expense_id = cur.fetchone()[0]
    cur.execute(f"UPDATE {t('cashboxes')} SET balance = balance - %s WHERE id = %s", (amount, cashbox_id))
    cur.close()
    return expense_id


def create_payment_in_db(conn, amount: float, comment: str, cashbox_id: int, payment_method: str, work_order_id: int = None) -> int:
    cur = conn.cursor()
    cur.execute(f"""
        INSERT INTO {t('payments')} (amount, comment, cashbox_id, payment_method, work_order_id)
        VALUES (%s, %s, %s, %s, %s)
        RETURNING id
    """, (amount, comment, cashbox_id, payment_method, work_order_id))
    payment_id = cur.fetchone()[0]
    cur.execute(f"UPDATE {t('cashboxes')} SET balance = balance + %s WHERE id = %s", (amount, cashbox_id))
    if work_order_id:
        cur.execute(f"UPDATE {t('work_orders')} SET status = 'issued' WHERE id = %s AND status = 'done'", (work_order_id,))
    cur.close()
    return payment_id


def create_client_in_db(conn, name: str, phone: str, email: str = "", comment: str = "") -> tuple:
    cur = conn.cursor()
    if phone:
        cur.execute(f"SELECT id, name FROM {t('clients')} WHERE phone = %s LIMIT 1", (phone,))
        row = cur.fetchone()
        if row:
            cur.close()
            return row[0], row[1], False
    if name:
        cur.execute(f"SELECT id, name FROM {t('clients')} WHERE name ILIKE %s LIMIT 1", (name,))
        row = cur.fetchone()
        if row:
            cur.close()
            return row[0], row[1], False
    cur.execute(f"""
        INSERT INTO {t('clients')} (name, phone, email, comment) VALUES (%s, %s, %s, %s) RETURNING id, name
    """, (name or "Без имени", phone or "", email or "", comment or ""))
    client_id, client_name = cur.fetchone()
    conn.commit()
    cur.close()
    return client_id, client_name, True


def create_car_in_db(conn, client_id: int, brand: str, model: str, year: str = "", vin: str = "", license_plate: str = "") -> tuple:
    cur = conn.cursor()
    cur.execute(f"SELECT id FROM {t('cars')} WHERE client_id = %s AND brand ILIKE %s AND model ILIKE %s LIMIT 1",
                (client_id, brand, model))
    row = cur.fetchone()
    if row:
        cur.close()
        return row[0], False
    cur.execute(f"""
        INSERT INTO {t('cars')} (client_id, brand, model, year, vin, license_plate)
        VALUES (%s, %s, %s, %s, %s, %s) RETURNING id
    """, (client_id, brand or "Неизвестно", model or "", year or "", vin or "", license_plate or ""))
    car_id = cur.fetchone()[0]
    conn.commit()
    cur.close()
    return car_id, True


def update_car_in_db(conn, car_id: int, **fields) -> bool:
    allowed = {"brand", "model", "year", "vin", "license_plate"}
    updates = {k: v for k, v in fields.items() if k in allowed and v is not None}
    if not updates:
        return False
    cur = conn.cursor()
    set_parts = []
    values = []
    for k, v in updates.items():
        set_parts.append(f"{k} = %s")
        values.append(v)
    values.append(car_id)
    cur.execute(f"UPDATE {t('cars')} SET {', '.join(set_parts)} WHERE id = %s AND is_active = TRUE", values)
    updated = cur.rowcount > 0
    conn.commit()
    cur.close()
    return updated


def create_product_in_db(conn, name: str, sku: str = "", category: str = "", purchase_price: float = 0.0, quantity: int = 0, unit: str = "шт", description: str = "") -> tuple:
    cur = conn.cursor()
    if sku:
        cur.execute(f"SELECT id, name FROM {t('products')} WHERE sku = %s LIMIT 1", (sku,))
        row = cur.fetchone()
        if row:
            cur.close()
            return row[0], row[1], False
    cur.execute(f"SELECT id, name FROM {t('products')} WHERE name ILIKE %s LIMIT 1", (name,))
    row = cur.fetchone()
    if row:
        cur.close()
        return row[0], row[1], False
    auto_sku = sku or f"SKU-{int(time.time())}"
    cur.execute(f"""
        INSERT INTO {t('products')} (name, sku, category, purchase_price, quantity, unit, description)
        VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id, name
    """, (name, auto_sku, category or "", purchase_price or 0.0, quantity or 0, unit or "шт", description or ""))
    product_id, product_name = cur.fetchone()
    conn.commit()
    cur.close()
    return product_id, product_name, True

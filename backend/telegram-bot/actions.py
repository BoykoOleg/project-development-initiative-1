from telegram_api import send_message
from models import (
    create_order_in_db,
    update_work_order_status_in_db,
    get_work_order_detail,
    create_expense_in_db,
    create_payment_in_db,
    create_work_order_in_db,
    add_works_to_wo,
    add_parts_to_wo,
    create_client_in_db,
    update_client_in_db,
    create_car_in_db,
    update_car_in_db,
    create_product_in_db,
)


def process_ai_action(conn, action_data: dict, bot_token: str, chat_id: int):
    action = action_data.get("action")

    if action == "create_order":
        order_id = create_order_in_db(
            conn,
            action_data.get("client_name", ""),
            action_data.get("phone", ""),
            action_data.get("car", ""),
            action_data.get("comment", "")
        )
        send_message(bot_token, chat_id, f"✅ Заявка #{order_id} успешно создана!")

    elif action == "update_wo_status":
        wo_id = action_data.get("id")
        status = action_data.get("status")
        status_map = {"new": "Новый", "in-progress": "В работе", "done": "Готов", "issued": "Выдан"}
        if update_work_order_status_in_db(conn, wo_id, status):
            send_message(bot_token, chat_id, f"✅ Заказ-наряд #{wo_id} переведён в статус «{status_map.get(status, status)}»")
        else:
            send_message(bot_token, chat_id, f"❌ Не удалось обновить заказ-наряд #{wo_id}.")

    elif action == "get_wo_detail":
        wo_id = action_data.get("id")
        detail = get_work_order_detail(conn, wo_id)
        send_message(bot_token, chat_id, detail)

    elif action == "create_expense":
        amount = float(action_data.get("amount", 0))
        comment = action_data.get("comment", "")
        cashbox_id = int(action_data.get("cashbox_id", 1))
        group_id = int(action_data.get("expense_group_id", 5))
        if amount <= 0:
            send_message(bot_token, chat_id, "Не указана сумма расхода.")
            return
        expense_id = create_expense_in_db(conn, amount, comment, cashbox_id, group_id)
        send_message(bot_token, chat_id, f"✅ Расход #{expense_id} на {amount:,.0f}₽ записан.")

    elif action == "create_payment":
        amount = float(action_data.get("amount", 0))
        comment = action_data.get("comment", "")
        cashbox_id = int(action_data.get("cashbox_id", 1))
        method = action_data.get("payment_method", "cash")
        if amount <= 0:
            send_message(bot_token, chat_id, "Не указана сумма поступления.")
            return
        payment_id = create_payment_in_db(conn, amount, comment, cashbox_id, method)
        send_message(bot_token, chat_id, f"✅ Поступление #{payment_id} на {amount:,.0f}₽ записано.")

    elif action == "pay_work_order":
        wo_id = action_data.get("work_order_id")
        amount = float(action_data.get("amount", 0))
        cashbox_id = int(action_data.get("cashbox_id", 1))
        method = action_data.get("payment_method", "cash")
        comment = action_data.get("comment", f"Оплата заказ-наряда #{wo_id}")
        if amount <= 0:
            send_message(bot_token, chat_id, "Не указана сумма оплаты.")
            return
        payment_id = create_payment_in_db(conn, amount, comment, cashbox_id, method, work_order_id=wo_id)
        send_message(bot_token, chat_id, f"✅ Оплата {amount:,.0f}₽ по заказ-наряду #{wo_id} записана (платёж #{payment_id}).")

    elif action == "create_work_order":
        client_name = action_data.get("client_name", "")
        phone = action_data.get("phone", "")
        car_info = action_data.get("car_info", "")
        master = action_data.get("master", "")
        works = action_data.get("works", [])
        parts = action_data.get("parts", [])
        client_id = action_data.get("client_id")
        car_id = action_data.get("car_id")
        employee_id = action_data.get("employee_id")
        if client_id:
            client_id = int(client_id)
        if car_id:
            car_id = int(car_id)
        if employee_id:
            employee_id = int(employee_id)
        if not client_name and not client_id:
            send_message(bot_token, chat_id, "Не указан клиент для заказ-наряда.")
            return
        wo_id = create_work_order_in_db(
            conn, client_name, phone, car_info, master, works, parts,
            client_id=client_id, car_id=car_id, employee_id=employee_id
        )
        total_works = sum(float(w.get("price", 0)) * float(w.get("qty", 1)) for w in works)
        total_parts = sum(float(p.get("sell_price", p.get("price", 0))) * int(p.get("qty", 1)) for p in parts)
        total = total_works + total_parts
        msg = f"✅ Заказ-наряд #{wo_id} создан!\nКлиент: {client_name or f'id={client_id}'}\nАвто: {car_info or (f'авто#{car_id}' if car_id else '—')}"
        if master:
            msg += f"\nМастер: {master}"
        if works:
            works_lines = "\n".join([f"  • {w.get('name')} x{w.get('qty',1)} = {float(w.get('price',0))*float(w.get('qty',1)):,.0f}₽" for w in works])
            msg += f"\n🔧 Работы:\n{works_lines}"
        if parts:
            parts_lines = "\n".join([f"  • {p.get('name')} x{p.get('qty',1)} = {float(p.get('sell_price', p.get('price',0)))*int(p.get('qty',1)):,.0f}₽" for p in parts])
            msg += f"\n🔩 Запчасти:\n{parts_lines}"
        if total > 0:
            msg += f"\n💰 Итого: {total:,.0f}₽"
        send_message(bot_token, chat_id, msg)

    elif action == "add_works":
        wo_id = action_data.get("work_order_id")
        works = action_data.get("works", [])
        if not wo_id or not works:
            send_message(bot_token, chat_id, "Не указан заказ-наряд или список работ.")
            return
        count = add_works_to_wo(conn, wo_id, works)
        total = sum(float(w.get("price", 0)) * float(w.get("qty", 1)) for w in works)
        send_message(bot_token, chat_id, f"✅ Добавлено {count} работ в заказ-наряд #{wo_id} на {total:,.0f}₽")

    elif action == "add_parts":
        wo_id = action_data.get("work_order_id")
        parts = action_data.get("parts", [])
        if not wo_id or not parts:
            send_message(bot_token, chat_id, "Не указан заказ-наряд или список запчастей.")
            return
        count = add_parts_to_wo(conn, wo_id, parts)
        total = sum(float(p.get("price", 0)) * int(p.get("qty", 1)) for p in parts)
        send_message(bot_token, chat_id, f"✅ Добавлено {count} запчастей в заказ-наряд #{wo_id} на {total:,.0f}₽")

    elif action == "create_client":
        name = action_data.get("name", "")
        phone = action_data.get("phone", "")
        email = action_data.get("email", "")
        comment = action_data.get("comment", "")
        if not name and not phone:
            send_message(bot_token, chat_id, "Не указаны имя или телефон клиента.")
            return
        client_id, client_name, created = create_client_in_db(conn, name, phone, email, comment)
        if created:
            send_message(bot_token, chat_id, f"✅ Клиент «{client_name}» добавлен в базу (#{client_id}).")
        else:
            send_message(bot_token, chat_id, f"Клиент «{client_name}» уже есть в базе (#{client_id}).")

    elif action == "update_client":
        client_id = action_data.get("client_id") or action_data.get("id")
        if not client_id:
            send_message(bot_token, chat_id, "Не указан ID клиента.")
            return
        update_fields = {}
        for field in ["name", "phone", "email", "comment"]:
            val = action_data.get(field)
            if val is not None and val != "":
                update_fields[field] = val
        if not update_fields:
            send_message(bot_token, chat_id, "Не указаны поля для обновления клиента.")
            return
        if update_client_in_db(conn, int(client_id), **update_fields):
            changes = ", ".join([f"{k}={v}" for k, v in update_fields.items()])
            send_message(bot_token, chat_id, f"✅ Клиент #{client_id} обновлён: {changes}")
        else:
            send_message(bot_token, chat_id, f"❌ Не удалось обновить клиента #{client_id}. Проверьте ID.")

    elif action == "create_car":
        client_name = action_data.get("client_name", "")
        phone = action_data.get("phone", "")
        brand = action_data.get("brand", "")
        model = action_data.get("model", "")
        year = action_data.get("year", "")
        vin = action_data.get("vin", "")
        license_plate = action_data.get("license_plate", "")
        if not brand:
            send_message(bot_token, chat_id, "Не указана марка автомобиля.")
            return
        if not client_name and not phone:
            send_message(bot_token, chat_id, "Не указан клиент (имя или телефон).")
            return
        client_id, _, _ = create_client_in_db(conn, client_name, phone)
        car_id, created = create_car_in_db(conn, client_id, brand, model, year, vin, license_plate)
        car_str = f"{brand} {model}".strip()
        if created:
            msg = f"✅ Автомобиль {car_str} добавлен клиенту «{client_name}» (#{car_id})."
            if license_plate:
                msg += f" Номер: {license_plate}."
        else:
            msg = f"Автомобиль {car_str} уже есть в базе для этого клиента (#{car_id})."
        send_message(bot_token, chat_id, msg)

    elif action == "update_car":
        car_id = action_data.get("car_id")
        if not car_id:
            send_message(bot_token, chat_id, "Не указан ID автомобиля.")
            return
        update_fields = {}
        for field in ["brand", "model", "year", "vin", "license_plate"]:
            val = action_data.get(field)
            if val is not None and val != "":
                update_fields[field] = val
        if not update_fields:
            send_message(bot_token, chat_id, "Не указаны поля для обновления.")
            return
        if update_car_in_db(conn, car_id, **update_fields):
            changes = ", ".join([f"{k}={v}" for k, v in update_fields.items()])
            send_message(bot_token, chat_id, f"✅ Автомобиль #{car_id} обновлён: {changes}")
        else:
            send_message(bot_token, chat_id, f"❌ Не удалось обновить автомобиль #{car_id}. Проверьте ID.")

    elif action == "create_product":
        name = action_data.get("name", "")
        sku = action_data.get("sku", "")
        category = action_data.get("category", "")
        purchase_price = float(action_data.get("purchase_price", 0))
        quantity = int(action_data.get("quantity", 0))
        unit = action_data.get("unit", "шт")
        description = action_data.get("description", "")
        if not name:
            send_message(bot_token, chat_id, "Не указано название товара.")
            return
        product_id, product_name, created = create_product_in_db(conn, name, sku, category, purchase_price, quantity, unit, description)
        if created:
            msg = f"✅ Товар «{product_name}» добавлен на склад (#{product_id})."
            if quantity > 0:
                msg += f" Количество: {quantity} {unit}."
        else:
            msg = f"Товар «{product_name}» уже есть на складе (#{product_id})."
        send_message(bot_token, chat_id, msg)

    else:
        print(f"[AI] Unknown action: {action}")
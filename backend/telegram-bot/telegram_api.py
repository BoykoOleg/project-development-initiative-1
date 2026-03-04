import requests

TELEGRAM_API = "https://api.telegram.org/bot"


def send_message(bot_token: str, chat_id: int, text: str, parse_mode: str = "", reply_markup: dict = None):
    url = f"{TELEGRAM_API}{bot_token}/sendMessage"
    payload = {"chat_id": chat_id, "text": text}
    if parse_mode:
        payload["parse_mode"] = parse_mode
    if reply_markup:
        payload["reply_markup"] = reply_markup
    r = requests.post(url, json=payload, timeout=10)
    if not r.ok:
        print(f"[TG] send error {r.status_code}: {r.text[:200]}")


def send_start_menu(bot_token: str, chat_id: int):
    text = (
        "👋 Добро пожаловать в систему автосервиса!\n\n"
        "Я ваш ИИ-помощник. Могу:\n"
        "• Показать заявки и заказ-наряды\n"
        "• Создать новую заявку\n"
        "• Сформировать финансовый отчёт\n"
        "• Ответить на любой вопрос по данным\n\n"
        "Выберите действие или напишите свой вопрос:"
    )
    keyboard = {
        "keyboard": [
            [{"text": "📋 Заявки"}, {"text": "🔧 Заказ-наряды"}],
            [{"text": "💰 Финансовый отчёт"}, {"text": "➕ Создать заявку"}],
            [{"text": "📊 Сводка по кассам"}]
        ],
        "resize_keyboard": True,
        "persistent": True
    }
    send_message(bot_token, chat_id, text, reply_markup=keyboard)

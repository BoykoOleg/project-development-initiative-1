# Локальный прокси для вебхуков Мобилон

## Как это работает

```
Мобилон ВАТС  →  HTTP POST  →  твой сервер :5173  →  proehali.dev cloud function  →  PostgreSQL
```

Локальный сервер принимает вебхуки от Мобилона и пересылает их в облачную функцию проекта.
Никаких секретов и токенов хранить локально не нужно — всё уже настроено в облаке.

---

## Требования

- Python 3.6+ (без дополнительных зависимостей — только стандартная библиотека)
- Белый IP-адрес, порт 5173 открыт для входящих соединений

---

## Запуск

```bash
python webhook_proxy.py
```

Сервер запустится и выведет в консоль адрес для настройки вебхука.

---

## Настройка в Мобилон

В личном кабинете Мобилон укажи URL вебхука:

```
http://<ВАШ_БЕЛЫЙ_IP>:5173/webhook
```

Метод: **POST** или **GET** — сервер принимает оба.

---

## Что происходит при звонке

1. Мобилон делает HTTP запрос на `http://твой_ip:5173/...`
2. Прокси логирует входящие данные в консоль
3. Прокси пересылает запрос в облачную функцию
4. Облачная функция сохраняет звонок в базу данных
5. Прокси отвечает Мобилону `200 ok`

---

## Логи

В консоли будет видно каждый входящий вебхук:

```
[WEBHOOK POST] path=/webhook body={"from":"79001234567","to":"101","state":"HANGUP",...}
[CLOUD RESPONSE] status=200 body=ok
```

---

## Автозапуск (Linux systemd)

Создай файл `/etc/systemd/system/mobilon-proxy.service`:

```ini
[Unit]
Description=Mobilon Webhook Proxy
After=network.target

[Service]
ExecStart=/usr/bin/python3 /путь/к/проекту/webhook_proxy.py
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Затем:
```bash
sudo systemctl daemon-reload
sudo systemctl enable mobilon-proxy
sudo systemctl start mobilon-proxy
```

---

## Автозапуск (Windows)

Создай файл `start_proxy.bat`:
```bat
@echo off
python webhook_proxy.py
pause
```

Или добавь в Планировщик задач Windows для автозапуска при входе в систему.

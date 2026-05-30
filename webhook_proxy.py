"""
Локальный прокси-сервер для вебхуков Мобилон ВАТС.

Принимает входящие вебхуки от Мобилон на порту 5173,
пересылает их в облачную функцию poehali.dev.

Запуск:
    python webhook_proxy.py

Адрес для настройки вебхука в Мобилон:
    http://<ВАШ_БЕЛЫЙ_IP>:5173/webhook
"""

import json
import urllib.request
import urllib.error
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

CLOUD_FUNCTION_URL = "https://functions.poehali.dev/0389a6f3-a315-4f7b-ba16-8dc9c3abde73"

PORT = 5173


class WebhookHandler(BaseHTTPRequestHandler):

    def log_message(self, format, *args):
        print(f"[HTTP] {self.address_string()} - {format % args}")

    def send_ok(self):
        self.send_response(200)
        self.send_header("Content-Type", "text/plain")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(b"ok")

    def send_error_response(self, code, message):
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps({"error": message}).encode())

    def forward_to_cloud(self, method: str, path: str, query_string: str, body: bytes):
        """Пересылает запрос в облачную функцию и возвращает (status, body)."""
        url = CLOUD_FUNCTION_URL
        if query_string:
            url = f"{url}?{query_string}"

        headers = {
            "Content-Type": "application/json",
            "User-Agent": "MobilonWebhookProxy/1.0",
        }

        req = urllib.request.Request(
            url,
            data=body if body else None,
            headers=headers,
            method=method,
        )

        try:
            with urllib.request.urlopen(req, timeout=15) as r:
                response_body = r.read()
                return r.status, response_body
        except urllib.error.HTTPError as e:
            error_body = e.read()
            print(f"[CLOUD ERROR] HTTP {e.code}: {error_body.decode('utf-8', errors='replace')}")
            return e.code, error_body
        except Exception as e:
            print(f"[CLOUD ERROR] {e}")
            return 502, json.dumps({"error": str(e)}).encode()

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        query_string = parsed.query

        # Парсим query-параметры для логирования
        params = parse_qs(query_string, keep_blank_values=True)
        flat_params = {k: v[0] if len(v) == 1 else v for k, v in params.items()}

        print(f"[WEBHOOK GET] path={parsed.path} params={json.dumps(flat_params, ensure_ascii=False)}")

        status, response_body = self.forward_to_cloud("GET", parsed.path, query_string, None)

        print(f"[CLOUD RESPONSE] status={status} body={response_body[:200].decode('utf-8', errors='replace')}")

        self.send_response(200)  # Всегда отвечаем 200 Мобилону
        self.send_header("Content-Type", "text/plain")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(b"ok")

    def do_POST(self):
        parsed = urlparse(self.path)
        query_string = parsed.query

        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length) if content_length > 0 else b""

        # Логируем входящий вебхук
        try:
            body_json = json.loads(body) if body else {}
            print(f"[WEBHOOK POST] path={parsed.path} body={json.dumps(body_json, ensure_ascii=False)}")
        except Exception:
            print(f"[WEBHOOK POST] path={parsed.path} raw_body={body[:500]}")

        status, response_body = self.forward_to_cloud("POST", parsed.path, query_string, body)

        print(f"[CLOUD RESPONSE] status={status} body={response_body[:200].decode('utf-8', errors='replace')}")

        self.send_response(200)  # Всегда отвечаем 200 Мобилону
        self.send_header("Content-Type", "text/plain")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(b"ok")


def main():
    server = HTTPServer(("0.0.0.0", PORT), WebhookHandler)
    print(f"")
    print(f"  Мобилон Webhook Proxy запущен")
    print(f"  Слушаю: http://0.0.0.0:{PORT}")
    print(f"  Проксирую в: {CLOUD_FUNCTION_URL}")
    print(f"")
    print(f"  Укажи в настройках Мобилон:")
    print(f"  URL вебхука: http://<ВАШ_БЕЛЫЙ_IP>:{PORT}/webhook")
    print(f"")
    print(f"  Нажми Ctrl+C для остановки")
    print(f"")

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n  Остановлен.")
        server.server_close()


if __name__ == "__main__":
    main()

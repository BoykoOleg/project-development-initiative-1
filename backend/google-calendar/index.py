"""
Интеграция с Google Calendar: получение событий, создание и удаление записей.
"""
import json
import os
import time
import base64
import hmac
import hashlib
import urllib.request
import urllib.parse
from datetime import datetime, timezone, timedelta


SCOPES = "https://www.googleapis.com/auth/calendar"


def _make_jwt(client_email: str, private_key_pem: str) -> str:
    now = int(time.time())
    header = base64.urlsafe_b64encode(json.dumps({"alg": "RS256", "typ": "JWT"}).encode()).rstrip(b"=").decode()
    payload = base64.urlsafe_b64encode(json.dumps({
        "iss": client_email,
        "scope": SCOPES,
        "aud": "https://oauth2.googleapis.com/token",
        "iat": now,
        "exp": now + 3600,
    }).encode()).rstrip(b"=").decode()
    signing_input = f"{header}.{payload}"

    from cryptography.hazmat.primitives import hashes, serialization
    from cryptography.hazmat.primitives.asymmetric import padding

    key = serialization.load_pem_private_key(private_key_pem.encode(), password=None)
    signature = key.sign(signing_input.encode(), padding.PKCS1v15(), hashes.SHA256())
    sig_b64 = base64.urlsafe_b64encode(signature).rstrip(b"=").decode()
    return f"{signing_input}.{sig_b64}"


def _normalize_pem(raw: str) -> str:
    """Восстанавливает корректный PEM-формат из строки где переносы могут быть экранированы."""
    key = raw.replace("\\n", "\n")
    # Если ключ — одна длинная строка без переносов внутри тела
    if "\n" not in key:
        # Вставляем переносы вручную
        key = key.replace("-----BEGIN PRIVATE KEY-----", "-----BEGIN PRIVATE KEY-----\n")
        key = key.replace("-----END PRIVATE KEY-----", "\n-----END PRIVATE KEY-----\n")
    # Убедимся что в конце есть перенос
    if not key.endswith("\n"):
        key += "\n"
    return key


def _get_access_token() -> str:
    client_email = os.environ["GOOGLE_CALENDAR_CLIENT_EMAIL"]
    raw_key = os.environ["GOOGLE_CALENDAR_PRIVATE_KEY"]
    private_key = _normalize_pem(raw_key)
    jwt = _make_jwt(client_email, private_key)

    data = urllib.parse.urlencode({
        "grant_type": "urn:ietf:params:oauth:grant-type:jwt-bearer",
        "assertion": jwt,
    }).encode()
    req = urllib.request.Request(
        "https://oauth2.googleapis.com/token",
        data=data,
        method="POST",
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    with urllib.request.urlopen(req) as resp:
        result = json.loads(resp.read())
    return result["access_token"]


def _calendar_request(method: str, path: str, body=None, token: str = None) -> dict:
    if token is None:
        token = _get_access_token()
    calendar_id = urllib.parse.quote(os.environ["GOOGLE_CALENDAR_ID"], safe="")
    url = f"https://www.googleapis.com/calendar/v3/calendars/{calendar_id}{path}"
    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(
        url,
        data=data,
        method=method,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        error_body = e.read().decode()
        raise Exception(f"Google API error {e.code}: {error_body}")


def _cors_headers():
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-User-Id, X-Auth-Token",
    }


def handler(event: dict, context) -> dict:
    """Обработка запросов к Google Calendar API."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": _cors_headers(), "body": ""}

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}
    action = params.get("action", "")

    try:
        token = _get_access_token()

        if method == "GET" and action == "events":
            # Получить события на заданный период
            tz_offset = "+03:00"
            date_str = params.get("date")
            if date_str:
                dt = datetime.fromisoformat(date_str)
            else:
                dt = datetime.now(timezone(timedelta(hours=3)))

            time_min = dt.replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
            time_max = dt.replace(hour=23, minute=59, second=59, microsecond=0).isoformat()

            # Убедимся что есть таймзона
            if "+" not in time_min and "Z" not in time_min:
                time_min += tz_offset
                time_max += tz_offset

            qs = urllib.parse.urlencode({
                "timeMin": time_min,
                "timeMax": time_max,
                "singleEvents": "true",
                "orderBy": "startTime",
                "maxResults": "50",
            })
            calendar_id = urllib.parse.quote(os.environ["GOOGLE_CALENDAR_ID"], safe="")
            url = f"https://www.googleapis.com/calendar/v3/calendars/{calendar_id}/events?{qs}"
            req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}"})
            with urllib.request.urlopen(req) as resp:
                data = json.loads(resp.read())

            events = []
            for item in data.get("items", []):
                start = item.get("start", {})
                end = item.get("end", {})
                events.append({
                    "id": item.get("id"),
                    "summary": item.get("summary", "Без названия"),
                    "description": item.get("description", ""),
                    "start": start.get("dateTime") or start.get("date"),
                    "end": end.get("dateTime") or end.get("date"),
                    "color": item.get("colorId"),
                    "html_link": item.get("htmlLink"),
                })
            return {
                "statusCode": 200,
                "headers": {**_cors_headers(), "Content-Type": "application/json"},
                "body": json.dumps({"events": events, "date": date_str or dt.date().isoformat()}),
            }

        elif method == "GET" and action == "week":
            # События на неделю
            tz_offset = "+03:00"
            date_str = params.get("date")
            if date_str:
                dt = datetime.fromisoformat(date_str)
            else:
                dt = datetime.now(timezone(timedelta(hours=3)))

            # Начало недели (понедельник)
            weekday = dt.weekday()
            week_start = dt - timedelta(days=weekday)
            week_end = week_start + timedelta(days=6)

            time_min = week_start.replace(hour=0, minute=0, second=0).isoformat()
            time_max = week_end.replace(hour=23, minute=59, second=59).isoformat()
            if "+" not in time_min and "Z" not in time_min:
                time_min += tz_offset
                time_max += tz_offset

            qs = urllib.parse.urlencode({
                "timeMin": time_min,
                "timeMax": time_max,
                "singleEvents": "true",
                "orderBy": "startTime",
                "maxResults": "200",
            })
            calendar_id = urllib.parse.quote(os.environ["GOOGLE_CALENDAR_ID"], safe="")
            url = f"https://www.googleapis.com/calendar/v3/calendars/{calendar_id}/events?{qs}"
            req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}"})
            with urllib.request.urlopen(req) as resp:
                data = json.loads(resp.read())

            events = []
            for item in data.get("items", []):
                start = item.get("start", {})
                end = item.get("end", {})
                events.append({
                    "id": item.get("id"),
                    "summary": item.get("summary", "Без названия"),
                    "description": item.get("description", ""),
                    "start": start.get("dateTime") or start.get("date"),
                    "end": end.get("dateTime") or end.get("date"),
                    "color": item.get("colorId"),
                    "html_link": item.get("htmlLink"),
                })
            return {
                "statusCode": 200,
                "headers": {**_cors_headers(), "Content-Type": "application/json"},
                "body": json.dumps({"events": events}),
            }

        elif method == "POST":
            body = json.loads(event.get("body") or "{}")
            # Создать событие
            summary = body.get("summary", "Запись")
            description = body.get("description", "")
            start_dt = body.get("start")  # ISO строка
            end_dt = body.get("end")      # ISO строка

            if not start_dt or not end_dt:
                return {
                    "statusCode": 400,
                    "headers": {**_cors_headers(), "Content-Type": "application/json"},
                    "body": json.dumps({"error": "start и end обязательны"}),
                }

            event_body = {
                "summary": summary,
                "description": description,
                "start": {"dateTime": start_dt, "timeZone": "Europe/Moscow"},
                "end": {"dateTime": end_dt, "timeZone": "Europe/Moscow"},
            }
            calendar_id = urllib.parse.quote(os.environ["GOOGLE_CALENDAR_ID"], safe="")
            url = f"https://www.googleapis.com/calendar/v3/calendars/{calendar_id}/events"
            data_bytes = json.dumps(event_body).encode()
            req = urllib.request.Request(
                url, data=data_bytes, method="POST",
                headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
            )
            with urllib.request.urlopen(req) as resp:
                created = json.loads(resp.read())

            return {
                "statusCode": 200,
                "headers": {**_cors_headers(), "Content-Type": "application/json"},
                "body": json.dumps({"id": created.get("id"), "html_link": created.get("htmlLink")}),
            }

        elif method == "DELETE":
            event_id = params.get("event_id")
            if not event_id:
                return {
                    "statusCode": 400,
                    "headers": {**_cors_headers(), "Content-Type": "application/json"},
                    "body": json.dumps({"error": "event_id обязателен"}),
                }
            calendar_id = urllib.parse.quote(os.environ["GOOGLE_CALENDAR_ID"], safe="")
            url = f"https://www.googleapis.com/calendar/v3/calendars/{calendar_id}/events/{event_id}"
            req = urllib.request.Request(url, method="DELETE",
                                         headers={"Authorization": f"Bearer {token}"})
            with urllib.request.urlopen(req) as resp:
                resp.read()
            return {
                "statusCode": 200,
                "headers": {**_cors_headers(), "Content-Type": "application/json"},
                "body": json.dumps({"ok": True}),
            }

        else:
            return {
                "statusCode": 400,
                "headers": {**_cors_headers(), "Content-Type": "application/json"},
                "body": json.dumps({"error": "Неизвестный action"}),
            }

    except Exception as e:
        return {
            "statusCode": 500,
            "headers": {**_cors_headers(), "Content-Type": "application/json"},
            "body": json.dumps({"error": str(e)}),
        }
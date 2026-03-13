"""
Аутентификация и управление пользователями.
POST /?action=init-admin      — создать admin-аккаунт если нет
POST /?action=login            — вход (email + password) → token
POST /?action=logout           — выход
GET  /?action=me               — данные текущего пользователя
GET  /?action=list-users       — список всех пользователей (admin)
POST /?action=create-user      — создать пользователя (admin)
POST /?action=set-password     — сменить пароль пользователю (admin)
POST /?action=toggle-active    — активировать/деактивировать (admin)
POST /?action=update-user      — изменить имя/роль (admin)
"""
import json
import os
import secrets
import hashlib
import psycopg2
from datetime import datetime, timedelta

HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token",
    "Content-Type": "application/json",
}

SALT = "autoserv_salt_2024"


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def hash_password(password: str) -> str:
    return hashlib.sha256((password + SALT).encode()).hexdigest()


def generate_token() -> str:
    return secrets.token_hex(32)


def get_token(event: dict) -> str:
    h = event.get("headers") or {}
    return h.get("X-Auth-Token") or h.get("x-auth-token") or ""


def get_current_user(cur, token: str):
    if not token:
        return None
    cur.execute(
        """SELECT u.id, u.email, u.name, u.role
           FROM app_sessions s
           JOIN app_users u ON u.id = s.user_id
           WHERE s.token = %s AND s.expires_at > NOW() AND u.is_active = TRUE""",
        (token,)
    )
    row = cur.fetchone()
    if not row:
        return None
    return {"id": row[0], "email": row[1], "name": row[2], "role": row[3]}


def require_admin(cur, token: str):
    user = get_current_user(cur, token)
    if not user:
        return None, {"statusCode": 401, "headers": HEADERS, "body": json.dumps({"error": "Не авторизован"})}
    if user["role"] != "admin":
        return None, {"statusCode": 403, "headers": HEADERS, "body": json.dumps({"error": "Только для администратора"})}
    return user, None


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": HEADERS, "body": ""}

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}
    action = params.get("action", "")
    token = get_token(event)

    conn = get_conn()
    cur = conn.cursor()

    try:
        # ── Init admin ────────────────────────────────────────────────────
        if action == "init-admin" and method == "POST":
            body = json.loads(event.get("body") or "{}")
            email = body.get("email", "BoykoOleg2011@mail.ru")
            password = body.get("password", "AutoServ#9X2k")
            name = body.get("name", "Администратор")

            cur.execute("SELECT id FROM app_users WHERE LOWER(email) = %s", (email.lower(),))
            if cur.fetchone():
                return {"statusCode": 200, "headers": HEADERS,
                        "body": json.dumps({"ok": True, "message": "Admin already exists"})}

            ph = hash_password(password)
            cur.execute(
                "INSERT INTO app_users (email, password_hash, name, role, is_active) VALUES (%s, %s, %s, 'admin', TRUE)",
                (email, ph, name)
            )
            conn.commit()
            return {"statusCode": 200, "headers": HEADERS,
                    "body": json.dumps({"ok": True, "message": "Admin created"})}

        # ── Login ─────────────────────────────────────────────────────────
        if action == "login" and method == "POST":
            body = json.loads(event.get("body") or "{}")
            email = (body.get("email") or "").strip().lower()
            password = body.get("password") or ""

            if not email or not password:
                return {"statusCode": 400, "headers": HEADERS,
                        "body": json.dumps({"error": "Email и пароль обязательны"})}

            ph = hash_password(password)
            cur.execute(
                "SELECT id, name, role, is_active FROM app_users WHERE LOWER(email) = %s AND password_hash = %s",
                (email, ph)
            )
            row = cur.fetchone()
            if not row:
                return {"statusCode": 401, "headers": HEADERS,
                        "body": json.dumps({"error": "Неверный email или пароль"})}

            user_id, name, role, is_active = row
            if not is_active:
                return {"statusCode": 403, "headers": HEADERS,
                        "body": json.dumps({"error": "Аккаунт не активирован. Обратитесь к администратору"})}

            t = generate_token()
            expires = datetime.now() + timedelta(days=30)
            cur.execute(
                "INSERT INTO app_sessions (user_id, token, expires_at) VALUES (%s, %s, %s)",
                (user_id, t, expires)
            )
            conn.commit()

            return {"statusCode": 200, "headers": HEADERS,
                    "body": json.dumps({
                        "ok": True, "token": t,
                        "user": {"id": user_id, "email": email, "name": name, "role": role}
                    })}

        # ── Logout ────────────────────────────────────────────────────────
        if action == "logout" and method == "POST":
            if token:
                cur.execute("UPDATE app_sessions SET expires_at = NOW() WHERE token = %s", (token,))
                conn.commit()
            return {"statusCode": 200, "headers": HEADERS, "body": json.dumps({"ok": True})}

        # ── Me ────────────────────────────────────────────────────────────
        if action == "me" and method == "GET":
            user = get_current_user(cur, token)
            if not user:
                return {"statusCode": 401, "headers": HEADERS, "body": json.dumps({"error": "Сессия истекла"})}
            return {"statusCode": 200, "headers": HEADERS, "body": json.dumps(user)}

        # ── List users (admin) ────────────────────────────────────────────
        if action == "list-users" and method == "GET":
            _, err = require_admin(cur, token)
            if err:
                return err
            cur.execute(
                "SELECT id, email, name, role, is_active, created_at FROM app_users ORDER BY created_at"
            )
            rows = cur.fetchall()
            users = [
                {"id": r[0], "email": r[1], "name": r[2], "role": r[3],
                 "is_active": r[4], "created_at": r[5].isoformat() if r[5] else None}
                for r in rows
            ]
            return {"statusCode": 200, "headers": HEADERS, "body": json.dumps({"users": users})}

        # ── Create user (admin) ───────────────────────────────────────────
        if action == "create-user" and method == "POST":
            _, err = require_admin(cur, token)
            if err:
                return err
            body = json.loads(event.get("body") or "{}")
            email = (body.get("email") or "").strip().lower()
            name = (body.get("name") or "").strip()
            password = body.get("password") or ""
            role = body.get("role", "employee")
            is_active = bool(body.get("is_active", False))

            if not email or not password:
                return {"statusCode": 400, "headers": HEADERS,
                        "body": json.dumps({"error": "Email и пароль обязательны"})}

            cur.execute("SELECT id FROM app_users WHERE LOWER(email) = %s", (email,))
            if cur.fetchone():
                return {"statusCode": 400, "headers": HEADERS,
                        "body": json.dumps({"error": "Пользователь с таким email уже существует"})}

            ph = hash_password(password)
            cur.execute(
                "INSERT INTO app_users (email, password_hash, name, role, is_active) VALUES (%s, %s, %s, %s, %s) RETURNING id",
                (email, ph, name, role, is_active)
            )
            new_id = cur.fetchone()[0]
            conn.commit()
            return {"statusCode": 200, "headers": HEADERS, "body": json.dumps({"ok": True, "id": new_id})}

        # ── Set password (admin) ──────────────────────────────────────────
        if action == "set-password" and method == "POST":
            _, err = require_admin(cur, token)
            if err:
                return err
            body = json.loads(event.get("body") or "{}")
            target_id = body.get("id")
            password = body.get("password") or ""

            if not target_id or not password:
                return {"statusCode": 400, "headers": HEADERS,
                        "body": json.dumps({"error": "id и password обязательны"})}
            if len(password) < 6:
                return {"statusCode": 400, "headers": HEADERS,
                        "body": json.dumps({"error": "Пароль не менее 6 символов"})}

            ph = hash_password(password)
            cur.execute(
                "UPDATE app_users SET password_hash = %s, updated_at = NOW() WHERE id = %s",
                (ph, target_id)
            )
            conn.commit()
            return {"statusCode": 200, "headers": HEADERS, "body": json.dumps({"ok": True})}

        # ── Toggle active (admin) ─────────────────────────────────────────
        if action == "toggle-active" and method == "POST":
            _, err = require_admin(cur, token)
            if err:
                return err
            body = json.loads(event.get("body") or "{}")
            target_id = body.get("id")
            is_active = bool(body.get("is_active"))

            if not target_id:
                return {"statusCode": 400, "headers": HEADERS, "body": json.dumps({"error": "id обязателен"})}

            cur.execute(
                "UPDATE app_users SET is_active = %s, updated_at = NOW() WHERE id = %s",
                (is_active, target_id)
            )
            conn.commit()
            return {"statusCode": 200, "headers": HEADERS, "body": json.dumps({"ok": True})}

        # ── Update user name/role (admin) ─────────────────────────────────
        if action == "update-user" and method == "POST":
            _, err = require_admin(cur, token)
            if err:
                return err
            body = json.loads(event.get("body") or "{}")
            target_id = body.get("id")
            name = body.get("name")
            role = body.get("role")

            if not target_id:
                return {"statusCode": 400, "headers": HEADERS, "body": json.dumps({"error": "id обязателен"})}

            cur.execute(
                "UPDATE app_users SET name = COALESCE(%s, name), role = COALESCE(%s, role), updated_at = NOW() WHERE id = %s",
                (name, role, target_id)
            )
            conn.commit()
            return {"statusCode": 200, "headers": HEADERS, "body": json.dumps({"ok": True})}

        return {"statusCode": 400, "headers": HEADERS, "body": json.dumps({"error": "Неизвестный action"})}

    finally:
        cur.close()
        conn.close()

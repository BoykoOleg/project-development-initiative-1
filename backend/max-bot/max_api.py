import requests

MAX_API = "https://platform-api.max.ru"


def send_to_user(token: str, user_id, text: str):
    try:
        r = requests.post(
            f"{MAX_API}/messages",
            params={"user_id": str(user_id)},
            headers={"Authorization": token, "Content-Type": "application/json"},
            json={"text": text},
            timeout=10,
        )
        print(f"[MAX] send user_id={user_id} status={r.status_code}")
    except Exception as e:
        print(f"[MAX] send error: {e}")


def register_webhook(token: str, webhook_url: str) -> dict:
    try:
        r = requests.post(
            f"{MAX_API}/subscriptions",
            headers={"Authorization": token, "Content-Type": "application/json"},
            json={"url": webhook_url, "update_types": ["message_created", "bot_started"]},
            timeout=10,
        )
        return r.json()
    except Exception as e:
        return {"error": str(e)}


def unregister_webhook(token: str) -> dict:
    try:
        rg = requests.get(f"{MAX_API}/subscriptions", headers={"Authorization": token}, timeout=10)
        data = rg.json()
        subscriptions = data.get("subscriptions", [])
        results = []
        for sub in subscriptions:
            webhook_url = sub.get("url", "")
            if not webhook_url:
                continue
            rd = requests.delete(
                f"{MAX_API}/subscriptions?url={requests.utils.quote(webhook_url, safe='')}",
                headers={"Authorization": token},
                timeout=10,
            )
            results.append({"url": webhook_url, "status": rd.status_code})
        return {"subscriptions_found": len(subscriptions), "results": results}
    except Exception as e:
        return {"error": str(e)}


def get_webhook_info(token: str) -> dict:
    try:
        r = requests.get(f"{MAX_API}/subscriptions", headers={"Authorization": token}, timeout=10)
        return r.json()
    except Exception as e:
        return {"error": str(e)}

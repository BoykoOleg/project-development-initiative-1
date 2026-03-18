"""
Поиск запчастей через API Berg.ru по каталожному номеру.
Возвращает список предложений с ценами, наличием и сроками доставки.
"""

import json
import os
import requests

BERG_API_BASE = "https://api.berg.ru/ordering/get_stock.json"

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
}


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    api_key = os.environ.get("BERG_API_KEY", "")
    if not api_key:
        return {
            "statusCode": 500,
            "headers": CORS_HEADERS,
            "body": json.dumps({"error": "BERG_API_KEY не настроен"}),
        }

    params = event.get("queryStringParameters") or {}
    article = (params.get("article") or "").strip().replace(" ", "").upper()

    if not article:
        return {
            "statusCode": 400,
            "headers": CORS_HEADERS,
            "body": json.dumps({"error": "Укажите каталожный номер (параметр article)"}),
        }

    print(f"[BERG] search article={article!r}")

    try:
        resp = requests.get(
            BERG_API_BASE,
            params={
                "key": api_key,
                "items[0][resource_article]": article,
                "items[0][brand_name]": "",
                "show_offers_with_posit_balance": 1,
            },
            timeout=15,
        )
        resp.raise_for_status()
        data = resp.json()
    except requests.exceptions.Timeout:
        return {
            "statusCode": 504,
            "headers": CORS_HEADERS,
            "body": json.dumps({"error": "Сервис Berg не отвечает, попробуйте позже"}),
        }
    except Exception as e:
        print(f"[BERG] error: {e}")
        return {
            "statusCode": 502,
            "headers": CORS_HEADERS,
            "body": json.dumps({"error": f"Ошибка запроса к Berg: {str(e)}"}),
        }

    resources = data.get("resources", [])
    result = []

    for resource in resources:
        for offer in resource.get("offers", []):
            warehouse = offer.get("warehouse", {})
            result.append({
                "brand": resource.get("brand", {}).get("name", ""),
                "article": resource.get("article", ""),
                "description": resource.get("name", "") or resource.get("description", ""),
                "price": float(offer.get("price", 0)),
                "quantity": offer.get("quantity", 0),
                "delivery_days": offer.get("average_period", None),
                "warehouse_name": warehouse.get("name", ""),
                "warehouse_type": warehouse.get("type", ""),
                "offer_id": str(offer.get("id", "")),
            })

    result.sort(key=lambda x: (x.get("delivery_days") or 999, x.get("price") or 0))

    print(f"[BERG] found {len(result)} offers for {article!r}")

    return {
        "statusCode": 200,
        "headers": CORS_HEADERS,
        "body": json.dumps({
            "article": article,
            "offers": result,
            "total": len(result),
        }),
    }
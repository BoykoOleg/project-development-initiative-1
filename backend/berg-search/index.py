"""
Поиск запчастей через API Berg.ru по каталожному номеру.
Возвращает все предложения: в наличии, под заказ и аналоги.
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


def fetch_offers(api_key, article, analogs=0):
    params = {
        "key": api_key,
        "items[0][resource_article]": article,
        "analogs": analogs,
    }
    resp = requests.get(BERG_API_BASE, params=params, timeout=20)
    # Berg возвращает 300 когда артикул неоднозначен с analogs=1 — это нормально
    if resp.status_code not in (200, 300):
        resp.raise_for_status()
    return resp.json()


def parse_resources(data, is_analog=False):
    result = []
    for resource in data.get("resources", []):
        for offer in resource.get("offers", []):
            warehouse = offer.get("warehouse", {})
            quantity = offer.get("quantity", 0)
            # average_period — срок до склада Берг, может быть None для заказных
            delivery_days = offer.get("average_period") or offer.get("assured_period")
            result.append({
                "brand": resource.get("brand", {}).get("name", ""),
                "article": resource.get("article", ""),
                "description": resource.get("name", "") or resource.get("description", ""),
                "price": float(offer.get("price", 0)),
                "quantity": quantity,
                "delivery_days": delivery_days,
                "in_stock": quantity > 0,
                "is_transit": bool(offer.get("is_transit", False)),
                "is_analog": is_analog,
                "warehouse_name": warehouse.get("name", ""),
                "warehouse_type": warehouse.get("type", ""),
                "offer_id": str(offer.get("id", "")),
            })
    return result


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
        # Запрос 1: точное совпадение без аналогов (все остатки включая заказные)
        data_main = fetch_offers(api_key, article, analogs=0)
        result = parse_resources(data_main, is_analog=False)

        # Запрос 2: с аналогами (только если нашли точный товар)
        # При 300 — артикул неоднозначен, аналоги не запрашиваем
        data_analogs = fetch_offers(api_key, article, analogs=1)
        analogs = parse_resources(data_analogs, is_analog=True)

        # Объединяем: сначала точные, потом аналоги; дедупликация по offer_id
        seen_ids = {o["offer_id"] for o in result}
        for a in analogs:
            if a["offer_id"] not in seen_ids:
                result.append(a)
                seen_ids.add(a["offer_id"])

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

    # Сортировка: сначала в наличии, потом по сроку, потом по цене
    result.sort(key=lambda x: (
        0 if x["in_stock"] else 1,
        x.get("delivery_days") or 999,
        x.get("price") or 0,
    ))

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

"""
Поиск запчастей через API Berg.ru по каталожному номеру.
Возвращает все предложения: в наличии, под заказ и аналоги.
При неоднозначном артикуле (300) делает уточняющие запросы по каждому resource_id.
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


def berg_get(api_key, params, timeout=8):
    resp = requests.get(BERG_API_BASE, params={"key": api_key, **params}, timeout=timeout)
    if resp.status_code == 401:
        raise Exception("Неверный API ключ Berg (401)")
    if resp.status_code not in (200, 300, 404):
        raise Exception(f"Berg вернул статус {resp.status_code}: {resp.text[:200]}")
    if resp.status_code == 404:
        print(f"[BERG] 404 not found, params={params}")
        return 404, {}
    try:
        data = resp.json()
        print(f"[BERG] response status={resp.status_code} keys={list(data.keys()) if isinstance(data, dict) else type(data)}")
        return resp.status_code, data if isinstance(data, dict) else {}
    except Exception:
        print(f"[BERG] failed to parse JSON: {resp.text[:300]}")
        return resp.status_code, {}


def parse_resources(data, is_analog=False):
    result = []
    if not data or not isinstance(data, dict):
        return result
    resources = data.get("resources") or []
    if not isinstance(resources, list):
        return result
    for resource in resources:
        for offer in (resource.get("offers") or []):
            warehouse = offer.get("warehouse") or {}
            quantity = offer.get("quantity", 0)
            delivery_days = offer.get("average_period") or offer.get("assured_period")
            result.append({
                "brand": (resource.get("brand") or {}).get("name", ""),
                "article": resource.get("article", ""),
                "description": resource.get("name", "") or resource.get("description", ""),
                "price": float(offer.get("price") or 0),
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


def fetch_by_article_brand(api_key, candidates, is_analog=False):
    """Запрашивает офферы по article+brand_id для каждого кандидата (по одному, без analogs)."""
    result = []
    for c in candidates:
        article = c.get("article", "")
        brand_id = (c.get("brand") or {}).get("id")
        if not article:
            continue
        params = {"analogs": 0}
        params["items[0][resource_article]"] = article
        if brand_id:
            params["items[0][brand_id]"] = brand_id
        status, data = berg_get(api_key, params)
        resources = data.get("resources") or []
        offers_total = sum(len(r.get("offers") or []) for r in resources)
        print(f"[BERG] by_art art={article} brand_id={brand_id} status={status} resources={len(resources)} offers={offers_total}")
        result.extend(parse_resources(data, is_analog=is_analog))
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
        result = []
        seen_ids = set()

        # Запрос 1: без аналогов
        status0, data0 = berg_get(api_key, {
            "items[0][resource_article]": article,
            "analogs": 0,
        })
        exact = parse_resources(data0, is_analog=False)
        print(f"[BERG] exact offers={len(exact)} ids={[o['offer_id'] for o in exact]}")
        for o in exact:
            key = o['offer_id'] or f"{o['brand']}_{o['article']}_{o['warehouse_name']}_{o['price']}"
            if key not in seen_ids:
                result.append(o)
                seen_ids.add(key)

        # Запрос 2: с аналогами
        status1, data1 = berg_get(api_key, {
            "items[0][resource_article]": article,
            "analogs": 1,
        })
        print(f"[BERG] analogs status={status1}")

        if status1 == 300:
            # Артикул неоднозначен — Berg вернул список товаров без офферов.
            # Берём resource_id каждого и запрашиваем офферы отдельно.
            candidates = (data1.get("resources") or [])[:5]
            print(f"[BERG] ambiguous — candidates={len(candidates)}")
            if candidates:
                by_art = fetch_by_article_brand(api_key, candidates, is_analog=True)
                print(f"[BERG] by_art total={len(by_art)} ids={[o['offer_id'] for o in by_art]} seen={seen_ids}")
                for o in by_art:
                    key = o['offer_id'] or f"{o['brand']}_{o['article']}_{o['warehouse_name']}_{o['price']}"
                    if key not in seen_ids:
                        result.append(o)
                        seen_ids.add(key)
                    else:
                        print(f"[BERG] SKIP duplicate key={key}")
        else:
            # Аналоги получены напрямую
            for o in parse_resources(data1, is_analog=True):
                key = o['offer_id'] or f"{o['brand']}_{o['article']}_{o['warehouse_name']}_{o['price']}"
                if key not in seen_ids:
                    result.append(o)
                    seen_ids.add(key)

    except requests.exceptions.Timeout:
        return {
            "statusCode": 504,
            "headers": CORS_HEADERS,
            "body": json.dumps({"error": "Сервис Berg не отвечает, попробуйте позже"}),
        }
    except Exception as e:
        import traceback
        print(f"[BERG] error: {e}\n{traceback.format_exc()}")
        return {
            "statusCode": 502,
            "headers": CORS_HEADERS,
            "body": json.dumps({"error": f"Ошибка запроса к Berg: {str(e)}"}),
        }

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
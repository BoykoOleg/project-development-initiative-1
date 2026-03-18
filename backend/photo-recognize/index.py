"""Распознавание документов/фото автомобиля или запчасти через OpenAI Vision для автозаполнения заявки"""
import json
import os
import base64
from openai import OpenAI

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token, X-Session-Id',
    'Access-Control-Max-Age': '86400',
}


def resp(code, body):
    return {
        'statusCode': code,
        'headers': {**CORS_HEADERS, 'Content-Type': 'application/json'},
        'body': json.dumps(body, default=str, ensure_ascii=False),
    }


CAR_SYSTEM_PROMPT = """Ты — ассистент автосервиса. Тебе присылают фотографию документа (ПТС, СТС, водительское удостоверение, страховой полис, заказ-наряд) или фотографию автомобиля.

Извлеки из фото максимум данных и верни СТРОГО в формате JSON (без markdown, без ```):
{
  "client_name": "ФИО владельца (Фамилия Имя Отчество)",
  "phone": "номер телефона если есть",
  "brand": "марка автомобиля",
  "model": "модель автомобиля",
  "year": "год выпуска",
  "vin": "VIN-номер (17 символов)",
  "gos_number": "государственный регистрационный номер",
  "comment": "дополнительная информация (цвет, тип кузова, номер двигателя и т.д.)"
}

Правила:
- Если поле не удаётся распознать — оставь пустую строку ""
- VIN — всегда ЗАГЛАВНЫМИ латинскими буквами, ровно 17 символов
- Госномер — в формате "А123БВ777" (буквы кириллицей)
- ФИО — в именительном падеже, с заглавной буквы каждое слово
- Год — только 4 цифры
- Телефон — в формате +7(XXX)XXX-XX-XX если найден
- Если на фото автомобиль без документов — определи марку/модель по внешнему виду, госномер если видно
- Верни ТОЛЬКО JSON, без пояснений"""

PART_SYSTEM_PROMPT = """Ты — эксперт по автозапчастям и автосервису. Тебе присылают фотографию одной детали или расходного материала.

Определи что это за деталь и верни СТРОГО в формате JSON (без markdown, без ```):
{
  "name": "полное название детали на русском языке",
  "sku": "артикул или каталожный номер если виден на фото или можно определить",
  "category": "категория: двигатель / тормозная система / подвеска / фильтры / масла / электрика / кузов / другое",
  "qty": 1,
  "comment": "дополнительная информация: бренд, маркировка, для каких автомобилей подходит"
}

Правила:
- name — конкретное название, например: "Фильтр масляный", "Тормозные колодки передние", "Свеча зажигания", "Ремень ГРМ"
- Если артикул/номер виден на фото — укажи в sku, иначе ""
- qty — всегда 1
- comment — бренд, маркировка, совместимые авто если можно определить
- Верни ТОЛЬКО JSON, без пояснений"""

PARTS_BULK_SYSTEM_PROMPT = """Ты — эксперт по автозапчастям и автосервису. Тебе присылают фотографию: это может быть список запчастей, прайс-лист, накладная, счёт, несколько деталей на столе или упаковки с запчастями.

Распознай ВСЕ видимые позиции и верни СТРОГО в формате JSON (без markdown, без ```):
{
  "parts": [
    {
      "name": "название детали на русском",
      "sku": "артикул если виден",
      "category": "категория",
      "qty": 1,
      "comment": "бренд, маркировка, примечание"
    }
  ]
}

Правила:
- Если на фото одна деталь — верни массив из одного элемента
- Если список/накладная/прайс — верни все строки как отдельные позиции
- name — конкретное, понятное название детали на русском
- qty — количество если явно указано, иначе 1
- sku — артикул/номер если виден, иначе ""
- Верни ТОЛЬКО JSON, без пояснений"""


RECEIPT_DOC_SYSTEM_PROMPT = """Ты — специалист по складскому учёту. Тебе присылают фотографию товарной накладной, УПД, счёта-фактуры, товарного чека или любого другого приходного документа.

Распознай ВСЕ товарные строки документа и верни СТРОГО в формате JSON (без markdown, без ```):
{
  "document_number": "номер документа если виден",
  "document_date": "дата в формате YYYY-MM-DD если видна",
  "supplier": "название поставщика если видно",
  "items": [
    {
      "name": "наименование товара",
      "sku": "артикул/код товара если виден",
      "quantity": 1,
      "price": 0,
      "unit": "шт"
    }
  ]
}

Правила:
- items — все строки с товарами из документа
- quantity — количество из документа, число (не строка)
- price — цена за единицу (не сумма строки!), число
- unit — единица измерения: шт, м, кг, л, компл и т.д.
- sku — артикул/код товара если виден в документе, иначе ""
- document_number — номер накладной/счёта, иначе ""
- document_date — дата в формате YYYY-MM-DD, иначе ""
- supplier — название поставщика/продавца, иначе ""
- Верни ТОЛЬКО JSON, без пояснений"""


def decode_image(image_base64):
    if image_base64.startswith('data:'):
        image_base64 = image_base64.split(',', 1)[1]
    raw = base64.b64decode(image_base64)
    mime = 'image/jpeg'
    if raw[:8] == b'\x89PNG\r\n\x1a\n':
        mime = 'image/png'
    elif raw[:4] == b'RIFF' and raw[8:12] == b'WEBP':
        mime = 'image/webp'
    return image_base64, raw, mime


def strip_markdown(text):
    text = text.strip()
    if text.startswith('```'):
        lines = text.split('\n')
        text = '\n'.join(lines[1:]) if len(lines) > 1 else text[3:]
        if text.endswith('```'):
            text = text[:-3]
    return text.strip()


def handler(event, context):
    """Распознавание фото документов/авто/запчастей через ИИ. mode: car | part | parts_bulk | receipt_doc"""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    if event.get('httpMethod') != 'POST':
        return resp(405, {'error': 'Method not allowed'})

    raw_body = event.get('body') or '{}'
    if event.get('isBase64Encoded'):
        raw_body = base64.b64decode(raw_body).decode('utf-8')

    try:
        body = json.loads(raw_body)
    except Exception as e:
        return resp(400, {'error': f'Невалидное тело запроса: {str(e)[:100]}'})

    mode = body.get('mode', 'car')
    image_base64 = body.get('image', '')
    print(f"[photo-recognize] mode={mode}, image_len={len(image_base64)}")

    if not image_base64:
        return resp(400, {'error': 'Поле image (base64) обязательно'})

    try:
        image_base64, raw, mime = decode_image(image_base64)
    except Exception:
        return resp(400, {'error': 'Невалидный base64'})

    if len(raw) > 20 * 1024 * 1024:
        return resp(400, {'error': 'Файл слишком большой (макс. 20 МБ)'})

    data_url = f"data:{mime};base64,{image_base64}"
    client = OpenAI(api_key=os.environ['OPENAI_API_KEY'], base_url="https://api.laozhang.ai/v1")

    if mode == 'receipt_doc':
        system_prompt = RECEIPT_DOC_SYSTEM_PROMPT
        user_text = "Распознай все строки товаров из этого документа (накладная, УПД, счёт и т.д.):"
        detail = "high"
        max_tokens = 2000
    elif mode == 'parts_bulk':
        system_prompt = PARTS_BULK_SYSTEM_PROMPT
        user_text = "Распознай все позиции/детали на этом фото:"
        detail = "high"
        max_tokens = 1500
    elif mode == 'part':
        system_prompt = PART_SYSTEM_PROMPT
        user_text = "Определи что это за деталь/запчасть:"
        detail = "high"
        max_tokens = 600
    else:
        system_prompt = CAR_SYSTEM_PROMPT
        user_text = "Распознай данные с этого фото для заполнения заявки автосервиса:"
        detail = "low"
        max_tokens = 600

    try:
        completion = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": [
                    {"type": "text", "text": user_text},
                    {"type": "image_url", "image_url": {"url": data_url, "detail": detail}},
                ]},
            ],
            max_tokens=max_tokens,
            temperature=0.1,
        )
    except Exception as e:
        print(f"[photo-recognize] OpenAI error: {e}")
        return resp(500, {'error': f'Ошибка вызова ИИ: {str(e)[:200]}'})

    answer = strip_markdown(completion.choices[0].message.content or '')
    print(f"[photo-recognize] answer: {answer[:400]}")

    try:
        parsed = json.loads(answer)
    except json.JSONDecodeError:
        return resp(500, {'error': f'ИИ вернул невалидный ответ: {answer[:100]}'})

    if mode == 'receipt_doc':
        raw_items = parsed.get('items', [])
        if not isinstance(raw_items, list):
            raw_items = []
        items = []
        for it in raw_items:
            if not isinstance(it, dict):
                continue
            name = str(it.get('name', '')).strip()
            if not name:
                continue
            try:
                qty = float(str(it.get('quantity', 1)).replace(',', '.'))
            except Exception:
                qty = 1.0
            try:
                price = float(str(it.get('price', 0)).replace(',', '.').replace(' ', ''))
            except Exception:
                price = 0.0
            items.append({
                'name': name,
                'sku': str(it.get('sku', '')).strip(),
                'quantity': qty,
                'price': price,
                'unit': str(it.get('unit', 'шт')).strip() or 'шт',
            })
        result = {
            'document_number': str(parsed.get('document_number', '')).strip(),
            'document_date': str(parsed.get('document_date', '')).strip(),
            'supplier': str(parsed.get('supplier', '')).strip(),
            'items': items,
        }
        print(f"[photo-recognize] receipt_doc: {len(items)} items, doc={result['document_number']}")
        return resp(200, {'receipt': result})

    elif mode == 'parts_bulk':
        raw_parts = parsed.get('parts', [])
        if not isinstance(raw_parts, list):
            raw_parts = [raw_parts]
        parts = []
        for p in raw_parts:
            if not isinstance(p, dict):
                continue
            name = str(p.get('name', '')).strip()
            if not name:
                continue
            parts.append({
                'name': name,
                'sku': str(p.get('sku', '')).strip(),
                'category': str(p.get('category', '')).strip(),
                'qty': int(p.get('qty', 1)) if str(p.get('qty', 1)).isdigit() else 1,
                'comment': str(p.get('comment', '')).strip(),
            })
        print(f"[photo-recognize] bulk result: {len(parts)} parts")
        return resp(200, {'parts': parts})

    elif mode == 'part':
        result = {
            'name': str(parsed.get('name', '')).strip(),
            'sku': str(parsed.get('sku', '')).strip(),
            'category': str(parsed.get('category', '')).strip(),
            'qty': int(parsed.get('qty', 1)),
            'comment': str(parsed.get('comment', '')).strip(),
        }
        return resp(200, {'part': result})

    else:
        fields = ['client_name', 'phone', 'brand', 'model', 'year', 'vin', 'gos_number', 'comment']
        result = {}
        for f in fields:
            val = parsed.get(f, '')
            result[f] = str(val).strip() if val else ''
        if result.get('vin'):
            result['vin'] = result['vin'].upper().replace(' ', '')[:17]
        return resp(200, {'recognized': result})
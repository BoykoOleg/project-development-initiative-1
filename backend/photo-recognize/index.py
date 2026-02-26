"""Распознавание документов/фото автомобиля через OpenAI Vision для автозаполнения заявки"""
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


SYSTEM_PROMPT = """Ты — ассистент автосервиса. Тебе присылают фотографию документа (ПТС, СТС, водительское удостоверение, страховой полис, заказ-наряд) или фотографию автомобиля.

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
- Госномер — в формате "А123БВ 777" (буквы кириллицей)
- ФИО — в именительном падеже, с заглавной буквы каждое слово
- Год — только 4 цифры
- Телефон — в формате +7 (XXX) XXX-XX-XX если найден
- Если на фото автомобиль без документов — определи марку/модель по внешнему виду, госномер если видно
- Верни ТОЛЬКО JSON, без пояснений"""


def handler(event, context):
    """Распознавание фото документов/авто через ИИ для автозаполнения заявки"""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    if event.get('httpMethod') != 'POST':
        return resp(405, {'error': 'Method not allowed'})

    raw_body = event.get('body') or '{}'
    body = json.loads(raw_body)
    image_base64 = body.get('image', '')

    if not image_base64:
        return resp(400, {'error': 'Поле image (base64) обязательно'})

    if image_base64.startswith('data:'):
        image_base64 = image_base64.split(',', 1)[1]

    try:
        raw = base64.b64decode(image_base64)
    except Exception:
        return resp(400, {'error': 'Невалидный base64'})

    if len(raw) > 20 * 1024 * 1024:
        return resp(400, {'error': 'Файл слишком большой (макс. 20 МБ)'})

    mime = 'image/jpeg'
    if raw[:8] == b'\x89PNG\r\n\x1a\n':
        mime = 'image/png'
    elif raw[:4] == b'RIFF' and raw[8:12] == b'WEBP':
        mime = 'image/webp'

    data_url = f"data:{mime};base64,{image_base64}"

    try:
        client = OpenAI(api_key=os.environ['OPENAI_API_KEY'])
    except Exception as e:
        return resp(500, {'error': f'Ошибка подключения к ИИ: {str(e)}'})

    try:
        completion = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": [
                    {"type": "text", "text": "Распознай данные с этого фото для заполнения заявки автосервиса:"},
                    {"type": "image_url", "image_url": {"url": data_url, "detail": "high"}},
                ]},
            ],
            max_tokens=1000,
            temperature=0.1,
        )
    except Exception as e:
        return resp(500, {'error': f'Ошибка вызова ИИ: {str(e)}'})

    answer = (completion.choices[0].message.content or '').strip()
    if not answer:
        return resp(500, {'error': 'ИИ вернул пустой ответ'})

    if answer.startswith('```'):
        answer = answer.split('\n', 1)[1] if '\n' in answer else answer[3:]
        if answer.endswith('```'):
            answer = answer[:-3]
        answer = answer.strip()

    try:
        parsed = json.loads(answer)
    except json.JSONDecodeError:
        return resp(500, {'error': 'ИИ вернул невалидный ответ, попробуйте другое фото'})

    fields = ['client_name', 'phone', 'brand', 'model', 'year', 'vin', 'gos_number', 'comment']
    result = {}
    for f in fields:
        val = parsed.get(f, '')
        result[f] = str(val).strip() if val else ''

    if result['vin']:
        result['vin'] = result['vin'].upper().replace(' ', '')[:17]

    return resp(200, {'recognized': result})
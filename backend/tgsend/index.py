"""Отправка заказ-наряда через Telegram"""
import json
import os
import psycopg2
import psycopg2.extras
import urllib.request

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token, X-Session-Id',
    'Access-Control-Max-Age': '86400',
}


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def ok(body):
    return {'statusCode': 200, 'headers': {**CORS, 'Content-Type': 'application/json'}, 'body': json.dumps(body, default=str, ensure_ascii=False)}


def err(code, msg):
    return {'statusCode': code, 'headers': {**CORS, 'Content-Type': 'application/json'}, 'body': json.dumps({'error': msg}, ensure_ascii=False)}


def price(n):
    return f"{int(n):,}".replace(",", " ") + " \u20bd"


def handler(event, context):
    """Отправка заказ-наряда клиенту через Telegram бот"""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    if event.get('httpMethod') != 'POST':
        return err(405, 'POST only')

    body = json.loads(event.get('body') or '{}')
    wo_id = body.get('work_order_id')
    chat_id = body.get('telegram_id', '').strip()

    if not wo_id:
        return err(400, 'work_order_id is required')
    if not chat_id:
        return err(400, 'telegram_id is required')

    token = os.environ.get('TELEGRAM_BOT_TOKEN', '')
    if not token:
        return err(500, 'TELEGRAM_BOT_TOKEN not configured')

    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute("SELECT * FROM work_orders WHERE id = %s", (wo_id,))
            wo = cur.fetchone()
            if not wo:
                return err(404, 'Not found')
            cur.execute("SELECT * FROM work_order_works WHERE work_order_id = %s ORDER BY id", (wo_id,))
            works = cur.fetchall()
            cur.execute("SELECT * FROM work_order_parts WHERE work_order_id = %s ORDER BY id", (wo_id,))
            parts = cur.fetchall()
    finally:
        conn.close()

    num = f"\u0417\u041d-{str(wo['id']).zfill(4)}"
    dt = wo['created_at'].strftime('%d.%m.%Y') if wo['created_at'] else ''
    lines = [f"\ud83d\udccb <b>\u0417\u0430\u043a\u0430\u0437-\u043d\u0430\u0440\u044f\u0434 {num}</b>", f"\ud83d\udcc5 {dt}", f"\ud83d\udc64 {wo['client_name']}", f"\ud83d\ude97 {wo['car_info'] or chr(8212)}", ""]

    wt = 0
    if works:
        lines.append("<b>\u0420\u0430\u0431\u043e\u0442\u044b:</b>")
        for i, w in enumerate(works):
            p = float(w['price'])
            wt += p
            lines.append(f"  {i+1}. {w['name']} \u2014 {price(p)}")
        lines.append(f"<b>\u0418\u0442\u043e\u0433\u043e: {price(wt)}</b>")
        lines.append("")

    pt = 0
    if parts:
        lines.append("<b>\u0417\u0430\u043f\u0447\u0430\u0441\u0442\u0438:</b>")
        for i, p in enumerate(parts):
            pr = float(p['sell_price'])
            q = p['qty']
            pt += pr * q
            lines.append(f"  {i+1}. {p['name']} x{q} \u2014 {price(pr * q)}")
        lines.append(f"<b>\u0418\u0442\u043e\u0433\u043e: {price(pt)}</b>")
        lines.append("")

    lines.append(f"\ud83d\udcb0 <b>\u0418\u0422\u041e\u0413\u041e: {price(wt + pt)}</b>")
    lines.append("")
    lines.append("<i>Smartline</i>")

    text = "\n".join(lines)
    payload = json.dumps({'chat_id': chat_id, 'text': text, 'parse_mode': 'HTML'}).encode()

    req = urllib.request.Request(
        f'https://api.telegram.org/bot{token}/sendMessage',
        data=payload, headers={'Content-Type': 'application/json'}, method='POST')

    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            res = json.loads(r.read().decode())
            if res.get('ok'):
                return ok({'success': True})
            return err(400, res.get('description', 'Error'))
    except urllib.error.HTTPError as e:
        b = e.read().decode()
        try:
            d = json.loads(b)
            return err(400, d.get('description', 'Telegram error'))
        except Exception:
            return err(400, f'HTTP {e.code}')
"""Временная функция для очистки тестовых данных (клиенты, машины, заявки, заказ-наряды)"""
import json
import os
import psycopg2

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
}

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 'public')

def t(name):
    return f'"{SCHEMA}".{name}'

def handler(event: dict, context) -> dict:
    """Очистка тестовых данных: клиенты, машины, заявки, заказ-наряды"""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    if event.get('httpMethod') != 'POST':
        return {'statusCode': 405, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Method not allowed'})}

    body = json.loads(event.get('body') or '{}')
    if body.get('confirm') != 'YES_CLEAR_ALL':
        return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Требуется подтверждение'})}

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()

    cur.execute(f"DELETE FROM {t('payments')}")
    cur.execute(f"DELETE FROM {t('expenses')}")
    cur.execute(f"DELETE FROM {t('work_order_parts')}")
    cur.execute(f"DELETE FROM {t('work_order_works')}")
    cur.execute(f"DELETE FROM {t('work_orders')}")
    cur.execute(f"DELETE FROM {t('orders')}")
    cur.execute(f"DELETE FROM {t('cars')}")
    cur.execute(f"DELETE FROM {t('clients')}")

    conn.commit()
    conn.close()

    return {
        'statusCode': 200,
        'headers': CORS_HEADERS,
        'body': json.dumps({'success': True, 'message': 'Данные очищены'})
    }
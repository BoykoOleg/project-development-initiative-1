"""Интеграция с банком Точка — счета, балансы, выписки"""
import json
import os
import urllib.request
import urllib.error
from datetime import datetime, timedelta

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token, X-Session-Id',
    'Access-Control-Max-Age': '86400',
}

TOCHKA_BASE = 'https://open-banking.tochka.com/v1.0'


def resp(status_code, body):
    return {
        'statusCode': status_code,
        'headers': {**CORS_HEADERS, 'Content-Type': 'application/json'},
        'body': json.dumps(body, default=str, ensure_ascii=False),
    }


def tochka_get(path, jwt_token):
    url = f'{TOCHKA_BASE}{path}'
    req = urllib.request.Request(url, headers={
        'Authorization': f'Bearer {jwt_token}',
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    })
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            return json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        raise RuntimeError(f'Точка API {e.code}: {body}')


def tochka_post(path, payload, jwt_token):
    url = f'{TOCHKA_BASE}{path}'
    data = json.dumps(payload).encode()
    req = urllib.request.Request(url, data=data, method='POST', headers={
        'Authorization': f'Bearer {jwt_token}',
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    })
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            return json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        raise RuntimeError(f'Точка API {e.code}: {body}')


def get_accounts(jwt_token):
    """Получить список счетов"""
    data = tochka_get('/accounts', jwt_token)
    accounts = data.get('Data', {}).get('Account', data.get('accounts', []))
    result = []
    for acc in accounts:
        result.append({
            'account_id': acc.get('AccountId') or acc.get('account_id') or acc.get('id'),
            'name': acc.get('Nickname') or acc.get('name') or acc.get('Description', ''),
            'currency': acc.get('Currency') or acc.get('currency', 'RUB'),
            'status': acc.get('Status') or acc.get('status', ''),
            'account_number': acc.get('Account', [{}])[0].get('Identification') if isinstance(acc.get('Account'), list) else acc.get('account_number', ''),
        })
    return result


def get_balance(account_id, jwt_token):
    """Получить баланс счёта"""
    data = tochka_get(f'/accounts/{account_id}/balances', jwt_token)
    balances = data.get('Data', {}).get('Balance', data.get('balances', []))
    result = []
    for b in balances:
        amount = b.get('Amount', {})
        result.append({
            'type': b.get('Type') or b.get('type', ''),
            'amount': float(amount.get('Amount', amount)) if isinstance(amount, dict) else float(b.get('amount', 0)),
            'currency': amount.get('Currency', 'RUB') if isinstance(amount, dict) else b.get('currency', 'RUB'),
            'credit_debit': b.get('CreditDebitIndicator') or b.get('credit_debit', ''),
        })
    return result


def init_statement(account_id, date_from, date_to, jwt_token):
    """Создать запрос выписки"""
    payload = {
        'Data': {
            'AccountId': account_id,
            'FromBookingDateTime': f'{date_from}T00:00:00Z',
            'ToBookingDateTime': f'{date_to}T23:59:59Z',
        }
    }
    data = tochka_post('/statements', payload, jwt_token)
    statement_id = (
        data.get('Data', {}).get('StatementId')
        or data.get('statement_id')
        or data.get('id')
    )
    return statement_id


def get_statement(account_id, statement_id, jwt_token):
    """Получить выписку по ID"""
    data = tochka_get(f'/accounts/{account_id}/statements/{statement_id}', jwt_token)
    transactions = (
        data.get('Data', {}).get('Transaction', [])
        or data.get('transactions', [])
    )
    result = []
    for tx in transactions:
        amount = tx.get('Amount', {})
        result.append({
            'tx_id': tx.get('TransactionId') or tx.get('id', ''),
            'date': tx.get('BookingDateTime') or tx.get('ValueDateTime') or tx.get('date', ''),
            'amount': float(amount.get('Amount', 0)) if isinstance(amount, dict) else float(tx.get('amount', 0)),
            'currency': amount.get('Currency', 'RUB') if isinstance(amount, dict) else tx.get('currency', 'RUB'),
            'credit_debit': tx.get('CreditDebitIndicator') or tx.get('credit_debit', ''),
            'description': (
                tx.get('TransactionInformation')
                or tx.get('description')
                or tx.get('comment', '')
            ),
            'counterparty': (
                tx.get('CreditorAccount', {}).get('Name', '')
                or tx.get('DebtorAccount', {}).get('Name', '')
                or tx.get('counterparty', '')
            ),
            'status': tx.get('Status') or tx.get('status', ''),
        })
    return result


def handler(event, context):
    """API интеграции с банком Точка: счета, балансы, выписки"""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    jwt_token = os.environ.get('TOCHKA_JWT_TOKEN', '')
    if not jwt_token:
        return resp(503, {'error': 'TOCHKA_JWT_TOKEN не настроен. Добавьте токен в секреты проекта.'})

    method = event.get('httpMethod', 'GET')
    params = event.get('queryStringParameters') or {}
    section = params.get('section', 'accounts')

    try:
        if method == 'GET':
            if section == 'accounts':
                accounts = get_accounts(jwt_token)
                return resp(200, {'accounts': accounts})

            elif section == 'balance':
                account_id = params.get('account_id')
                if not account_id:
                    return resp(400, {'error': 'account_id is required'})
                balances = get_balance(account_id, jwt_token)
                return resp(200, {'balances': balances})

            elif section == 'statement':
                account_id = params.get('account_id')
                statement_id = params.get('statement_id')
                if not account_id or not statement_id:
                    return resp(400, {'error': 'account_id and statement_id are required'})
                transactions = get_statement(account_id, statement_id, jwt_token)
                return resp(200, {'transactions': transactions})

            return resp(400, {'error': 'Unknown section'})

        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            action = body.get('action', '')

            if action == 'init_statement':
                account_id = body.get('account_id')
                date_from = body.get('date_from')
                date_to = body.get('date_to')
                if not account_id or not date_from or not date_to:
                    return resp(400, {'error': 'account_id, date_from, date_to are required'})
                statement_id = init_statement(account_id, date_from, date_to, jwt_token)
                return resp(200, {'statement_id': statement_id})

            return resp(400, {'error': 'Unknown action'})

        return resp(405, {'error': 'Method not allowed'})

    except RuntimeError as e:
        return resp(502, {'error': str(e)})
    except Exception as e:
        import traceback
        print(f'[tochka-bank] ERROR: {e}\n{traceback.format_exc()}')
        return resp(500, {'error': str(e)})

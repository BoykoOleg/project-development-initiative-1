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

TOCHKA_BASE = 'https://enter.tochka.com/uapi/open-banking/v1.0'


def resp(status_code, body):
    return {
        'statusCode': status_code,
        'headers': {**CORS_HEADERS, 'Content-Type': 'application/json'},
        'body': json.dumps(body, default=str, ensure_ascii=False),
    }


def tochka_get(path, jwt_token):
    url = f'{TOCHKA_BASE}{path}'
    print(f'[tochka] GET {url}')
    req = urllib.request.Request(url, headers={
        'Authorization': f'Bearer {jwt_token}',
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    })
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            raw = r.read().decode()
            print(f'[tochka] response {r.status}: {raw[:300]}')
            return json.loads(raw)
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        print(f'[tochka] HTTPError {e.code}: {body[:300]}')
        raise RuntimeError(f'Точка API {e.code}: {body}')


def tochka_post(path, payload, jwt_token):
    url = f'{TOCHKA_BASE}{path}'
    print(f'[tochka] POST {url} payload={json.dumps(payload)[:200]}')
    data = json.dumps(payload).encode()
    req = urllib.request.Request(url, data=data, method='POST', headers={
        'Authorization': f'Bearer {jwt_token}',
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    })
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            raw = r.read().decode()
            print(f'[tochka] response {r.status}: {raw[:300]}')
            return json.loads(raw)
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        print(f'[tochka] HTTPError {e.code}: {body[:300]}')
        raise RuntimeError(f'Точка API {e.code}: {body}')


def get_accounts(jwt_token):
    """Получить список счетов"""
    data = tochka_get('/accounts', jwt_token)
    print(f'[tochka] accounts raw keys: {list(data.keys())}')
    accounts = data.get('Data', {}).get('Account', data.get('accounts', []))
    result = []
    for acc in accounts:
        # accountId может быть "номерсчёта/БИК" — берём только номер счёта
        raw_id = acc.get('accountId') or acc.get('AccountId') or acc.get('id', '')
        account_number = raw_id.split('/')[0] if '/' in str(raw_id) else str(raw_id)

        # Название из accountDetails[].identification или nickname
        details = acc.get('accountDetails', acc.get('Account', []))
        identification = ''
        if isinstance(details, list) and details:
            identification = details[0].get('identification') or details[0].get('Identification', '')

        name = (
            acc.get('nickname') or acc.get('Nickname')
            or acc.get('name') or acc.get('description')
            or acc.get('accountSubType') or 'Расчётный счёт'
        )
        result.append({
            'account_id': raw_id,
            'name': name,
            'currency': acc.get('currency') or acc.get('Currency', 'RUB'),
            'status': acc.get('status') or acc.get('Status', ''),
            'account_number': identification or account_number,
        })
    return result


def get_balance(account_id, jwt_token):
    """Получить баланс счёта"""
    # account_id может содержать / — нужно URL-encode
    import urllib.parse
    encoded_id = urllib.parse.quote(account_id, safe='')
    data = tochka_get(f'/accounts/{encoded_id}/balances', jwt_token)
    print(f'[tochka] balance raw: {json.dumps(data)[:400]}')
    balances = data.get('Data', {}).get('Balance', data.get('balances', []))
    result = []
    for b in balances:
        # Точка возвращает camelCase: amount.amount, amount.currency
        amount_obj = b.get('amount') or b.get('Amount') or {}
        if isinstance(amount_obj, dict):
            amt = float(amount_obj.get('amount') or amount_obj.get('Amount') or 0)
            cur = amount_obj.get('currency') or amount_obj.get('Currency', 'RUB')
        else:
            amt = float(amount_obj or 0)
            cur = 'RUB'
        result.append({
            'type': b.get('type') or b.get('Type') or b.get('balanceType', ''),
            'amount': amt,
            'currency': cur,
            'credit_debit': b.get('creditDebitIndicator') or b.get('CreditDebitIndicator', ''),
        })
    return result


def init_statement(account_id, date_from, date_to, jwt_token):
    """Создать запрос выписки — API Точки требует обёртку Statement внутри Data"""
    payload = {
        'Data': {
            'Statement': {
                'accountId': account_id,
                'startDateTime': f'{date_from}T00:00:00+03:00',
                'endDateTime': f'{date_to}T00:00:00+03:00',
            }
        }
    }
    data = tochka_post('/statements', payload, jwt_token)
    print(f'[tochka] init_statement raw: {json.dumps(data)[:600]}')
    inner = data.get('Data', {})
    statement_id = (
        inner.get('Statement', {}).get('statementId')
        or inner.get('Statement', {}).get('StatementId')
        or inner.get('statementId')
        or inner.get('StatementId')
        or data.get('statementId')
        or data.get('id')
    )
    return statement_id


def get_statement(account_id, statement_id, jwt_token):
    """Получить выписку по ID"""
    import urllib.parse
    encoded_id = urllib.parse.quote(account_id, safe='')
    data = tochka_get(f'/accounts/{encoded_id}/statements/{statement_id}', jwt_token)
    print(f'[tochka] statement raw: {json.dumps(data)[:500]}')
    inner = data.get('Data', {})
    # Точка возвращает Data.Statement — массив, транзакции внутри первого элемента
    stmt_list = inner.get('Statement', [])
    if isinstance(stmt_list, list) and stmt_list:
        stmt_obj = stmt_list[0]
    elif isinstance(stmt_list, dict):
        stmt_obj = stmt_list
    else:
        stmt_obj = {}
    transactions = (
        stmt_obj.get('Transaction', [])
        or inner.get('Transaction', [])
        or inner.get('transaction', [])
        or data.get('transactions', [])
    )
    result = []
    for tx in transactions:
        amount_obj = tx.get('amount') or tx.get('Amount') or {}
        if isinstance(amount_obj, dict):
            amt = float(amount_obj.get('amount') or amount_obj.get('Amount') or 0)
            cur = amount_obj.get('currency') or amount_obj.get('Currency', 'RUB')
        else:
            amt = float(amount_obj or 0)
            cur = 'RUB'

        creditor = tx.get('creditorAccount') or tx.get('CreditorAccount') or {}
        debtor = tx.get('debtorAccount') or tx.get('DebtorAccount') or {}

        result.append({
            'tx_id': tx.get('transactionId') or tx.get('TransactionId') or tx.get('id', ''),
            'date': tx.get('bookingDateTime') or tx.get('BookingDateTime') or tx.get('valueDateTime') or tx.get('date', ''),
            'amount': amt,
            'currency': cur,
            'credit_debit': tx.get('creditDebitIndicator') or tx.get('CreditDebitIndicator', ''),
            'description': tx.get('transactionInformation') or tx.get('TransactionInformation') or tx.get('description', ''),
            'counterparty': (
                creditor.get('name') or creditor.get('Name')
                or debtor.get('name') or debtor.get('Name')
                or tx.get('counterparty', '')
            ),
            'status': tx.get('status') or tx.get('Status', ''),
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
"""Интеграция с банком Точка — счета, балансы, выписки"""
import json
import os
import time
import urllib.request
import urllib.error
import psycopg2
import psycopg2.extras

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
    """Создать запрос выписки"""
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
    print(f'[tochka] init_statement raw: {json.dumps(data)[:400]}')
    inner = data.get('Data', {})
    stmt = inner.get('Statement', {})
    if isinstance(stmt, list):
        stmt = stmt[0] if stmt else {}
    return stmt.get('statementId') or stmt.get('StatementId') or inner.get('statementId')


def fetch_statement_transactions(account_id, statement_id, jwt_token):
    """Получить выписку по ID, дождавшись статуса Ready"""
    import urllib.parse
    encoded_id = urllib.parse.quote(account_id, safe='')
    path = f'/accounts/{encoded_id}/statements/{statement_id}'

    # Ждём до 20 секунд пока статус станет Ready
    for attempt in range(8):
        data = tochka_get(path, jwt_token)
        inner = data.get('Data', {})
        stmt_list = inner.get('Statement', [])
        stmt_obj = stmt_list[0] if isinstance(stmt_list, list) and stmt_list else (stmt_list if isinstance(stmt_list, dict) else {})
        status = stmt_obj.get('status', '')
        print(f'[tochka] statement attempt={attempt} status={status}')
        if status == 'Ready':
            return data, stmt_obj
        if status in ('Failed', 'Error'):
            raise RuntimeError(f'Выписка завершилась с ошибкой: {status}')
        time.sleep(3)

    raise RuntimeError('Выписка не готова за отведённое время, попробуйте ещё раз')


def parse_tx(tx):
    """Распарсить одну транзакцию Точки в единый формат"""
    # Сумма — Точка кладёт в transactionAmount.amount
    amount_obj = tx.get('transactionAmount') or tx.get('amount') or tx.get('Amount') or {}
    if isinstance(amount_obj, dict):
        amt = float(amount_obj.get('amount') or amount_obj.get('Amount') or 0)
        cur = amount_obj.get('currency') or amount_obj.get('Currency', 'RUB')
    else:
        amt = float(amount_obj or 0)
        cur = 'RUB'

    credit_debit = tx.get('creditDebitIndicator') or tx.get('CreditDebitIndicator', '')

    # Контрагент: у Точки поля creditorName/debtorName или вложенные объекты
    creditor_name = (
        tx.get('creditorName') or tx.get('CreditorName')
        or (tx.get('creditorAccount') or {}).get('name', '')
        or (tx.get('creditorAccount') or {}).get('schemeName', '')
    )
    debtor_name = (
        tx.get('debtorName') or tx.get('DebtorName')
        or (tx.get('debtorAccount') or {}).get('name', '')
        or (tx.get('debtorAccount') or {}).get('schemeName', '')
    )
    # При списании (Debit) контрагент — получатель (creditor), при поступлении — плательщик (debtor)
    if credit_debit == 'Debit':
        counterparty = creditor_name or debtor_name
    else:
        counterparty = debtor_name or creditor_name

    # Описание: у Точки поле description или remittanceInformationUnstructured
    description = (
        tx.get('description')
        or tx.get('remittanceInformationUnstructured')
        or tx.get('transactionInformation')
        or tx.get('transactionTypeCode', '')
    )

    # Дата: documentProcessDate — основной у Точки, иначе bookingDate
    date = (
        tx.get('documentProcessDate')
        or tx.get('bookingDate')
        or tx.get('bookingDateTime', '')[:10]
        or tx.get('valueDate', '')
    )

    tx_id = tx.get('transactionId') or tx.get('TransactionId') or tx.get('id', '')

    return {
        'tx_id': tx_id,
        'date': date,
        'amount': amt,
        'currency': cur,
        'credit_debit': credit_debit,
        'description': description,
        'counterparty': counterparty,
        'status': tx.get('status') or tx.get('Status', ''),
    }


def get_statement(account_id, statement_id, jwt_token):
    """Получить транзакции выписки"""
    data, stmt_obj = fetch_statement_transactions(account_id, statement_id, jwt_token)
    print(f'[tochka] statement ready, keys: {list(stmt_obj.keys())}')
    transactions = stmt_obj.get('Transaction', [])
    if transactions:
        print(f'[tochka] TX[0] keys: {list(transactions[0].keys())}')
        print(f'[tochka] TX[0] full: {json.dumps(transactions[0], ensure_ascii=False)}')
        if len(transactions) > 1:
            print(f'[tochka] TX[1] full: {json.dumps(transactions[1], ensure_ascii=False)}')
    return [parse_tx(tx) for tx in transactions]


def import_to_finance(account_id, statement_id, cashbox_id, jwt_token):
    """Импортировать транзакции выписки в таблицы expenses/incomes, избегая дублей"""
    schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
    db_url = os.environ.get('DATABASE_URL', '')

    transactions = get_statement(account_id, statement_id, jwt_token)
    if not transactions:
        return {'imported': 0, 'skipped': 0, 'message': 'Нет транзакций для импорта'}

    conn = psycopg2.connect(db_url)
    conn.autocommit = False
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    imported = 0
    skipped = 0

    for tx in transactions:
        tx_id = tx['tx_id']
        if not tx_id:
            skipped += 1
            continue

        # Проверяем дубль
        cur.execute(
            f'SELECT id FROM {schema}.bank_transactions WHERE tx_id = %s',
            (tx_id,)
        )
        if cur.fetchone():
            skipped += 1
            continue

        amt = float(tx['amount'])
        if amt <= 0:
            skipped += 1
            continue

        comment = ''
        parts = []
        if tx.get('counterparty'):
            parts.append(tx['counterparty'])
        if tx.get('description'):
            parts.append(tx['description'])
        comment = ' | '.join(parts)

        tx_date = tx.get('date') or None

        expense_id = None
        income_id = None

        if tx['credit_debit'] == 'Debit':
            cur.execute(
                f"INSERT INTO {schema}.expenses (cashbox_id, amount, comment, created_at) "
                f"VALUES (%s, %s, %s, %s) RETURNING id",
                (cashbox_id, amt, comment, tx_date)
            )
            row = cur.fetchone()
            expense_id = row['id']
            cur.execute(
                f"UPDATE {schema}.cashboxes SET balance = balance - %s WHERE id = %s",
                (amt, cashbox_id)
            )
        else:
            cur.execute(
                f"INSERT INTO {schema}.incomes (cashbox_id, amount, income_type, comment, created_at) "
                f"VALUES (%s, %s, %s, %s, %s) RETURNING id",
                (cashbox_id, amt, 'bank', comment, tx_date)
            )
            row = cur.fetchone()
            income_id = row['id']
            cur.execute(
                f"UPDATE {schema}.cashboxes SET balance = balance + %s WHERE id = %s",
                (amt, cashbox_id)
            )

        cur.execute(
            f"INSERT INTO {schema}.bank_transactions "
            f"(tx_id, account_id, tx_date, amount, currency, credit_debit, description, counterparty, status, expense_id, income_id) "
            f"VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)",
            (tx_id, account_id, tx_date, amt, tx.get('currency', 'RUB'),
             tx['credit_debit'], tx.get('description', ''), tx.get('counterparty', ''),
             tx.get('status', ''), expense_id, income_id)
        )
        imported += 1

    conn.commit()
    cur.close()
    conn.close()

    print(f'[tochka] import_to_finance: imported={imported} skipped={skipped}')
    return {'imported': imported, 'skipped': skipped}


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

            if action == 'import_to_finance':
                account_id = body.get('account_id')
                statement_id = body.get('statement_id')
                cashbox_id = body.get('cashbox_id')
                if not account_id or not statement_id or not cashbox_id:
                    return resp(400, {'error': 'account_id, statement_id, cashbox_id are required'})
                result = import_to_finance(account_id, statement_id, int(cashbox_id), jwt_token)
                return resp(200, result)

            return resp(400, {'error': 'Unknown action'})

        return resp(405, {'error': 'Method not allowed'})

    except RuntimeError as e:
        return resp(502, {'error': str(e)})
    except Exception as e:
        import traceback
        print(f'[tochka-bank] ERROR: {e}\n{traceback.format_exc()}')
        return resp(500, {'error': str(e)})
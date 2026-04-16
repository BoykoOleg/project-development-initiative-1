CREATE TABLE IF NOT EXISTS bank_transactions (
    id SERIAL PRIMARY KEY,
    tx_id VARCHAR(255) UNIQUE NOT NULL,
    account_id VARCHAR(100) NOT NULL,
    tx_date DATE,
    amount NUMERIC(12,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'RUB',
    credit_debit VARCHAR(20),
    description TEXT DEFAULT '',
    counterparty TEXT DEFAULT '',
    status VARCHAR(50) DEFAULT '',
    expense_id INTEGER NULL,
    income_id INTEGER NULL,
    imported_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);
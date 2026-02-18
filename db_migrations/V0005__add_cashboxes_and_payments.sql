CREATE TABLE IF NOT EXISTS cashboxes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(30) NOT NULL DEFAULT 'cash',
    is_active BOOLEAN NOT NULL DEFAULT true,
    balance NUMERIC(14,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    work_order_id INTEGER REFERENCES work_orders(id),
    cashbox_id INTEGER REFERENCES cashboxes(id),
    amount NUMERIC(12,2) NOT NULL,
    payment_method VARCHAR(30) NOT NULL DEFAULT 'cash',
    comment TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT now()
);

INSERT INTO cashboxes (name, type) VALUES
    ('Основная касса', 'cash'),
    ('Расчётный счёт', 'bank'),
    ('Терминал', 'card');

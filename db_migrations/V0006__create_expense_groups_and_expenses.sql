
CREATE TABLE IF NOT EXISTS expense_groups (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT DEFAULT '',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS expenses (
    id SERIAL PRIMARY KEY,
    expense_group_id INTEGER REFERENCES expense_groups(id),
    cashbox_id INTEGER NOT NULL REFERENCES cashboxes(id),
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    comment TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO expense_groups (name) VALUES
    ('Аренда'),
    ('Зарплата'),
    ('Закупка материалов'),
    ('Коммунальные'),
    ('Прочее');

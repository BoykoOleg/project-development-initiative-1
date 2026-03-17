CREATE TABLE t_p82967824_project_development_.incomes (
    id SERIAL PRIMARY KEY,
    cashbox_id INTEGER NOT NULL REFERENCES t_p82967824_project_development_.cashboxes(id),
    amount NUMERIC(12, 2) NOT NULL,
    income_type VARCHAR(50) NOT NULL DEFAULT 'other',
    comment TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE t_p82967824_project_development_.transfers (
    id SERIAL PRIMARY KEY,
    from_cashbox_id INTEGER NOT NULL REFERENCES t_p82967824_project_development_.cashboxes(id),
    to_cashbox_id INTEGER NOT NULL REFERENCES t_p82967824_project_development_.cashboxes(id),
    amount NUMERIC(12, 2) NOT NULL,
    comment TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
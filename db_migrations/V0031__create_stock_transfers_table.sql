CREATE TABLE IF NOT EXISTS t_p82967824_project_development_.stock_transfers (
    id SERIAL PRIMARY KEY,
    transfer_number VARCHAR(50) NOT NULL,
    work_order_id INTEGER NOT NULL,
    direction VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    notes TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT NOW(),
    confirmed_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS t_p82967824_project_development_.stock_transfer_items (
    id SERIAL PRIMARY KEY,
    transfer_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    work_order_part_id INTEGER,
    qty NUMERIC(10,3) NOT NULL DEFAULT 1,
    price NUMERIC(12,2) NOT NULL DEFAULT 0
);

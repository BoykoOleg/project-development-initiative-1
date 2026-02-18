
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id),
    client_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL DEFAULT '',
    car_info VARCHAR(255) DEFAULT '',
    service VARCHAR(255) DEFAULT '',
    status VARCHAR(20) NOT NULL DEFAULT 'new',
    comment TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE work_orders (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id),
    client_id INTEGER REFERENCES clients(id),
    car_id INTEGER REFERENCES cars(id),
    client_name VARCHAR(255) NOT NULL,
    car_info VARCHAR(255) DEFAULT '',
    status VARCHAR(20) NOT NULL DEFAULT 'new',
    master VARCHAR(100) DEFAULT '',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE work_order_works (
    id SERIAL PRIMARY KEY,
    work_order_id INTEGER NOT NULL REFERENCES work_orders(id),
    name VARCHAR(255) NOT NULL,
    price NUMERIC(12,2) NOT NULL DEFAULT 0
);

CREATE TABLE work_order_parts (
    id SERIAL PRIMARY KEY,
    work_order_id INTEGER NOT NULL REFERENCES work_orders(id),
    name VARCHAR(255) NOT NULL,
    qty INTEGER NOT NULL DEFAULT 1,
    price NUMERIC(12,2) NOT NULL DEFAULT 0
);

CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at);
CREATE INDEX idx_work_orders_status ON work_orders(status);
CREATE INDEX idx_work_orders_created ON work_orders(created_at);
CREATE INDEX idx_wo_works_woid ON work_order_works(work_order_id);
CREATE INDEX idx_wo_parts_woid ON work_order_parts(work_order_id);

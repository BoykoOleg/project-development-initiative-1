
CREATE TABLE clients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255) DEFAULT '',
    comment TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE cars (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL REFERENCES clients(id),
    brand VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    year VARCHAR(4) DEFAULT '',
    vin VARCHAR(17) DEFAULT '',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_cars_client_id ON cars(client_id);
CREATE INDEX idx_cars_vin ON cars(vin) WHERE vin != '';
CREATE INDEX idx_clients_phone ON clients(phone);

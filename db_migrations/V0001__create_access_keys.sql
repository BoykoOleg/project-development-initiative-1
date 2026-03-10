CREATE TABLE IF NOT EXISTS access_keys (
    id SERIAL PRIMARY KEY,
    key VARCHAR(32) UNIQUE NOT NULL,
    email VARCHAR(255),
    lava_order_id VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    activated_at TIMESTAMP
);
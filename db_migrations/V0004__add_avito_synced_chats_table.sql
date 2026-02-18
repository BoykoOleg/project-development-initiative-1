CREATE TABLE IF NOT EXISTS avito_synced_chats (
    id SERIAL PRIMARY KEY,
    chat_id VARCHAR(255) NOT NULL UNIQUE,
    avito_user_id VARCHAR(255),
    order_id INTEGER REFERENCES orders(id),
    last_message_id VARCHAR(255),
    synced_at TIMESTAMP DEFAULT now()
);

ALTER TABLE orders ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'manual';

CREATE TABLE IF NOT EXISTS t_p82967824_project_development_.bot_messages (
    id SERIAL PRIMARY KEY,
    chat_id BIGINT NOT NULL,
    role VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bot_messages_chat_id ON t_p82967824_project_development_.bot_messages (chat_id, created_at DESC);

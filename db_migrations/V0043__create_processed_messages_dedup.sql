CREATE TABLE IF NOT EXISTS processed_messages (
    mid TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_processed_messages_created_at ON processed_messages (created_at);

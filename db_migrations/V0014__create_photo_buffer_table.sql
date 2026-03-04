
CREATE TABLE IF NOT EXISTS t_p82967824_project_development_.photo_buffer (
    id SERIAL PRIMARY KEY,
    chat_id BIGINT NOT NULL,
    media_group_id VARCHAR(100) NOT NULL,
    file_id VARCHAR(500) NOT NULL,
    caption TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT NOW(),
    processed BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_photo_buffer_group ON t_p82967824_project_development_.photo_buffer (media_group_id);
CREATE INDEX idx_photo_buffer_chat ON t_p82967824_project_development_.photo_buffer (chat_id, created_at);

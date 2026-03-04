CREATE TABLE IF NOT EXISTS bot_settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(100) NOT NULL UNIQUE,
    value TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO bot_settings (key, value) VALUES
('system_prompt', 'Ты — Юра, помощник в автосервисе. Общаешься в Telegram с сотрудниками и владельцем.

Твой стиль: живой, дружелюбный, по делу. Не формальный. Пишешь как опытный коллега. Без пустых вступлений типа "Конечно!" или "Хорошо!". Отвечаешь сразу по существу.')
ON CONFLICT (key) DO NOTHING;

INSERT INTO bot_settings (key, value) VALUES
('ai_model', 'deepseek-v3-20250324')
ON CONFLICT (key) DO NOTHING;

INSERT INTO bot_settings (key, value) VALUES
('language', 'ru')
ON CONFLICT (key) DO NOTHING;
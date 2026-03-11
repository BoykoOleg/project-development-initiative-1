CREATE TABLE IF NOT EXISTS t_p82967824_project_development_.calls (
    id SERIAL PRIMARY KEY,
    mobilon_id VARCHAR(64) UNIQUE,
    phone VARCHAR(32),
    src VARCHAR(32),
    dst VARCHAR(32),
    direction VARCHAR(16),
    duration INTEGER DEFAULT 0,
    started_at BIGINT,
    state VARCHAR(32),
    uuid VARCHAR(64),
    subid VARCHAR(64),
    userkey VARCHAR(64),
    raw JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_calls_started_at ON t_p82967824_project_development_.calls (started_at DESC);
CREATE INDEX IF NOT EXISTS idx_calls_phone ON t_p82967824_project_development_.calls (phone);
CREATE INDEX IF NOT EXISTS idx_calls_direction ON t_p82967824_project_development_.calls (direction);

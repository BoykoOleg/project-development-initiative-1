CREATE TABLE t_p82967824_project_development_.call_transcripts (
    id SERIAL PRIMARY KEY,
    call_id INTEGER,
    mobilon_id VARCHAR(64),
    phone VARCHAR(32) NOT NULL,
    dst VARCHAR(32),
    direction VARCHAR(16),
    started_at BIGINT,
    duration INTEGER DEFAULT 0,
    transcript_raw TEXT,
    transcript_structured JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_call_transcripts_phone ON t_p82967824_project_development_.call_transcripts(phone);
CREATE INDEX idx_call_transcripts_mobilon_id ON t_p82967824_project_development_.call_transcripts(mobilon_id);
CREATE INDEX idx_call_transcripts_started_at ON t_p82967824_project_development_.call_transcripts(started_at);
CREATE TABLE IF NOT EXISTS t_p82967824_project_development_.activity_log (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    user_name VARCHAR(200) NOT NULL DEFAULT '',
    user_email VARCHAR(200) NOT NULL DEFAULT '',
    module VARCHAR(100) NOT NULL DEFAULT '',
    action VARCHAR(200) NOT NULL DEFAULT '',
    entity_type VARCHAR(100) NOT NULL DEFAULT '',
    entity_id INTEGER,
    entity_label VARCHAR(500) NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON t_p82967824_project_development_.activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON t_p82967824_project_development_.activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_module ON t_p82967824_project_development_.activity_log(module);

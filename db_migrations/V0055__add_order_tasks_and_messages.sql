
CREATE TABLE IF NOT EXISTS t_p82967824_project_development_.order_tasks (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL,
    assignee VARCHAR(100) NOT NULL,
    text TEXT NOT NULL DEFAULT '',
    done BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS t_p82967824_project_development_.order_messages (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL,
    user_id INTEGER,
    user_name VARCHAR(200) NOT NULL DEFAULT '',
    text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_tasks_order_id ON t_p82967824_project_development_.order_tasks(order_id);
CREATE INDEX IF NOT EXISTS idx_order_messages_order_id ON t_p82967824_project_development_.order_messages(order_id);

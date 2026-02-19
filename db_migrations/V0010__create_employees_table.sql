
CREATE TABLE employees (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(100) NOT NULL DEFAULT 'mechanic',
    phone VARCHAR(50) DEFAULT '',
    email VARCHAR(255) DEFAULT '',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE work_orders ADD COLUMN employee_id INTEGER REFERENCES employees(id);

INSERT INTO employees (name, role, phone) VALUES
('Бойко Олег Сергеевич', 'director', ''),
('Мастер-приёмщик', 'manager', '');

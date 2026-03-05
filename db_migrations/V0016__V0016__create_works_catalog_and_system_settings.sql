-- Таблица базы работ (каталог работ)
CREATE TABLE works_catalog (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  norm_hours NUMERIC(10, 2) NOT NULL DEFAULT 1.0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Таблица настроек системы (для хранения стоимости нормо-часа и других настроек)
CREATE TABLE IF NOT EXISTS system_settings (
  key VARCHAR(100) PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Базовая стоимость нормо-часа
INSERT INTO system_settings (key, value) VALUES ('norm_hour_price', '2000')
  ON CONFLICT (key) DO NOTHING;

-- Несколько примеров работ для старта
INSERT INTO works_catalog (code, name, norm_hours) VALUES
  ('D001', 'Диагностика двигателя', 1.0),
  ('M001', 'Замена масла и фильтра', 0.5),
  ('T001', 'Замена тормозных колодок (ось)', 1.0),
  ('S001', 'Шиномонтаж (4 колеса)', 1.0)
ON CONFLICT (code) DO NOTHING;

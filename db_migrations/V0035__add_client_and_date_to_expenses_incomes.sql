ALTER TABLE expenses ADD COLUMN IF NOT EXISTS client_id INTEGER NULL REFERENCES clients(id);
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS operation_date DATE NULL;

ALTER TABLE incomes ADD COLUMN IF NOT EXISTS client_id INTEGER NULL REFERENCES clients(id);
ALTER TABLE incomes ADD COLUMN IF NOT EXISTS operation_date DATE NULL;

UPDATE expenses SET operation_date = created_at::date WHERE operation_date IS NULL;
UPDATE incomes SET operation_date = created_at::date WHERE operation_date IS NULL;
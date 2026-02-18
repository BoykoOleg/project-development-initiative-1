
ALTER TABLE work_order_parts ADD COLUMN IF NOT EXISTS product_id INTEGER REFERENCES products(id);
ALTER TABLE work_order_parts ADD COLUMN IF NOT EXISTS purchase_price NUMERIC(12, 2) DEFAULT 0;
ALTER TABLE work_order_parts RENAME COLUMN price TO sell_price;

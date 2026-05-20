CREATE TABLE IF NOT EXISTS t_p82967824_project_development_.stock_movements (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES t_p82967824_project_development_.products(id),
    work_order_id INTEGER NOT NULL REFERENCES t_p82967824_project_development_.work_orders(id),
    work_order_part_id INTEGER NULL REFERENCES t_p82967824_project_development_.work_order_parts(id),
    qty INTEGER NOT NULL DEFAULT 1,
    movement_type VARCHAR(50) NOT NULL DEFAULT 'reserved',
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    released_at TIMESTAMP NULL,
    note TEXT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id ON t_p82967824_project_development_.stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_work_order_id ON t_p82967824_project_development_.stock_movements(work_order_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_movement_type ON t_p82967824_project_development_.stock_movements(movement_type);
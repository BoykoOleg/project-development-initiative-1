-- Добавляем поле reserved_qty в таблицу products
ALTER TABLE t_p82967824_project_development_.products
ADD COLUMN IF NOT EXISTS reserved_qty integer NOT NULL DEFAULT 0;

-- Пересчитываем текущие резервы: суммируем запчасти из открытых ЗН (не issued)
UPDATE t_p82967824_project_development_.products p
SET reserved_qty = (
    SELECT COALESCE(SUM(wop.qty), 0)
    FROM t_p82967824_project_development_.work_order_parts wop
    JOIN t_p82967824_project_development_.work_orders wo ON wo.id = wop.work_order_id
    WHERE wop.product_id = p.id
      AND wo.status != 'issued'
      AND wop.out_of_stock = false
);

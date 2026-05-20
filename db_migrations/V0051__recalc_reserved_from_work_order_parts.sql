-- Пересчёт reserved_qty по новой логике (из незакрытых наряд-заказов)
UPDATE t_p82967824_project_development_.products p
SET reserved_qty = GREATEST(0, COALESCE((
    SELECT SUM(wop.qty)
    FROM t_p82967824_project_development_.work_order_parts wop
    JOIN t_p82967824_project_development_.work_orders wo ON wo.id = wop.work_order_id
    WHERE wop.product_id = p.id
      AND wop.out_of_stock = false
      AND wo.status != 'issued'
), 0)),
updated_at = NOW();
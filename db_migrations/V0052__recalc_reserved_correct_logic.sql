-- Пересчёт reserved_qty: товар в резерве = в незакрытых ЗН, но ещё не перемещён физически
-- Формула: зарезервировано в ЗН - уже ушло по подтверждённым документам перемещения
UPDATE t_p82967824_project_development_.products p
SET reserved_qty = GREATEST(0, COALESCE((
    SELECT SUM(wop.qty)
    FROM t_p82967824_project_development_.work_order_parts wop
    JOIN t_p82967824_project_development_.work_orders wo ON wo.id = wop.work_order_id
    WHERE wop.product_id = p.id
      AND wop.out_of_stock = false
      AND wo.status != 'issued'
), 0) - COALESCE((
    SELECT SUM(CASE WHEN st.direction = 'to_order' THEN sti.qty ELSE -sti.qty END)
    FROM t_p82967824_project_development_.stock_transfer_items sti
    JOIN t_p82967824_project_development_.stock_transfers st ON st.id = sti.transfer_id
    JOIN t_p82967824_project_development_.work_orders wo ON wo.id = st.work_order_id
    WHERE sti.product_id = p.id
      AND st.status = 'confirmed'
      AND wo.status != 'issued'
), 0)),
updated_at = NOW();
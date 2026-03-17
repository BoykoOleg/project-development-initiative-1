ALTER TABLE t_p82967824_project_development_.expenses
  ADD COLUMN IF NOT EXISTS work_order_id integer REFERENCES t_p82967824_project_development_.work_orders(id);

ALTER TABLE t_p82967824_project_development_.incomes
  ADD COLUMN IF NOT EXISTS work_order_id integer REFERENCES t_p82967824_project_development_.work_orders(id);

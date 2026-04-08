ALTER TABLE t_p82967824_project_development_.expenses
  ADD COLUMN IF NOT EXISTS stock_receipt_id integer NULL
    REFERENCES t_p82967824_project_development_.stock_receipts(id);
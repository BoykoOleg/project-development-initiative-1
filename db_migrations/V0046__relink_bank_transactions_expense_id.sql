-- Связываем bank_transactions.expense_id с восстановленными расходами по дате и сумме
UPDATE t_p82967824_project_development_.bank_transactions bt
SET expense_id = e.id
FROM t_p82967824_project_development_.expenses e
WHERE bt.credit_debit = 'Debit'
  AND bt.expense_id IS NULL
  AND e.operation_date = bt.tx_date
  AND e.amount = bt.amount
  AND e.cashbox_id = 2;

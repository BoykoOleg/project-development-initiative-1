-- Восстанавливаем operation_date для записей, испорченных при массовом назначении групп расходов
-- Для записей с банковской транзакцией — берём реальную дату из bank_transactions
-- Для остальных — берём created_at
UPDATE "t_p82967824_project_development_".expenses e
SET operation_date = bt.tx_date
FROM "t_p82967824_project_development_".bank_transactions bt
WHERE bt.expense_id = e.id
  AND e.operation_date = '2026-05-02'
  AND e.created_at < '2026-05-01'
  AND bt.tx_date IS NOT NULL;

-- Для записей без банковской транзакции — сбрасываем в null (пусть используется created_at)
UPDATE "t_p82967824_project_development_".expenses e
SET operation_date = NULL
WHERE e.operation_date = '2026-05-02'
  AND e.created_at < '2026-05-01'
  AND NOT EXISTS (
    SELECT 1 FROM "t_p82967824_project_development_".bank_transactions bt
    WHERE bt.expense_id = e.id
  );
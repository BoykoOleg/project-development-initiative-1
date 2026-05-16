-- Восстановление расходов из bank_transactions (Debit операции)
-- Сначала сбрасываем expense_id у всех bank_transactions (они ссылаются на удалённые расходы)
UPDATE t_p82967824_project_development_.bank_transactions SET expense_id = NULL WHERE credit_debit = 'Debit';

-- Восстанавливаем расходы из Debit операций банка
WITH inserted AS (
    INSERT INTO t_p82967824_project_development_.expenses
        (cashbox_id, amount, comment, created_at, operation_date)
    SELECT
        2 as cashbox_id,
        bt.amount,
        CASE
            WHEN bt.counterparty != '' AND bt.description != '' THEN bt.counterparty || ' | ' || bt.description
            WHEN bt.counterparty != '' THEN bt.counterparty
            WHEN bt.description != '' THEN bt.description
            ELSE 'Банковский расход'
        END as comment,
        bt.tx_date::timestamp as created_at,
        bt.tx_date as operation_date
    FROM t_p82967824_project_development_.bank_transactions bt
    WHERE bt.credit_debit = 'Debit'
    ORDER BY bt.tx_date, bt.id
    RETURNING id
)
SELECT COUNT(*) FROM inserted;

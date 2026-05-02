-- Обновляем комментарии в expenses: подтягиваем имя контрагента из bank_transactions
-- Обновляем только те записи, где комментарий НЕ содержит имя контрагента
-- и контрагент не пустой и не является банком (у банковских комиссий имя уже не нужно добавлять)
UPDATE "t_p82967824_project_development_".expenses e
SET comment = bt.counterparty || ' | ' || e.comment
FROM "t_p82967824_project_development_".bank_transactions bt
WHERE bt.expense_id = e.id
  AND bt.counterparty IS NOT NULL
  AND bt.counterparty != ''
  AND e.comment NOT LIKE bt.counterparty || '%'
  AND bt.counterparty NOT IN ('ООО "Банк Точка"', 'АКЦИОНЕРНОЕ ОБЩЕСТВО "ТОЧКА"', 'ООО "Т2 МОБАЙЛ"');
-- Исправляем уже сохранённые пропущенные звонки:
-- incoming + duration=0 + state IN ('END','HANGUP') + callstatus не ANSWER => missed
UPDATE t_p82967824_project_development_.calls
SET direction = 'missed'
WHERE (raw->>'direction') = 'incoming'
  AND duration = 0
  AND state IN ('END', 'HANGUP')
  AND (raw->>'callstatus' IS NULL OR raw->>'callstatus' != 'ANSWER')
  AND direction != 'missed';
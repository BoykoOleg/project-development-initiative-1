-- Исправить звонки где callstatus не ANSWER но direction = 'in' (были пропущены)
UPDATE t_p82967824_project_development_.calls
SET direction = 'missed'
WHERE direction = 'in'
  AND state IN ('HANGUP', 'END')
  AND (raw->>'direction') = 'incoming'
  AND (raw->>'callstatus' IS NULL OR upper(raw->>'callstatus') != 'ANSWER');
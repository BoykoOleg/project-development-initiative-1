ALTER TABLE t_p82967824_project_development_.calls
  ADD COLUMN IF NOT EXISTS transcript text NULL,
  ADD COLUMN IF NOT EXISTS transcript_status varchar(16) NULL DEFAULT 'none';

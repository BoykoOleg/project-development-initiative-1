ALTER TABLE t_p82967824_project_development_.expense_groups
ADD COLUMN IF NOT EXISTS cost_type varchar(20) NOT NULL DEFAULT 'variable';
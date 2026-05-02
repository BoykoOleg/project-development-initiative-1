ALTER TABLE "t_p82967824_project_development_".expense_groups 
ADD COLUMN IF NOT EXISTS parent_id INTEGER REFERENCES "t_p82967824_project_development_".expense_groups(id);
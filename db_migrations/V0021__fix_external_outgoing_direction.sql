UPDATE "t_p82967824_project_development_".calls
SET 
    direction = 'out',
    phone = dst
WHERE 
    raw->>'direction' IN ('external', 'outgoing')
    AND direction = 'in';
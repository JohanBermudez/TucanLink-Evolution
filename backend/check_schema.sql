-- Script para verificar todas las columnas de las tablas

SELECT 
    t.table_name,
    COUNT(c.column_name) as column_count,
    STRING_AGG(c.column_name, ', ' ORDER BY c.ordinal_position) as columns
FROM information_schema.tables t
LEFT JOIN information_schema.columns c 
    ON t.table_name = c.table_name 
    AND t.table_schema = c.table_schema
WHERE t.table_schema = 'public' 
    AND t.table_type = 'BASE TABLE'
    AND t.table_name NOT LIKE 'pg_%'
GROUP BY t.table_name
ORDER BY t.table_name;

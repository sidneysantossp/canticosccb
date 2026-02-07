-- ============================================
-- VERIFICAÇÃO: Tabela users no Supabase
-- Execute no SQL Editor do Supabase
-- ============================================

-- 1. Verificar se a tabela users existe
SELECT 
    table_name,
    table_schema
FROM information_schema.tables 
WHERE table_name = 'users' 
ORDER BY table_schema;

-- 2. Verificar estrutura da tabela users (se existir)
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- 3. Verificar se há dados na tabela users
SELECT COUNT(*) as total_users FROM users LIMIT 1;

-- 4. Verificar triggers na tabela auth.users
SELECT 
    tgname AS trigger_name,
    proname AS function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
JOIN pg_class c ON t.tgrelid = c.oid
WHERE c.relname = 'users' 
AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'auth')
AND NOT tgisinternal;

-- 5. Verificar se existe tabela usuarios (com 's' no final)
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'usuarios'
ORDER BY ordinal_position;

-- 6. Comparar as duas tabelas (se ambas existirem)
SELECT 
    'users' as table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'users'
UNION ALL
SELECT 
    'usuarios' as table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'usuarios'
ORDER BY table_name, column_name;

-- 7. Verificar políticas RLS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename IN ('users', 'usuarios')
ORDER BY tablename, policyname;

SELECT 'Verificação concluída!' AS status;

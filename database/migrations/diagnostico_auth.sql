-- ============================================
-- DIAGNÓSTICO COMPLETO DO SUPABASE AUTH
-- Execute todas as queries para diagnóstico
-- ============================================

-- 1. Ver TODOS os triggers em auth.users
SELECT 
    n.nspname AS schema_name,
    c.relname AS table_name,
    t.tgname AS trigger_name,
    p.proname AS function_name,
    CASE t.tgtype & 1 WHEN 1 THEN 'ROW' ELSE 'STATEMENT' END AS trigger_level,
    CASE t.tgtype & 2 WHEN 2 THEN 'BEFORE' ELSE 'AFTER' END AS trigger_timing,
    CASE 
        WHEN t.tgtype & 4 = 4 THEN 'INSERT'
        WHEN t.tgtype & 8 = 8 THEN 'DELETE'
        WHEN t.tgtype & 16 = 16 THEN 'UPDATE'
    END AS trigger_event
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE n.nspname = 'auth' AND c.relname = 'users'
AND NOT t.tgisinternal;

-- 2. Ver TODAS as funções que mencionam 'usuarios' ou 'profile'
SELECT 
    n.nspname AS schema_name,
    p.proname AS function_name,
    pg_get_functiondef(p.oid) AS function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
AND (
    pg_get_functiondef(p.oid) ILIKE '%usuarios%'
    OR pg_get_functiondef(p.oid) ILIKE '%profile%'
    OR pg_get_functiondef(p.oid) ILIKE '%new_user%'
    OR pg_get_functiondef(p.oid) ILIKE '%auth.users%'
);

-- 3. Verificar se há event triggers
SELECT 
    evtname AS event_trigger_name,
    evtevent AS event_type,
    evtfoid::regproc AS function_name
FROM pg_event_trigger;

-- 4. Verificar extensões instaladas que podem interferir
SELECT extname, extversion FROM pg_extension;

-- 5. Verificar se a tabela usuarios existe e sua estrutura
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'usuarios'
ORDER BY ordinal_position;

-- 6. Verificar constraints na tabela usuarios
SELECT 
    con.conname AS constraint_name,
    con.contype AS constraint_type,
    pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
WHERE rel.relname = 'usuarios' AND nsp.nspname = 'public';

-- 7. Verificar policies RLS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'usuarios';

-- 8. Verificar se RLS está habilitado
SELECT 
    relname,
    relrowsecurity AS rls_enabled,
    relforcerowsecurity AS rls_forced
FROM pg_class
WHERE relname = 'usuarios';

-- 9. Testar inserção direta na tabela auth.users (APENAS DIAGNÓSTICO)
-- DESCOMENTE PARA TESTAR:
/*
SELECT 
    email,
    raw_user_meta_data,
    created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;
*/

-- 10. Verificar se há hooks de autenticação
SELECT * FROM auth.flow_state LIMIT 5;

SELECT '=== FIM DO DIAGNÓSTICO ===' AS status;

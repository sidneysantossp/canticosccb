-- ============================================
-- VERIFICAÇÃO RÁPIDA: Tabela users
-- Execute no SQL Editor do Supabase
-- ============================================

-- 1. Verificar se tabela users existe
SELECT 
    table_schema,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name = 'users' 
AND table_schema = 'public';

-- 2. Verificar estrutura da tabela users
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'users'
ORDER BY ordinal_position;

-- 3. Verificar se há dados na tabela users
SELECT COUNT(*) as total_users FROM public.users;

-- 4. Verificar políticas RLS
SELECT 
    policyname,
    cmd,
    permissive,
    roles,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY policyname;

-- 5. Testar SELECT simples (se você estiver logado no Supabase)
-- DESCOMENTE A LINHA ABAIXO PARA TESTAR
-- SELECT * FROM public.users LIMIT 1;

SELECT 'Verificação concluída!' AS status;

-- ============================================
-- FIX URGENTE: Remover função que causa o erro
-- A função sync_user_on_auth_insert está tentando
-- inserir na tabela "users" que NÃO EXISTE!
-- A tabela correta é "usuarios"
-- ============================================

-- PASSO 1: Verificar se há trigger usando esta função
SELECT 
    tgname AS trigger_name,
    proname AS function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
JOIN pg_class c ON t.tgrelid = c.oid
WHERE proname = 'sync_user_on_auth_insert';

-- PASSO 2: REMOVER o trigger que usa essa função
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS sync_user_trigger ON auth.users;
DROP TRIGGER IF EXISTS tr_sync_user ON auth.users;

-- PASSO 3: REMOVER a função problemática
DROP FUNCTION IF EXISTS sync_user_on_auth_insert() CASCADE;
DROP FUNCTION IF EXISTS public.sync_user_on_auth_insert() CASCADE;

-- PASSO 4: Verificar se foi removido (deve retornar vazio)
SELECT proname FROM pg_proc WHERE proname = 'sync_user_on_auth_insert';

-- PASSO 5: Verificar triggers restantes (deve mostrar poucos ou nenhum)
SELECT 
    tgname AS trigger_name,
    proname AS function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
JOIN pg_class c ON t.tgrelid = c.oid
WHERE c.relname = 'users' 
AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'auth')
AND NOT t.tgisinternal;

-- PASSO 6: Remover TODOS os triggers em auth.users (se ainda houver)
DO $$
DECLARE
    trigger_rec RECORD;
BEGIN
    FOR trigger_rec IN 
        SELECT t.tgname 
        FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        WHERE c.relname = 'users' 
        AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'auth')
        AND NOT t.tgisinternal
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON auth.users', trigger_rec.tgname);
        RAISE NOTICE 'Removido trigger: %', trigger_rec.tgname;
    END LOOP;
END $$;

-- PASSO 7: Verificação final (deve retornar vazio ou apenas triggers internos)
SELECT 
    t.tgname AS trigger_name
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE c.relname = 'users' 
AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'auth')
AND NOT t.tgisinternal;

SELECT '✅ Triggers removidos! Tente registrar novamente.' AS status;

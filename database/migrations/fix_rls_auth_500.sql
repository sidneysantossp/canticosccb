-- ============================================
-- FIX: Dropar políticas RLS que quebram Supabase Auth
-- As políticas "Admins can ..." usam is_admin() que chama auth.uid()
-- Isso causa erro 500 durante o login (Database error querying schema)
-- 
-- SOLUÇÃO: Remover essas políticas e usar APENAS as funções RPC
-- (admin_delete_user, admin_update_user) que já usam SECURITY DEFINER
-- ============================================

-- PASSO 1: Dropar as políticas admin que causam o erro 500
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can update all users" ON public.users;
DROP POLICY IF EXISTS "Admins can delete all users" ON public.users;

-- PASSO 2: Verificar que as políticas básicas ainda existem
-- (estas NÃO causam problema porque usam auth.uid() = id diretamente)
-- Se não existirem, recriar:
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can view own profile'
  ) THEN
    CREATE POLICY "Users can view own profile" ON public.users
      FOR SELECT USING (auth.uid() = id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can insert own profile'
  ) THEN
    CREATE POLICY "Users can insert own profile" ON public.users
      FOR INSERT WITH CHECK (auth.uid() = id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can update own profile'
  ) THEN
    CREATE POLICY "Users can update own profile" ON public.users
      FOR UPDATE USING (auth.uid() = id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Public can read active users'
  ) THEN
    CREATE POLICY "Public can read active users" ON public.users
      FOR SELECT USING (status = 'active' AND is_blocked = false);
  END IF;
END $$;

-- PASSO 3: Verificar resultado
SELECT policyname, cmd, permissive FROM pg_policies WHERE tablename = 'users' ORDER BY policyname;

-- PASSO 4: Verificar que as funções RPC ainda existem
SELECT proname AS funcao FROM pg_proc 
WHERE proname IN ('admin_delete_user', 'admin_update_user', 'admin_deactivate_user_by_email', 'is_admin')
ORDER BY proname;

SELECT '✅ Fix aplicado! As políticas admin foram removidas. Use as funções RPC para operações admin.' AS status;

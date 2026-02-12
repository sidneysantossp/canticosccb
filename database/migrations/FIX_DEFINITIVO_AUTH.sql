-- ============================================
-- FIX DEFINITIVO: Resolver Auth 500 + Exclusão
-- Execute TUDO de uma vez no Supabase SQL Editor
-- ============================================

-- =============================================
-- PASSO 1: REMOVER políticas RLS que quebram Auth
-- Estas políticas chamam is_admin() durante login
-- e causam erro 500 no /auth/v1/token
-- =============================================
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can update all users" ON public.users;
DROP POLICY IF EXISTS "Admins can delete all users" ON public.users;
DROP POLICY IF EXISTS "Admin full access" ON public.users;
DROP POLICY IF EXISTS "admin_select_users" ON public.users;
DROP POLICY IF EXISTS "admin_update_users" ON public.users;
DROP POLICY IF EXISTS "admin_delete_users" ON public.users;

-- =============================================
-- PASSO 2: REMOVER triggers customizados em auth.users
-- (caso FIX_URGENTE não tenha pego todos)
-- =============================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user ON auth.users;
DROP TRIGGER IF EXISTS create_profile_trigger ON auth.users;
DROP TRIGGER IF EXISTS tr_insert_user ON auth.users;
DROP TRIGGER IF EXISTS sync_user_trigger ON auth.users;
DROP TRIGGER IF EXISTS tr_sync_user ON auth.users;

DROP FUNCTION IF EXISTS public.sync_user_on_auth_insert() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.create_profile_for_user() CASCADE;
DROP FUNCTION IF EXISTS public.on_auth_user_created() CASCADE;

-- =============================================
-- PASSO 3: Atualizar CHECK constraint
-- (permite status 'inactive' para soft delete)
-- =============================================
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_status_check;
ALTER TABLE public.users ADD CONSTRAINT users_status_check 
  CHECK (status IN ('active', 'inactive', 'suspended', 'deleted'));

-- =============================================
-- PASSO 4: Garantir políticas básicas (sem is_admin)
-- Estas são seguras porque usam auth.uid() = id
-- (só avaliam o próprio usuário, não causam recursão)
-- =============================================
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Leitura pública de usuários ativos (para listagens)
DROP POLICY IF EXISTS "Public can read active users" ON public.users;
CREATE POLICY "Public can read active users" ON public.users
  FOR SELECT USING (status = 'active' AND is_blocked = false);

-- =============================================
-- PASSO 5: Helper is_admin() (SECURITY DEFINER)
-- Usada APENAS dentro das funções RPC, NÃO em policies
-- =============================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true
  );
END;
$$;

-- =============================================
-- PASSO 6: Função RPC admin_delete_user
-- SECURITY DEFINER = bypassa RLS automaticamente
-- =============================================
CREATE OR REPLACE FUNCTION public.admin_delete_user(
  p_target_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id UUID;
  v_is_admin BOOLEAN;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Nao autenticado');
  END IF;

  SELECT u.is_admin INTO v_is_admin FROM public.users u WHERE u.id = v_caller_id;
  IF v_is_admin IS NOT TRUE THEN
    RETURN json_build_object('success', false, 'error', 'Sem permissao de administrador');
  END IF;

  IF v_caller_id = p_target_user_id THEN
    RETURN json_build_object('success', false, 'error', 'Nao e possivel excluir a propria conta');
  END IF;

  UPDATE public.users
  SET status = 'inactive',
      is_blocked = true,
      updated_at = NOW()
  WHERE id = p_target_user_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Usuario nao encontrado');
  END IF;

  RETURN json_build_object('success', true, 'message', 'Usuario excluido com sucesso');
END;
$$;

-- =============================================
-- PASSO 7: Função RPC admin_update_user
-- =============================================
CREATE OR REPLACE FUNCTION public.admin_update_user(
  p_target_user_id UUID,
  p_data JSONB
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id UUID;
  v_is_admin BOOLEAN;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Nao autenticado');
  END IF;

  SELECT u.is_admin INTO v_is_admin FROM public.users u WHERE u.id = v_caller_id;
  IF v_is_admin IS NOT TRUE THEN
    RETURN json_build_object('success', false, 'error', 'Sem permissao de administrador');
  END IF;

  UPDATE public.users
  SET
    name = COALESCE(p_data->>'name', name),
    status = COALESCE(p_data->>'status', status),
    is_blocked = COALESCE((p_data->>'is_blocked')::boolean, is_blocked),
    is_admin = COALESCE((p_data->>'is_admin')::boolean, is_admin),
    is_composer = COALESCE((p_data->>'is_composer')::boolean, is_composer),
    plan = COALESCE(p_data->>'plan', plan),
    updated_at = NOW()
  WHERE id = p_target_user_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Usuario nao encontrado');
  END IF;

  RETURN json_build_object('success', true, 'message', 'Usuario atualizado com sucesso');
END;
$$;

-- =============================================
-- PASSO 8: Função RPC admin_deactivate_user_by_email
-- =============================================
CREATE OR REPLACE FUNCTION public.admin_deactivate_user_by_email(
  p_email TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id UUID;
  v_is_admin BOOLEAN;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Nao autenticado');
  END IF;

  SELECT u.is_admin INTO v_is_admin FROM public.users u WHERE u.id = v_caller_id;
  IF v_is_admin IS NOT TRUE THEN
    RETURN json_build_object('success', false, 'error', 'Sem permissao de administrador');
  END IF;

  UPDATE public.users
  SET is_composer = false,
      is_blocked = true,
      status = 'inactive',
      updated_at = NOW()
  WHERE email = p_email;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Usuario nao encontrado com este email');
  END IF;

  RETURN json_build_object('success', true, 'message', 'Usuario desativado com sucesso');
END;
$$;

-- =============================================
-- PASSO 9: Verificação final
-- =============================================

-- Deve mostrar APENAS: Users can view/insert/update own profile + Public can read active users
-- NÃO deve ter nenhuma policy com "Admin" no nome
SELECT policyname, cmd, permissive FROM pg_policies WHERE tablename = 'users' ORDER BY policyname;

-- Deve mostrar as 4 funções RPC
SELECT proname FROM pg_proc 
WHERE proname IN ('admin_delete_user', 'admin_update_user', 'admin_deactivate_user_by_email', 'is_admin')
ORDER BY proname;

-- Deve retornar VAZIO (sem triggers customizados em auth.users)
SELECT t.tgname
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE c.relname = 'users' 
AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'auth')
AND NOT t.tgisinternal;

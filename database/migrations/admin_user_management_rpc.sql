-- ============================================
-- Admin User Management - RPC + RLS
-- Execute TUDO no SQL Editor do Supabase
-- ============================================

-- =============================================
-- PASSO 1: Atualizar CHECK constraint PRIMEIRO
-- (necessário antes de usar status='inactive')
-- =============================================
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_status_check;
ALTER TABLE public.users ADD CONSTRAINT users_status_check 
  CHECK (status IN ('active', 'inactive', 'suspended', 'deleted'));

-- =============================================
-- PASSO 2: Helper function is_admin()
-- SECURITY DEFINER = bypassa RLS (evita recursão)
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
-- PASSO 3: Limpar políticas antigas
-- =============================================
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can update all users" ON public.users;
DROP POLICY IF EXISTS "Admins can delete all users" ON public.users;

-- =============================================
-- PASSO 4: RPC admin_delete_user
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

  SELECT is_admin INTO v_is_admin FROM public.users WHERE id = v_caller_id;
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
-- PASSO 5: RPC admin_update_user
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

  SELECT is_admin INTO v_is_admin FROM public.users WHERE id = v_caller_id;
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
-- PASSO 6: RPC admin_deactivate_user_by_email
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

  SELECT is_admin INTO v_is_admin FROM public.users WHERE id = v_caller_id;
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
-- PASSO 7: Criar políticas RLS para admins
-- (usando is_admin() helper, sem recursão)
-- =============================================
CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can update all users" ON public.users
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admins can delete all users" ON public.users
  FOR DELETE USING (public.is_admin());

-- =============================================
-- PASSO 8: Verificar
-- =============================================
SELECT proname AS funcao FROM pg_proc 
WHERE proname IN ('admin_delete_user', 'admin_update_user', 'admin_deactivate_user_by_email', 'is_admin')
ORDER BY proname;

SELECT policyname, cmd FROM pg_policies WHERE tablename = 'users' ORDER BY policyname;

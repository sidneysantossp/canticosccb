-- ============================================
-- Atualizar RPC para HARD DELETE (remover do banco)
-- Execute no Supabase SQL Editor
-- ============================================

CREATE OR REPLACE FUNCTION public.admin_delete_user_noauth(
  p_target_user_id UUID,
  p_admin_email TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_exists BOOLEAN;
  v_user_email TEXT;
BEGIN
  -- Verificar se o email pertence a um admin
  SELECT EXISTS(
    SELECT 1 FROM public.users 
    WHERE email = p_admin_email AND is_admin = true AND status = 'active'
  ) INTO v_admin_exists;

  IF NOT v_admin_exists THEN
    RETURN json_build_object('success', false, 'error', 'Email nao pertence a um administrador ativo');
  END IF;

  -- Verificar se não está tentando excluir a si mesmo
  IF EXISTS (SELECT 1 FROM public.users WHERE id = p_target_user_id AND email = p_admin_email) THEN
    RETURN json_build_object('success', false, 'error', 'Nao e possivel excluir a propria conta');
  END IF;

  -- Pegar email do usuário alvo (para remover de auth.users)
  SELECT email INTO v_user_email FROM public.users WHERE id = p_target_user_id;

  IF v_user_email IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Usuario nao encontrado');
  END IF;

  -- Hard delete: remover da tabela public.users
  DELETE FROM public.users WHERE id = p_target_user_id;

  -- Remover da tabela auth.users (para impedir login)
  DELETE FROM auth.users WHERE id = p_target_user_id;

  RETURN json_build_object('success', true, 'message', 'Usuario excluido permanentemente');
END;
$$;

-- Também atualizar a versão com JWT
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
  v_user_email TEXT;
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

  -- Pegar email antes de deletar
  SELECT email INTO v_user_email FROM public.users WHERE id = p_target_user_id;
  IF v_user_email IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Usuario nao encontrado');
  END IF;

  -- Hard delete
  DELETE FROM public.users WHERE id = p_target_user_id;
  DELETE FROM auth.users WHERE id = p_target_user_id;

  RETURN json_build_object('success', true, 'message', 'Usuario excluido permanentemente');
END;
$$;

-- Verificação
SELECT 'Funções atualizadas para HARD DELETE' AS status;

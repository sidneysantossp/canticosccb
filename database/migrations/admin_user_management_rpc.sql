-- ============================================
-- RPC Functions para Admin gerenciar usuários
-- Usa SECURITY DEFINER para bypass de RLS
-- Execute no SQL Editor do Supabase
-- ============================================

-- 1. Função para admin soft-deletar um usuário
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
  v_result JSON;
BEGIN
  -- Verificar quem está chamando
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Não autenticado');
  END IF;

  -- Verificar se o chamador é admin
  SELECT is_admin INTO v_is_admin FROM public.users WHERE id = v_caller_id;
  IF v_is_admin IS NOT TRUE THEN
    RETURN json_build_object('success', false, 'error', 'Sem permissão de administrador');
  END IF;

  -- Não permitir auto-exclusão
  IF v_caller_id = p_target_user_id THEN
    RETURN json_build_object('success', false, 'error', 'Não é possível excluir a própria conta');
  END IF;

  -- Soft delete: marcar como deletado e bloqueado
  UPDATE public.users
  SET status = 'deleted',
      is_blocked = true,
      updated_at = NOW()
  WHERE id = p_target_user_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Usuário não encontrado');
  END IF;

  RETURN json_build_object('success', true, 'message', 'Usuário excluído com sucesso');
END;
$$;

-- 2. Função para admin atualizar status de um usuário
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
  -- Verificar quem está chamando
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Não autenticado');
  END IF;

  -- Verificar se o chamador é admin
  SELECT is_admin INTO v_is_admin FROM public.users WHERE id = v_caller_id;
  IF v_is_admin IS NOT TRUE THEN
    RETURN json_build_object('success', false, 'error', 'Sem permissão de administrador');
  END IF;

  -- Atualizar campos permitidos
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
    RETURN json_build_object('success', false, 'error', 'Usuário não encontrado');
  END IF;

  RETURN json_build_object('success', true, 'message', 'Usuário atualizado com sucesso');
END;
$$;

-- 3. Função para admin desativar usuário por email (usado ao deletar compositor)
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
  -- Verificar quem está chamando
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Não autenticado');
  END IF;

  -- Verificar se o chamador é admin
  SELECT is_admin INTO v_is_admin FROM public.users WHERE id = v_caller_id;
  IF v_is_admin IS NOT TRUE THEN
    RETURN json_build_object('success', false, 'error', 'Sem permissão de administrador');
  END IF;

  -- Desativar o usuário
  UPDATE public.users
  SET is_composer = false,
      is_blocked = true,
      status = 'deleted',
      updated_at = NOW()
  WHERE email = p_email;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Usuário não encontrado com este email');
  END IF;

  RETURN json_build_object('success', true, 'message', 'Usuário desativado com sucesso');
END;
$$;

-- 4. Adicionar políticas RLS para admins (complementar)

-- Admins podem ver todos os usuários
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.is_admin = true)
  );

-- Admins podem atualizar qualquer usuário
DROP POLICY IF EXISTS "Admins can update all users" ON public.users;
CREATE POLICY "Admins can update all users" ON public.users
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.is_admin = true)
  );

-- Admins podem deletar qualquer usuário
DROP POLICY IF EXISTS "Admins can delete all users" ON public.users;
CREATE POLICY "Admins can delete all users" ON public.users
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.is_admin = true)
  );

-- Atualizar CHECK constraint para permitir status 'deleted'
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_status_check;
ALTER TABLE public.users ADD CONSTRAINT users_status_check 
  CHECK (status IN ('active', 'inactive', 'suspended', 'deleted'));

-- 5. Verificar que as funções foram criadas
SELECT 'admin_delete_user' AS function_name, 
       EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'admin_delete_user') AS exists
UNION ALL
SELECT 'admin_update_user',
       EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'admin_update_user')
UNION ALL
SELECT 'admin_deactivate_user_by_email',
       EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'admin_deactivate_user_by_email');

SELECT '✅ Funções RPC de admin criadas com sucesso!' AS status;

-- ============================================
-- RPC para exclusão de usuários SEM precisar de JWT
-- Usa email do admin como verificação (fallback)
-- Execute no Supabase SQL Editor
-- ============================================

-- Função que permite admin deletar usuário usando email como autenticação
-- Usada quando o Supabase Auth retorna 500 e não há JWT disponível
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
  v_is_admin BOOLEAN;
  v_admin_exists BOOLEAN;
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

  -- Soft delete: marcar como inativo e bloqueado
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

-- Permitir chamada via anon key (necessário para funcionar sem JWT)
GRANT EXECUTE ON FUNCTION public.admin_delete_user_noauth(UUID, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.admin_delete_user_noauth(UUID, TEXT) TO authenticated;

-- Verificação
SELECT proname FROM pg_proc WHERE proname = 'admin_delete_user_noauth';

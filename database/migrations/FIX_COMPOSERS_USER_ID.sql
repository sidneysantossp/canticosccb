-- =============================================
-- FIX: Vincular compositores existentes ao user_id do auth
-- Atualiza composers.user_id com base no email correspondente na tabela users
-- Execute no Supabase SQL Editor
-- =============================================

-- Verificar compositores sem user_id
SELECT c.id, c.name, c.email, c.user_id
FROM public.composers c
WHERE c.user_id IS NULL;

-- Atualizar user_id com base no email
UPDATE public.composers c
SET user_id = u.id
FROM public.users u
WHERE c.email = u.email
  AND c.user_id IS NULL;

-- Verificação após update
SELECT c.id, c.name, c.email, c.user_id, c.verified, c.status
FROM public.composers c
ORDER BY c.created_at DESC;

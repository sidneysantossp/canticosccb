-- =============================================
-- FIX: Adicionar 'deleted' e 'inactive' ao CHECK constraint de status dos composers
-- Execute no Supabase SQL Editor
-- =============================================

-- Remover constraint antiga
ALTER TABLE public.composers DROP CONSTRAINT IF EXISTS composers_status_check;

-- Criar constraint atualizada com todos os status válidos
ALTER TABLE public.composers ADD CONSTRAINT composers_status_check 
  CHECK (status IN ('active', 'approved', 'pending', 'rejected', 'inactive', 'deleted', 'suspended'));

-- Verificar
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'public.composers'::regclass AND conname = 'composers_status_check';

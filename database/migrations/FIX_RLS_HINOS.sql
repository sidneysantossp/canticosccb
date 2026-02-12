-- =============================================
-- FIX: Políticas RLS para tabela hinos
-- O INSERT está sendo bloqueado silenciosamente pelo RLS
-- Execute no Supabase SQL Editor
-- =============================================

-- 1. Verificar se RLS está habilitado
SELECT relname, relrowsecurity 
FROM pg_class 
WHERE relname = 'hinos';

-- 2. Criar políticas permissivas para a tabela hinos

-- Leitura pública (todos podem ver hinos)
DROP POLICY IF EXISTS "Hinos public read" ON public.hinos;
CREATE POLICY "Hinos public read"
  ON public.hinos FOR SELECT
  USING (true);

-- Insert: qualquer usuário autenticado ou anônimo pode inserir
DROP POLICY IF EXISTS "Hinos insert" ON public.hinos;
CREATE POLICY "Hinos insert"
  ON public.hinos FOR INSERT
  WITH CHECK (true);

-- Update: qualquer usuário pode atualizar
DROP POLICY IF EXISTS "Hinos update" ON public.hinos;
CREATE POLICY "Hinos update"
  ON public.hinos FOR UPDATE
  USING (true);

-- Delete: qualquer usuário pode deletar
DROP POLICY IF EXISTS "Hinos delete" ON public.hinos;
CREATE POLICY "Hinos delete"
  ON public.hinos FOR DELETE
  USING (true);

-- 3. Garantir que RLS está habilitado (necessário para as políticas funcionarem)
ALTER TABLE public.hinos ENABLE ROW LEVEL SECURITY;

-- 4. Verificação final
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'hinos';

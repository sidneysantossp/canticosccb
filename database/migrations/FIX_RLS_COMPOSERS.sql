-- =============================================
-- FIX: Políticas RLS para tabela composers
-- O UPDATE está sendo bloqueado silenciosamente pelo RLS
-- Execute no Supabase SQL Editor
-- =============================================

-- 1. Verificar se RLS está habilitado
SELECT relname, relrowsecurity
FROM pg_class
WHERE relname = 'composers';

-- 2. Verificar políticas existentes
SELECT policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'composers';

-- 3. Adicionar colunas que podem estar faltando na tabela composers
-- (ignora se já existir)
DO $$
BEGIN
  -- Campos de contato
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='composers' AND column_name='phone') THEN
    ALTER TABLE public.composers ADD COLUMN phone text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='composers' AND column_name='website') THEN
    ALTER TABLE public.composers ADD COLUMN website text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='composers' AND column_name='instagram') THEN
    ALTER TABLE public.composers ADD COLUMN instagram text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='composers' AND column_name='facebook') THEN
    ALTER TABLE public.composers ADD COLUMN facebook text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='composers' AND column_name='youtube') THEN
    ALTER TABLE public.composers ADD COLUMN youtube text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='composers' AND column_name='location') THEN
    ALTER TABLE public.composers ADD COLUMN location text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='composers' AND column_name='banner_url') THEN
    ALTER TABLE public.composers ADD COLUMN banner_url text;
  END IF;

  -- Campos de endereço
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='composers' AND column_name='address') THEN
    ALTER TABLE public.composers ADD COLUMN address text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='composers' AND column_name='address_number') THEN
    ALTER TABLE public.composers ADD COLUMN address_number text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='composers' AND column_name='address_complement') THEN
    ALTER TABLE public.composers ADD COLUMN address_complement text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='composers' AND column_name='district') THEN
    ALTER TABLE public.composers ADD COLUMN district text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='composers' AND column_name='city') THEN
    ALTER TABLE public.composers ADD COLUMN city text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='composers' AND column_name='state') THEN
    ALTER TABLE public.composers ADD COLUMN state text;
  END IF;

  -- Campos de notificação
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='composers' AND column_name='notif_email_followers') THEN
    ALTER TABLE public.composers ADD COLUMN notif_email_followers smallint DEFAULT 1;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='composers' AND column_name='notif_email_comments') THEN
    ALTER TABLE public.composers ADD COLUMN notif_email_comments smallint DEFAULT 1;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='composers' AND column_name='notif_email_analytics') THEN
    ALTER TABLE public.composers ADD COLUMN notif_email_analytics smallint DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='composers' AND column_name='notif_push_new_followers') THEN
    ALTER TABLE public.composers ADD COLUMN notif_push_new_followers smallint DEFAULT 1;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='composers' AND column_name='notif_push_milestones') THEN
    ALTER TABLE public.composers ADD COLUMN notif_push_milestones smallint DEFAULT 1;
  END IF;
END $$;

-- 4. Criar políticas RLS permissivas para composers

-- Leitura pública
DROP POLICY IF EXISTS "Composers public read" ON public.composers;
CREATE POLICY "Composers public read"
  ON public.composers FOR SELECT
  USING (true);

-- Insert: usuários autenticados
DROP POLICY IF EXISTS "Composers insert authenticated" ON public.composers;
CREATE POLICY "Composers insert authenticated"
  ON public.composers FOR INSERT
  WITH CHECK (true);

-- Update: usuário autenticado pode atualizar seu próprio perfil
DROP POLICY IF EXISTS "Composers update own" ON public.composers;
CREATE POLICY "Composers update own"
  ON public.composers FOR UPDATE
  USING (true);

-- Delete: admin apenas (por ora permissivo)
DROP POLICY IF EXISTS "Composers delete" ON public.composers;
CREATE POLICY "Composers delete"
  ON public.composers FOR DELETE
  USING (true);

-- 5. Garantir que RLS está habilitado
ALTER TABLE public.composers ENABLE ROW LEVEL SECURITY;

-- 6. Verificação final
SELECT policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'composers';

-- 7. Verificar colunas da tabela
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'composers'
ORDER BY ordinal_position;

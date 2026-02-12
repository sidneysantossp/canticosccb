-- =============================================
-- FIX: Criar tabela user_presence com UNIQUE em user_id
-- O hook usePresence.ts faz upsert (POST com Prefer: resolution=merge-duplicates)
-- mas a tabela precisa de uma constraint UNIQUE para isso funcionar.
-- Execute no Supabase SQL Editor
-- =============================================

-- 1. Criar tabela se não existir
CREATE TABLE IF NOT EXISTS public.user_presence (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  user_name text,
  user_email text,
  last_seen timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- 2. Se a tabela já existe mas sem UNIQUE, adicionar
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_presence_user_id_key' 
    AND conrelid = 'public.user_presence'::regclass
  ) THEN
    -- Remover duplicatas antes de adicionar constraint
    DELETE FROM public.user_presence a
    USING public.user_presence b
    WHERE a.id < b.id AND a.user_id = b.user_id;
    
    ALTER TABLE public.user_presence ADD CONSTRAINT user_presence_user_id_key UNIQUE (user_id);
  END IF;
END $$;

-- 3. RLS permissiva
ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_presence_select" ON public.user_presence;
DROP POLICY IF EXISTS "user_presence_insert" ON public.user_presence;
DROP POLICY IF EXISTS "user_presence_update" ON public.user_presence;
DROP POLICY IF EXISTS "user_presence_delete" ON public.user_presence;

CREATE POLICY "user_presence_select" ON public.user_presence FOR SELECT USING (true);
CREATE POLICY "user_presence_insert" ON public.user_presence FOR INSERT WITH CHECK (true);
CREATE POLICY "user_presence_update" ON public.user_presence FOR UPDATE USING (true);
CREATE POLICY "user_presence_delete" ON public.user_presence FOR DELETE USING (true);

-- 4. Verificar
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_presence';

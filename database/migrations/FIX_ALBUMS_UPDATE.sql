-- =============================================
-- FIX: Garantir que todas as colunas usadas pelo código existem na tabela albums
-- Execute no Supabase SQL Editor
-- =============================================

-- 1. Verificar colunas existentes
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'albums'
ORDER BY ordinal_position;

-- 2. Adicionar colunas faltantes (se necessário)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='albums' AND column_name='genre') THEN
    ALTER TABLE public.albums ADD COLUMN genre character varying;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='albums' AND column_name='active') THEN
    ALTER TABLE public.albums ADD COLUMN active boolean DEFAULT true;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='albums' AND column_name='featured') THEN
    ALTER TABLE public.albums ADD COLUMN featured boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='albums' AND column_name='featured_order') THEN
    ALTER TABLE public.albums ADD COLUMN featured_order integer DEFAULT 0;
  END IF;
END $$;

-- 3. Garantir que album_hinos tem coluna position (código usa 'position', migration antiga usava 'ordem')
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='album_hinos' AND column_name='position') THEN
    ALTER TABLE public.album_hinos ADD COLUMN position integer DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='album_hinos' AND column_name='track_number') THEN
    ALTER TABLE public.album_hinos ADD COLUMN track_number integer;
  END IF;
END $$;

-- 4. RLS permissivo para albums
ALTER TABLE public.albums ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "albums_select" ON public.albums;
CREATE POLICY "albums_select" ON public.albums FOR SELECT USING (true);

DROP POLICY IF EXISTS "albums_insert" ON public.albums;
CREATE POLICY "albums_insert" ON public.albums FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "albums_update" ON public.albums;
CREATE POLICY "albums_update" ON public.albums FOR UPDATE USING (true);

DROP POLICY IF EXISTS "albums_delete" ON public.albums;
CREATE POLICY "albums_delete" ON public.albums FOR DELETE USING (true);

-- 5. Verificação final
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'albums'
ORDER BY ordinal_position;

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'album_hinos'
ORDER BY ordinal_position;

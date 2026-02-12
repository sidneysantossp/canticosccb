-- =============================================
-- FIX: Adicionar colunas faltantes na tabela albums
-- Execute no Supabase SQL Editor
-- =============================================

-- 1. Verificar colunas existentes
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'albums'
ORDER BY ordinal_position;

-- 2. Adicionar colunas faltantes
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='albums' AND column_name='genre') THEN
    ALTER TABLE public.albums ADD COLUMN genre character varying;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='albums' AND column_name='release_year') THEN
    ALTER TABLE public.albums ADD COLUMN release_year integer;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='albums' AND column_name='active') THEN
    ALTER TABLE public.albums ADD COLUMN active boolean DEFAULT true;
  END IF;
END $$;

-- 3. Criar tabela album_hinos se não existir
CREATE TABLE IF NOT EXISTS public.album_hinos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  album_id uuid NOT NULL REFERENCES public.albums(id) ON DELETE CASCADE,
  hino_id uuid NOT NULL REFERENCES public.hinos(id) ON DELETE CASCADE,
  ordem integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(album_id, hino_id)
);

-- 4. RLS para album_hinos
ALTER TABLE public.album_hinos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "album_hinos_select" ON public.album_hinos;
CREATE POLICY "album_hinos_select" ON public.album_hinos FOR SELECT USING (true);

DROP POLICY IF EXISTS "album_hinos_insert" ON public.album_hinos;
CREATE POLICY "album_hinos_insert" ON public.album_hinos FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "album_hinos_update" ON public.album_hinos;
CREATE POLICY "album_hinos_update" ON public.album_hinos FOR UPDATE USING (true);

DROP POLICY IF EXISTS "album_hinos_delete" ON public.album_hinos;
CREATE POLICY "album_hinos_delete" ON public.album_hinos FOR DELETE USING (true);

-- 5. RLS permissivo para albums (para update funcionar)
DROP POLICY IF EXISTS "albums_select" ON public.albums;
CREATE POLICY "albums_select" ON public.albums FOR SELECT USING (true);

DROP POLICY IF EXISTS "albums_insert" ON public.albums;
CREATE POLICY "albums_insert" ON public.albums FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "albums_update" ON public.albums;
CREATE POLICY "albums_update" ON public.albums FOR UPDATE USING (true);

DROP POLICY IF EXISTS "albums_delete" ON public.albums;
CREATE POLICY "albums_delete" ON public.albums FOR DELETE USING (true);

-- 6. Verificação final
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'albums'
ORDER BY ordinal_position;

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'album_hinos'
ORDER BY ordinal_position;

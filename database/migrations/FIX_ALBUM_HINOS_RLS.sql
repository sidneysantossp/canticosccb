-- =============================================
-- FIX: Verificar e corrigir RLS + constraints da tabela album_hinos
-- Execute no Supabase SQL Editor
-- =============================================

-- 1. Verificar estrutura completa (constraints, defaults, nullable)
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'album_hinos'
ORDER BY ordinal_position;

-- 2. Verificar se RLS está habilitado
SELECT relname, relrowsecurity
FROM pg_class
WHERE relname = 'album_hinos';

-- 3. Verificar políticas existentes
SELECT policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'album_hinos';

-- 4. Garantir RLS habilitado com políticas permissivas
ALTER TABLE public.album_hinos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "album_hinos_all_select" ON public.album_hinos;
CREATE POLICY "album_hinos_all_select" ON public.album_hinos FOR SELECT USING (true);

DROP POLICY IF EXISTS "album_hinos_all_insert" ON public.album_hinos;
CREATE POLICY "album_hinos_all_insert" ON public.album_hinos FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "album_hinos_all_update" ON public.album_hinos;
CREATE POLICY "album_hinos_all_update" ON public.album_hinos FOR UPDATE USING (true);

DROP POLICY IF EXISTS "album_hinos_all_delete" ON public.album_hinos;
CREATE POLICY "album_hinos_all_delete" ON public.album_hinos FOR DELETE USING (true);

-- 5. Tornar track_number nullable (pode estar bloqueando insert)
ALTER TABLE public.album_hinos ALTER COLUMN track_number DROP NOT NULL;

-- 6. Testar insert manual
-- INSERT INTO public.album_hinos (album_id, hino_id, position) VALUES ('SEU_ALBUM_ID', 'SEU_HINO_ID', 1);

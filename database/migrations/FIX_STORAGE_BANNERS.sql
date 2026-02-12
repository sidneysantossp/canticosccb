-- =============================================
-- FIX: Criar políticas de Storage para o bucket "banners"
-- Permite upload e leitura pública de imagens de banners
-- Execute no Supabase SQL Editor
-- =============================================

-- 1. Garantir que o bucket existe e é público
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'banners',
  'banners',
  true,
  52428800, -- 50MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm'];

-- 2. Política de leitura pública (SELECT)
DROP POLICY IF EXISTS "Banners public read" ON storage.objects;
CREATE POLICY "Banners public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'banners');

-- 3. Política de upload (INSERT) - qualquer usuário autenticado ou anon
DROP POLICY IF EXISTS "Banners upload" ON storage.objects;
CREATE POLICY "Banners upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'banners');

-- 4. Política de atualização (UPDATE)
DROP POLICY IF EXISTS "Banners update" ON storage.objects;
CREATE POLICY "Banners update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'banners');

-- 5. Política de exclusão (DELETE)
DROP POLICY IF EXISTS "Banners delete" ON storage.objects;
CREATE POLICY "Banners delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'banners');

-- Verificação
SELECT id, name, public FROM storage.buckets WHERE id = 'banners';
SELECT policyname FROM pg_policies WHERE tablename = 'objects' AND policyname LIKE 'Banners%';

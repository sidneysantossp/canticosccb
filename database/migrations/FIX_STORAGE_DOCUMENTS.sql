-- =============================================
-- FIX: Criar políticas de Storage para o bucket "documents"
-- Permite upload e leitura de imagens de documentos de compositores
-- Execute no Supabase SQL Editor
-- =============================================

-- 1. Garantir que o bucket existe e é público para leitura
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- 2. Política de leitura pública (SELECT)
DROP POLICY IF EXISTS "Documents public read" ON storage.objects;
CREATE POLICY "Documents public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'documents');

-- 3. Política de upload (INSERT)
DROP POLICY IF EXISTS "Documents upload" ON storage.objects;
CREATE POLICY "Documents upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'documents');

-- 4. Política de atualização (UPDATE)
DROP POLICY IF EXISTS "Documents update" ON storage.objects;
CREATE POLICY "Documents update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'documents');

-- 5. Política de exclusão (DELETE)
DROP POLICY IF EXISTS "Documents delete" ON storage.objects;
CREATE POLICY "Documents delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'documents');

-- Verificação
SELECT id, name, public FROM storage.buckets WHERE id = 'documents';
SELECT policyname FROM pg_policies WHERE tablename = 'objects' AND policyname LIKE 'Documents%';

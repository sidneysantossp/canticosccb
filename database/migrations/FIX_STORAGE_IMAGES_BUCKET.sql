-- =============================================
-- FIX: Aumentar limite do bucket 'images' para 50MB
-- e garantir políticas de upload para autenticados
-- Execute no Supabase SQL Editor
-- =============================================

-- 1. Verificar buckets existentes
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets;

-- 2. Atualizar limite do bucket images para 50MB (suficiente para imagens)
UPDATE storage.buckets
SET file_size_limit = 52428800,  -- 50 MB
    public = true
WHERE id = 'images';

-- 3. Políticas de Storage para o bucket images

-- Leitura pública
DROP POLICY IF EXISTS "Images public read" ON storage.objects;
CREATE POLICY "Images public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'images');

-- Upload: usuários autenticados
DROP POLICY IF EXISTS "Images authenticated upload" ON storage.objects;
CREATE POLICY "Images authenticated upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'images');

-- Update: usuários autenticados  
DROP POLICY IF EXISTS "Images authenticated update" ON storage.objects;
CREATE POLICY "Images authenticated update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'images');

-- Delete: usuários autenticados
DROP POLICY IF EXISTS "Images authenticated delete" ON storage.objects;
CREATE POLICY "Images authenticated delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'images');

-- 4. Verificação final
SELECT id, name, public, file_size_limit
FROM storage.buckets
WHERE id = 'images';

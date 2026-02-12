-- =============================================
-- FIX: Aumentar limite de upload do bucket "hinos" para 5GB
-- Permite upload de arquivos de áudio grandes (WAV, FLAC, etc.)
-- Execute no Supabase SQL Editor
-- =============================================

-- 1. Atualizar limite do bucket hinos para 5GB (5368709120 bytes)
UPDATE storage.buckets
SET file_size_limit = 5368709120
WHERE id = 'hinos';

-- Se o bucket não existir, criar com o limite correto
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'hinos',
  'hinos',
  true,
  5368709120, -- 5GB
  ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/flac', 'audio/ogg', 'audio/aac', 'audio/x-wav', 'audio/x-flac']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 5368709120,
  allowed_mime_types = ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/flac', 'audio/ogg', 'audio/aac', 'audio/x-wav', 'audio/x-flac'];

-- 2. Garantir políticas de RLS para o bucket hinos
DROP POLICY IF EXISTS "Hinos public read" ON storage.objects;
CREATE POLICY "Hinos public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'hinos');

DROP POLICY IF EXISTS "Hinos upload" ON storage.objects;
CREATE POLICY "Hinos upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'hinos');

DROP POLICY IF EXISTS "Hinos update" ON storage.objects;
CREATE POLICY "Hinos update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'hinos');

DROP POLICY IF EXISTS "Hinos delete" ON storage.objects;
CREATE POLICY "Hinos delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'hinos');

-- Verificação
SELECT id, name, public, file_size_limit FROM storage.buckets WHERE id = 'hinos';

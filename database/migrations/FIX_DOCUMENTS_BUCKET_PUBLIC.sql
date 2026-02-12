-- =============================================
-- FIX: Tornar bucket 'documents' público para que admin possa visualizar
-- os documentos dos compositores sem necessidade de URL assinada.
-- Execute no Supabase SQL Editor
-- =============================================

-- 1. Tornar o bucket público
UPDATE storage.buckets
SET public = true
WHERE id = 'documents';

-- 2. Verificar
SELECT id, name, public, file_size_limit
FROM storage.buckets
WHERE id = 'documents';

-- =============================================
-- CREATE: Tabela composer_documents para armazenar documentos de verificação
-- Execute no Supabase SQL Editor
-- =============================================

-- 1. Criar tabela composer_documents
CREATE TABLE IF NOT EXISTS public.composer_documents (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  composer_id uuid NOT NULL REFERENCES public.composers(id) ON DELETE CASCADE,
  document_type varchar NOT NULL DEFAULT 'documento',
  document_number varchar,
  document_image text,
  expected_name varchar DEFAULT '',
  extracted_name varchar DEFAULT '',
  image_path text DEFAULT '',
  status varchar NOT NULL DEFAULT 'pending',
  admin_notes text DEFAULT '',
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Habilitar RLS
ALTER TABLE public.composer_documents ENABLE ROW LEVEL SECURITY;

-- 3. Políticas RLS permissivas
DROP POLICY IF EXISTS "composer_documents_select" ON public.composer_documents;
CREATE POLICY "composer_documents_select" ON public.composer_documents FOR SELECT USING (true);

DROP POLICY IF EXISTS "composer_documents_insert" ON public.composer_documents;
CREATE POLICY "composer_documents_insert" ON public.composer_documents FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "composer_documents_update" ON public.composer_documents;
CREATE POLICY "composer_documents_update" ON public.composer_documents FOR UPDATE USING (true);

DROP POLICY IF EXISTS "composer_documents_delete" ON public.composer_documents;
CREATE POLICY "composer_documents_delete" ON public.composer_documents FOR DELETE USING (true);

-- 4. Índice para busca por composer_id
CREATE INDEX IF NOT EXISTS idx_composer_documents_composer_id ON public.composer_documents(composer_id);

-- 5. Criar bucket 'documents' no storage (se não existir)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('documents', 'documents', true, 52428800)
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 52428800;

-- 6. Políticas de storage para o bucket documents
DROP POLICY IF EXISTS "documents_public_read" ON storage.objects;
CREATE POLICY "documents_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'documents');

DROP POLICY IF EXISTS "documents_auth_upload" ON storage.objects;
CREATE POLICY "documents_auth_upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'documents');

DROP POLICY IF EXISTS "documents_auth_update" ON storage.objects;
CREATE POLICY "documents_auth_update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'documents');

DROP POLICY IF EXISTS "documents_auth_delete" ON storage.objects;
CREATE POLICY "documents_auth_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'documents');

-- 7. Verificação
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'composer_documents'
ORDER BY ordinal_position;

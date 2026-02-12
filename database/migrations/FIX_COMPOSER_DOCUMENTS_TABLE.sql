-- =============================================
-- FIX: Criar tabela composer_documents + bucket documents
-- Os documentos do onboarding do compositor não estão sendo salvos
-- porque a tabela e o bucket não existem.
-- Execute no Supabase SQL Editor
-- =============================================

-- 1. Criar tabela composer_documents
CREATE TABLE IF NOT EXISTS public.composer_documents (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  composer_id uuid NOT NULL REFERENCES public.composers(id) ON DELETE CASCADE,
  document_type text NOT NULL DEFAULT 'documento',
  document_number text,
  document_image text, -- path no storage ou URL
  expected_name text,
  extracted_name text,
  status text NOT NULL DEFAULT 'pending', -- pending, approved, rejected
  admin_notes text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Índices
CREATE INDEX IF NOT EXISTS idx_composer_documents_composer_id ON public.composer_documents(composer_id);
CREATE INDEX IF NOT EXISTS idx_composer_documents_status ON public.composer_documents(status);

-- 3. RLS permissiva
ALTER TABLE public.composer_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "composer_documents_select" ON public.composer_documents;
DROP POLICY IF EXISTS "composer_documents_insert" ON public.composer_documents;
DROP POLICY IF EXISTS "composer_documents_update" ON public.composer_documents;
DROP POLICY IF EXISTS "composer_documents_delete" ON public.composer_documents;

CREATE POLICY "composer_documents_select" ON public.composer_documents FOR SELECT USING (true);
CREATE POLICY "composer_documents_insert" ON public.composer_documents FOR INSERT WITH CHECK (true);
CREATE POLICY "composer_documents_update" ON public.composer_documents FOR UPDATE USING (true);
CREATE POLICY "composer_documents_delete" ON public.composer_documents FOR DELETE USING (true);

-- 4. Criar bucket 'documents' no Storage (se não existir)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false, -- privado por padrão (admin precisa ver)
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- 5. Políticas de Storage para o bucket documents
-- Permitir upload (INSERT) para qualquer usuário autenticado ou anon
DROP POLICY IF EXISTS "documents_upload" ON storage.objects;
CREATE POLICY "documents_upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'documents');

-- Permitir leitura (SELECT) para qualquer um (admin precisa ver)
DROP POLICY IF EXISTS "documents_read" ON storage.objects;
CREATE POLICY "documents_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'documents');

-- Permitir delete para admin
DROP POLICY IF EXISTS "documents_delete" ON storage.objects;
CREATE POLICY "documents_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'documents');

-- 6. Verificar
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'composer_documents'
ORDER BY ordinal_position;

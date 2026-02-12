-- =============================================
-- Criar tabela platform_notices (Avisos da Plataforma)
-- Execute no Supabase SQL Editor
-- =============================================

CREATE TABLE IF NOT EXISTS public.platform_notices (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  content text NOT NULL,
  published_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_platform_notices_published_at ON public.platform_notices(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_platform_notices_is_active ON public.platform_notices(is_active);

-- RLS
ALTER TABLE public.platform_notices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "platform_notices_select" ON public.platform_notices;
DROP POLICY IF EXISTS "platform_notices_insert" ON public.platform_notices;
DROP POLICY IF EXISTS "platform_notices_update" ON public.platform_notices;
DROP POLICY IF EXISTS "platform_notices_delete" ON public.platform_notices;

CREATE POLICY "platform_notices_select" ON public.platform_notices FOR SELECT USING (true);
CREATE POLICY "platform_notices_insert" ON public.platform_notices FOR INSERT WITH CHECK (true);
CREATE POLICY "platform_notices_update" ON public.platform_notices FOR UPDATE USING (true);
CREATE POLICY "platform_notices_delete" ON public.platform_notices FOR DELETE USING (true);

-- Verificar
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'platform_notices'
ORDER BY ordinal_position;

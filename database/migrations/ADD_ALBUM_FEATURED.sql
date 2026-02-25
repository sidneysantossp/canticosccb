-- =============================================
-- Adicionar suporte a álbuns em destaque no carrossel da home
-- Execute no Supabase SQL Editor
-- =============================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='albums' AND column_name='featured') THEN
    ALTER TABLE public.albums ADD COLUMN featured boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='albums' AND column_name='featured_order') THEN
    ALTER TABLE public.albums ADD COLUMN featured_order integer DEFAULT 0;
  END IF;
END $$;

-- Verificação
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'albums' AND column_name IN ('featured', 'featured_order')
ORDER BY ordinal_position;

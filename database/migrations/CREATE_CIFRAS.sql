-- =============================================
-- Migration: CREATE_CIFRAS
-- Description: Tabela para sistema de cifras musicais
-- =============================================

-- Tabela principal de cifras
CREATE TABLE IF NOT EXISTS cifras (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  artist VARCHAR(255) NOT NULL DEFAULT '',
  slug VARCHAR(255) NOT NULL UNIQUE,
  content TEXT NOT NULL DEFAULT '',
  original_key VARCHAR(10) NOT NULL DEFAULT 'C',
  instrument VARCHAR(50) NOT NULL DEFAULT 'violao',
  capo INT NOT NULL DEFAULT 0,
  cover_url TEXT DEFAULT NULL,
  hino_id VARCHAR(255) DEFAULT NULL,
  category VARCHAR(100) DEFAULT 'avulsos',
  views_count INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_cifras_slug ON cifras(slug);
CREATE INDEX IF NOT EXISTS idx_cifras_instrument ON cifras(instrument);
CREATE INDEX IF NOT EXISTS idx_cifras_category ON cifras(category);
CREATE INDEX IF NOT EXISTS idx_cifras_is_active ON cifras(is_active);
CREATE INDEX IF NOT EXISTS idx_cifras_title ON cifras(title);

-- RLS
ALTER TABLE cifras ENABLE ROW LEVEL SECURITY;

-- Política de leitura pública (cifras ativas)
CREATE POLICY "cifras_public_read" ON cifras
  FOR SELECT USING (is_active = true);

-- Política de leitura para admin (todas, inclusive inativas)
CREATE POLICY "cifras_admin_read" ON cifras
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.is_admin = true)
  );

-- Política de INSERT para admin
CREATE POLICY "cifras_admin_insert" ON cifras
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.is_admin = true)
  );

-- Política de UPDATE para admin
CREATE POLICY "cifras_admin_update" ON cifras
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.is_admin = true)
  );

-- Política de DELETE para admin
CREATE POLICY "cifras_admin_delete" ON cifras
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.is_admin = true)
  );

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_cifras_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cifras_updated_at
  BEFORE UPDATE ON cifras
  FOR EACH ROW
  EXECUTE FUNCTION update_cifras_updated_at();

-- Comentários
COMMENT ON TABLE cifras IS 'Cifras musicais com acordes e letras';
COMMENT ON COLUMN cifras.content IS 'Conteúdo da cifra em formato texto com acordes. Acordes ficam em linhas separadas acima da letra.';
COMMENT ON COLUMN cifras.original_key IS 'Tom original da cifra (ex: C, D, Em, G)';
COMMENT ON COLUMN cifras.instrument IS 'Instrumento principal: violao, guitarra, ukulele, teclado, cavaco';
COMMENT ON COLUMN cifras.capo IS 'Posição do capotraste (0 = sem capo)';
COMMENT ON COLUMN cifras.slug IS 'URL amigável gerada a partir do título';

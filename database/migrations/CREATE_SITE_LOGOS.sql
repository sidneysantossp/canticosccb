-- =============================================
-- Tabela: site_logos (já existe em produção)
-- Armazena logos e favicon do site
-- Tipos válidos: primary, secondary, favicon, social
-- Storage bucket: logos
-- =============================================
-- NOTA: Esta tabela já foi criada manualmente no Supabase.
-- Este arquivo serve apenas como referência do schema.

CREATE TABLE IF NOT EXISTS site_logos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL UNIQUE CHECK (type IN ('primary', 'secondary', 'favicon', 'social')),
  name TEXT NOT NULL,
  url TEXT NOT NULL DEFAULT '',
  width INTEGER DEFAULT 0,
  height INTEGER DEFAULT 0,
  file_size INTEGER,
  format TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed com os tipos padrão
INSERT INTO site_logos (type, name, url, width, height) VALUES
  ('primary',   'Logo Principal (Claro)',       'https://canticosccb.com.br/logo-canticos-ccb.png', 300, 80),
  ('secondary', 'Logo Alternativo (Escuro)',    '', 0, 0),
  ('favicon',   'Favicon',                      '/icons/favicon.svg', 32, 32),
  ('social',    'Imagem para Redes Sociais',    'https://canticosccb.com.br/logo-canticos-ccb.png', 1200, 630)
ON CONFLICT (type) DO NOTHING;

-- RLS: leitura pública, escrita apenas admin
ALTER TABLE site_logos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "site_logos_select_public" ON site_logos;
CREATE POLICY "site_logos_select_public" ON site_logos
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "site_logos_all_admin" ON site_logos;
CREATE POLICY "site_logos_all_admin" ON site_logos
  FOR ALL USING (
    auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
    )
  );

-- =============================================
-- Tabela: site_logos
-- Armazena logos e favicon do site
-- =============================================

CREATE TABLE IF NOT EXISTS site_logos (
  id SERIAL PRIMARY KEY,
  type TEXT NOT NULL UNIQUE CHECK (type IN ('primary', 'secondary', 'dark', 'light', 'favicon', 'social', 'icon', 'watermark')),
  name TEXT NOT NULL,
  url TEXT NOT NULL DEFAULT '',
  width INTEGER DEFAULT 0,
  height INTEGER DEFAULT 0,
  file_size INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed com os tipos padrão
INSERT INTO site_logos (type, name, url, width, height) VALUES
  ('primary',   'Logo Principal',    'https://canticosccb.com.br/logo-canticos-ccb.png', 300, 80),
  ('dark',      'Logo Escuro',       '', 0, 0),
  ('favicon',   'Favicon',           '/icons/favicon.svg', 32, 32),
  ('social',    'Imagem Social (OG)','https://canticosccb.com.br/logo-canticos-ccb.png', 1200, 630)
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
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

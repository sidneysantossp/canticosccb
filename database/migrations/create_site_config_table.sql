-- Apagar tabela anterior (se existir com colunas erradas)
DROP TABLE IF EXISTS site_config CASCADE;

-- Tabela para configurações globais do site (key-value)
CREATE TABLE site_config (
  id SERIAL PRIMARY KEY,
  config_key VARCHAR(255) UNIQUE NOT NULL,
  config_value TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir valor padrão para a seção Bíblia Narrada
INSERT INTO site_config (config_key, config_value) VALUES ('bible_narrated_section_enabled', 'true')
ON CONFLICT (config_key) DO NOTHING;

-- RLS: permitir leitura pública, escrita apenas para admins
ALTER TABLE site_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leitura pública de site_config" ON site_config
  FOR SELECT USING (true);

CREATE POLICY "Admins podem modificar site_config" ON site_config
  FOR ALL USING (true);

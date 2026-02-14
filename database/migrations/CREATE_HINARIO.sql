-- ============================================
-- TABELA: hinario
-- Letras do Hinário da CCB (hinos numerados)
-- ============================================
CREATE TABLE IF NOT EXISTS hinario (
  id BIGSERIAL PRIMARY KEY,
  numero INT NOT NULL,
  titulo VARCHAR(500) NOT NULL,
  subtitulo VARCHAR(500) DEFAULT NULL,
  conteudo TEXT NOT NULL,              -- Versos separados por \n\n, cada verso com número
  categoria VARCHAR(100) DEFAULT 'hinario5',  -- hinario5, hinario4, etc.
  tags TEXT DEFAULT NULL,
  views_count INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_hinario_numero ON hinario(numero);
CREATE INDEX IF NOT EXISTS idx_hinario_titulo ON hinario(titulo);
CREATE INDEX IF NOT EXISTS idx_hinario_categoria ON hinario(categoria);
CREATE INDEX IF NOT EXISTS idx_hinario_is_active ON hinario(is_active);
CREATE UNIQUE INDEX IF NOT EXISTS idx_hinario_numero_categoria ON hinario(numero, categoria);

-- RLS
ALTER TABLE hinario ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "hinario_public_read" ON hinario;
CREATE POLICY "hinario_public_read" ON hinario
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "hinario_admin_all" ON hinario;
CREATE POLICY "hinario_admin_all" ON hinario
  FOR ALL USING (
    auth.role() = 'service_role'
    OR auth.jwt() ->> 'role' = 'admin'
  );

SELECT 'Tabela hinario criada com sucesso!' AS status;

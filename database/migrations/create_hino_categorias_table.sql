-- Tabela de relacionamento entre hinos e categorias (muitos-para-muitos)
CREATE TABLE IF NOT EXISTS hino_categorias (
  id SERIAL PRIMARY KEY,
  hino_id UUID NOT NULL,
  categoria_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(hino_id, categoria_id)
);

-- Chaves estrangeiras
ALTER TABLE hino_categorias 
  ADD CONSTRAINT fk_hino_categorias_hino 
  FOREIGN KEY (hino_id) REFERENCES hinos(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_hino_categorias_categoria 
  FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE CASCADE;

-- RLS
ALTER TABLE hino_categorias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leitura pública de hino_categorias" ON hino_categorias
  FOR SELECT USING (true);

CREATE POLICY "Admins podem modificar hino_categorias" ON hino_categorias
  FOR ALL USING (true);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_hino_categorias_hino_id ON hino_categorias(hino_id);
CREATE INDEX IF NOT EXISTS idx_hino_categorias_categoria_id ON hino_categorias(categoria_id);

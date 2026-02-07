-- Adicionar campos de SEO na tabela categorias
ALTER TABLE categorias
ADD COLUMN IF NOT EXISTS meta_title VARCHAR(255),
ADD COLUMN IF NOT EXISTS meta_description TEXT;

-- Comentários para documentação
COMMENT ON COLUMN categorias.meta_title IS 'Título SEO da categoria (meta tag title)';
COMMENT ON COLUMN categorias.meta_description IS 'Descrição SEO da categoria (meta tag description)';

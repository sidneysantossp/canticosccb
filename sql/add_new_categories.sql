-- Adicionar 3 novas categorias
INSERT INTO categorias (nome, slug, descricao, ativo, created_at, updated_at)
VALUES
  ('Orquestra', 'orquestra', 'Hinos tocados pela orquestra da CCB', TRUE, NOW(), NOW()),
  ('Coral Jovem', 'coral-jovem', 'Hinos cantados pelo coral de jovens', TRUE, NOW(), NOW()),
  ('Solista', 'solista', 'Hinos cantados por solistas', TRUE, NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;

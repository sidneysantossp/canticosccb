-- Corrigir caminhos das imagens de documentos

-- Ver caminhos atuais
SELECT id, compositor_id, document_type, image_path 
FROM document_reviews;

-- Atualizar caminhos (remover /media_protegida/ do início)
-- O stream.php já adiciona o caminho completo
UPDATE document_reviews 
SET image_path = REPLACE(image_path, '/media_protegida/documents/', '')
WHERE image_path LIKE '/media_protegida/documents/%';

-- Verificar resultado
SELECT id, compositor_id, document_type, image_path 
FROM document_reviews;

-- Se ainda não funcionar, pode usar caminho completo da API:
-- UPDATE document_reviews 
-- SET image_path = CONCAT('/api/stream.php?type=documents&file=', 
--     SUBSTRING_INDEX(image_path, '/', -1))
-- WHERE image_path LIKE '/media_protegida/%';

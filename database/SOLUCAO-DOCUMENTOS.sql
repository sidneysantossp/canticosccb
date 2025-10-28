-- =========================================
-- SOLUÇÃO COMPLETA PARA DOCUMENTOS
-- =========================================

-- PASSO 1: Ver o que existe atualmente
SELECT 
    id,
    compositor_id,
    document_type,
    image_path,
    status
FROM document_reviews
ORDER BY id DESC;

-- PASSO 2: Deletar documentos de teste antigos (opcional)
-- DELETE FROM document_reviews WHERE compositor_id = 2;

-- PASSO 3: Inserir documento com caminho correto
INSERT INTO document_reviews (
    compositor_id,
    document_type,
    expected_name,
    extracted_name,
    similarity,
    status,
    image_path,
    created_at
) VALUES (
    2,
    'rg',
    'Acervo Cânticos CCB',
    'Acervo Canticos CCB',
    0.95,
    'pending',
    '/media_protegida/documents/test-rg.jpg',
    NOW()
);

-- PASSO 4: Verificar se foi inserido
SELECT 
    id,
    compositor_id,
    document_type,
    expected_name,
    image_path,
    status,
    created_at
FROM document_reviews
WHERE compositor_id = 2
ORDER BY id DESC
LIMIT 3;

-- PASSO 5: Se o documento já existir, apenas atualizar o caminho
-- UPDATE document_reviews 
-- SET image_path = '/media_protegida/documents/test-rg.jpg'
-- WHERE id = 3;  -- TROQUE 3 pelo ID correto

-- Inserir documentos de teste para verificação

-- Limpar documentos de teste anteriores (opcional)
-- DELETE FROM document_reviews WHERE document_type IN ('rg', 'cpf');

-- Inserir documentos para o compositor Acervo Cânticos CCB (id=2)
INSERT INTO document_reviews (
    compositor_id,
    document_type,
    expected_name,
    extracted_name,
    similarity,
    status,
    image_path,
    created_at
) VALUES
(
    2,
    'rg',
    'Acervo Cânticos CCB',
    'Acervo Canticos CCB',
    0.95,
    'pending',
    '/media_protegida/documents/test-rg.jpg',
    NOW()
),
(
    2,
    'cpf',
    'Acervo Cânticos CCB',
    'Acervo Canticos CCB',
    0.98,
    'pending',
    '/media_protegida/documents/test-rg.jpg',
    NOW()
);

-- Verificar os documentos inseridos
SELECT 
    dr.id,
    dr.compositor_id,
    c.nome as compositor,
    dr.document_type,
    dr.expected_name,
    dr.extracted_name,
    dr.status,
    dr.created_at
FROM document_reviews dr
JOIN compositores c ON dr.compositor_id = c.id
WHERE dr.compositor_id = 2
ORDER BY dr.created_at DESC;

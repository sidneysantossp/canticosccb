-- Verificar tabela document_reviews

-- 1. Verificar se a tabela existe
SHOW TABLES LIKE 'document_reviews';

-- 2. Ver estrutura da tabela
DESCRIBE document_reviews;

-- 3. Ver todos os documentos
SELECT * FROM document_reviews;

-- 4. Ver documentos por compositor
SELECT 
    dr.id,
    dr.compositor_id,
    c.nome as compositor_nome,
    dr.document_type,
    dr.status,
    dr.image_path,
    dr.created_at
FROM document_reviews dr
LEFT JOIN compositores c ON dr.compositor_id = c.id
ORDER BY dr.created_at DESC;

-- 5. Contar documentos por compositor
SELECT 
    compositor_id,
    c.nome,
    COUNT(*) as total_documentos,
    SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pendentes,
    SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as aprovados,
    SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejeitados
FROM document_reviews dr
LEFT JOIN compositores c ON dr.compositor_id = c.id
GROUP BY compositor_id, c.nome;

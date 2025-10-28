-- Seed para testar sistema de gerentes de compositores
-- Criar vínculos de teste entre admin e compositores

-- Limpar dados de teste anteriores
DELETE FROM compositor_gerentes WHERE gerente_usuario_id = 4;

-- Admin (ID 4) gerencia os compositores 2 e 3
INSERT INTO compositor_gerentes (
    compositor_id, 
    gerente_usuario_id, 
    status, 
    notas, 
    convidado_em, 
    aceito_em
) VALUES 
(2, 4, 'ativo', 'Gerenciamento do acervo principal', NOW(), NOW()),
(3, 4, 'ativo', 'Gerenciamento de compositores verificados', NOW(), NOW());

-- Verificar resultado
SELECT 
    cg.id,
    cg.status,
    c.nome_artistico AS compositor,
    u.nome AS gerente
FROM compositor_gerentes cg
JOIN compositores c ON cg.compositor_id = c.id
JOIN usuarios u ON cg.gerente_usuario_id = u.id
WHERE cg.gerente_usuario_id = 4;

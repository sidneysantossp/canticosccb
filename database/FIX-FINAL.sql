-- ========================================
-- SOLUÇÃO FINAL - CRIAR CONVITE AUTOMATICAMENTE
-- Execute tudo de uma vez no phpMyAdmin
-- ========================================

-- Limpar tabelas
DELETE FROM compositor_convites_notificacoes;
DELETE FROM compositor_gerentes;

-- Criar convite usando o PRIMEIRO compositor disponível
INSERT INTO compositor_gerentes (compositor_id, gerente_usuario_id, status, notas, convidado_em)
SELECT 
    (SELECT MIN(id) FROM compositores) as compositor_id,
    u.id as gerente_usuario_id,
    'pendente' as status,
    'Convite de teste para gerenciar conta' as notas,
    NOW() as convidado_em
FROM usuarios u
WHERE u.email = 'sid.websp@gmail.com'
LIMIT 1;

-- Mostrar resultado
SELECT 
    'SUCESSO! Convite criado na tabela CORRETA!' as mensagem,
    cg.id as convite_id,
    c.id as compositor_id,
    c.nome as compositor,
    u.id as usuario_id,
    u.email as gerente,
    cg.status
FROM compositor_gerentes cg
JOIN compositores c ON c.id = cg.compositor_id
JOIN usuarios u ON u.id = cg.gerente_usuario_id
WHERE u.email = 'sid.websp@gmail.com';

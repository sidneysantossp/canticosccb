-- ========================================
-- CORRIGIR CONVITE - CRIAR NA TABELA CERTA
-- ========================================

-- PASSO 1: Limpar tabela de notificações (está errada)
DELETE FROM compositor_convites_notificacoes;

-- PASSO 2: Limpar convites antigos da tabela correta
DELETE FROM compositor_gerentes;

-- PASSO 3: Ver compositores disponíveis
SELECT id, nome FROM compositores;

-- ⚠️ ANOTE UM ID (exemplo: 1 ou 5 ou 7)

-- PASSO 4: Criar convite NA TABELA CORRETA
-- ⚠️ SUBSTITUA O 999 PELO ID DO COMPOSITOR!

INSERT INTO compositor_gerentes (compositor_id, gerente_usuario_id, status, notas, convidado_em)
SELECT 
    999 as compositor_id,
    u.id as gerente_usuario_id,
    'pendente' as status,
    'Convite de teste' as notas,
    NOW() as convidado_em
FROM usuarios u
WHERE u.email = 'sid.websp@gmail.com'
LIMIT 1;

-- PASSO 5: Verificar
SELECT 
    cg.id,
    cg.compositor_id,
    c.nome as compositor,
    cg.gerente_usuario_id,
    u.email as gerente,
    cg.status,
    cg.convidado_em
FROM compositor_gerentes cg
JOIN compositores c ON c.id = cg.compositor_id
JOIN usuarios u ON u.id = cg.gerente_usuario_id
WHERE u.email = 'sid.websp@gmail.com';

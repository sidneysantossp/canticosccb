-- SOLUÇÃO AUTOMÁTICA - Execute tudo de uma vez

-- 1. Criar compositor se não existir
INSERT IGNORE INTO compositores (id, nome, nome_artistico, usuario_id, biografia, criado_em)
VALUES (1, 'Sidney Santos', 'Sidney Compositor', 1, 'Compositor de teste', NOW());

-- 2. Limpar convites antigos
DELETE FROM compositor_gerentes 
WHERE gerente_usuario_id IN (
    SELECT id FROM usuarios WHERE email = 'sid.websp@gmail.com'
);

-- 3. Criar novo convite
INSERT INTO compositor_gerentes (compositor_id, gerente_usuario_id, status, notas, convidado_em)
SELECT 
    1,
    u.id,
    'pendente',
    'Convite de teste para gerenciar conta',
    NOW()
FROM usuarios u
WHERE u.email = 'sid.websp@gmail.com'
LIMIT 1;

-- 4. Verificar resultado
SELECT 
    'Convite criado com sucesso!' as mensagem,
    cg.id,
    c.nome as compositor,
    u.email as gerente,
    cg.status
FROM compositor_gerentes cg
JOIN compositores c ON cg.compositor_id = c.id
JOIN usuarios u ON cg.gerente_usuario_id = u.id
WHERE u.email = 'sid.websp@gmail.com';

-- ========================================
-- SOLUÇÃO COMPLETA - EXECUTE TUDO DE UMA VEZ
-- ========================================

-- PASSO 1: Criar compositor (ignora se já existir)
INSERT INTO compositores (nome, nome_artistico, biografia, verificado, ativo)
VALUES ('Sidney Santos', 'Sidney Compositor', 'Compositor de teste', 1, 1)
ON DUPLICATE KEY UPDATE nome = nome;

-- PASSO 2: Pegar o ID do compositor que acabamos de criar
SET @compositor_id = LAST_INSERT_ID();

-- Se LAST_INSERT_ID() retornar 0, pegar o primeiro compositor da tabela
SELECT IFNULL(@compositor_id, (SELECT MIN(id) FROM compositores)) INTO @compositor_id;

-- PASSO 3: Pegar o ID do usuário sid.websp@gmail.com
SELECT id INTO @usuario_id FROM usuarios WHERE email = 'sid.websp@gmail.com' LIMIT 1;

-- PASSO 4: Deletar convites antigos desse usuário
DELETE FROM compositor_gerentes WHERE gerente_usuario_id = @usuario_id;

-- PASSO 5: Criar novo convite
INSERT INTO compositor_gerentes (compositor_id, gerente_usuario_id, status, notas, convidado_em)
VALUES (@compositor_id, @usuario_id, 'pendente', 'Convite de teste', NOW());

-- PASSO 6: Mostrar resultado
SELECT 
    '✅ CONVITE CRIADO COM SUCESSO!' as resultado,
    cg.id as convite_id,
    c.id as compositor_id,
    c.nome as compositor_nome,
    u.id as usuario_id,
    u.email as usuario_email,
    cg.status
FROM compositor_gerentes cg
JOIN compositores c ON cg.compositor_id = c.id
JOIN usuarios u ON cg.gerente_usuario_id = u.id
WHERE u.email = 'sid.websp@gmail.com';

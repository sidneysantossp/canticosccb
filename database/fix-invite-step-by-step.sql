-- PASSO A PASSO PARA CRIAR CONVITE

-- PASSO 1: Verificar compositores existentes
SELECT '===== PASSO 1: Compositores Existentes =====' as info;
SELECT id, nome, nome_artistico FROM compositores;

-- PASSO 2: Verificar usuários
SELECT '===== PASSO 2: Usuários =====' as info;
SELECT id, nome, email FROM usuarios WHERE email = 'sid.websp@gmail.com';

-- PASSO 3: Se não houver compositor, criar um de teste
-- Descomente as linhas abaixo se não houver compositor na tabela:
/*
INSERT INTO compositores (nome, nome_artistico, usuario_id, biografia, criado_em)
VALUES (
    'João Compositor',
    'João Silva',
    1,
    'Compositor de teste',
    NOW()
);
*/

-- PASSO 4: Ver qual compositor_id foi criado
SELECT '===== PASSO 3: Compositor Criado =====' as info;
SELECT id, nome FROM compositores ORDER BY id DESC LIMIT 1;

-- PASSO 5: Criar convite usando o compositor_id correto
-- IMPORTANTE: Substitua o número 1 abaixo pelo ID do compositor que apareceu acima
/*
INSERT INTO compositor_gerentes (compositor_id, gerente_usuario_id, status, notas, convidado_em)
VALUES (
    1,
    (SELECT id FROM usuarios WHERE email = 'sid.websp@gmail.com'),
    'pendente',
    'Convite de teste',
    NOW()
);
*/

-- PASSO 6: Verificar resultado final
SELECT '===== PASSO 4: Verificação Final =====' as info;
SELECT 
    cg.id,
    cg.compositor_id,
    c.nome as compositor_nome,
    u.email as gerente_email,
    cg.status,
    cg.convidado_em
FROM compositor_gerentes cg
JOIN compositores c ON cg.compositor_id = c.id
JOIN usuarios u ON cg.gerente_usuario_id = u.id
WHERE u.email = 'sid.websp@gmail.com';

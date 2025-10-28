-- Script para testar convites de gerenciamento

-- 1. Verificar usuário sid.websp@gmail.com
SELECT '=== VERIFICANDO USUÁRIO ===' as info;
SELECT * FROM usuarios WHERE email = 'sid.websp@gmail.com';

-- 2. Se não existir, criar
INSERT IGNORE INTO usuarios (nome, email, senha, tipo, ativo, criado_em)
VALUES ('Sidney Santos', 'sid.websp@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'usuario', 1, NOW());

-- 3. Ver ID do usuário
SELECT '=== ID DO USUÁRIO ===' as info;
SELECT id, nome, email FROM usuarios WHERE email = 'sid.websp@gmail.com';

-- 4. Verificar compositores existentes
SELECT '=== COMPOSITORES EXISTENTES ===' as info;
SELECT id, nome, nome_artistico, usuario_id FROM compositores;

-- 5. Ver convites existentes
SELECT '=== CONVITES EXISTENTES ===' as info;
SELECT 
    cg.id,
    cg.compositor_id,
    c.nome as compositor_nome,
    cg.gerente_usuario_id,
    u.email as gerente_email,
    cg.status,
    cg.convidado_em
FROM compositor_gerentes cg
JOIN compositores c ON cg.compositor_id = c.id
JOIN usuarios u ON cg.gerente_usuario_id = u.id;

-- 6. CRIAR CONVITE DE TESTE (ajuste os IDs conforme necessário)
-- Substitua 1 pelo ID do compositor e 2 pelo ID do usuário sid.websp@gmail.com
/*
INSERT INTO compositor_gerentes (compositor_id, gerente_usuario_id, status, notas, convidado_em)
VALUES (
    1,  -- ID do compositor (ajuste conforme necessário)
    (SELECT id FROM usuarios WHERE email = 'sid.websp@gmail.com'),
    'pendente',
    'Convite de teste para gerenciar conta',
    NOW()
);
*/

-- 7. Ver resultado
SELECT '=== VERIFICAÇÃO FINAL ===' as info;
SELECT 
    cg.id,
    cg.compositor_id,
    c.nome as compositor_nome,
    c.nome_artistico,
    cg.gerente_usuario_id,
    u.email as gerente_email,
    u.nome as gerente_nome,
    cg.status,
    cg.convidado_em,
    cg.notas
FROM compositor_gerentes cg
JOIN compositores c ON cg.compositor_id = c.id
JOIN usuarios u ON cg.gerente_usuario_id = u.id
WHERE u.email = 'sid.websp@gmail.com';

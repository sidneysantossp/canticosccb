-- Script para debug de gerentes

-- 1. Verificar se o usuário sid.websp@gmail.com existe
SELECT 'Verificando usuário' as step;
SELECT * FROM usuarios WHERE email = 'sid.websp@gmail.com';

-- 2. Se não existir, criar usuário
INSERT IGNORE INTO usuarios (nome, email, senha, tipo, ativo, criado_em)
VALUES ('Sidney Santos', 'sid.websp@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'usuario', 1, NOW());

-- 3. Verificar convites existentes para compositor 19
SELECT 'Verificando convites existentes' as step;
SELECT cg.*, u.nome, u.email 
FROM compositor_gerentes cg
JOIN usuarios u ON cg.gerente_usuario_id = u.id
WHERE cg.compositor_id = 1
ORDER BY cg.convidado_em DESC;

-- 4. Deletar convites duplicados ou antigos (se necessário)
-- DELETE FROM compositor_gerentes WHERE compositor_id = 1 AND status = 'recusado';

-- 5. Verificar compositores
SELECT 'Verificando compositores' as step;
SELECT id, nome, nome_artistico, usuario_id FROM compositores;

-- 6. Verificar tabela de notificações
SELECT 'Verificando notificações' as step;
SELECT * FROM compositor_convites_notificacoes;

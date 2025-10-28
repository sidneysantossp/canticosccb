-- Verificar convite e usuário
USE canticosccb_plataforma;

-- 1. Ver dados do usuário
SELECT 'USUARIO:' as Info;
SELECT id, nome, email FROM usuarios WHERE email = 'sid.websp@gmail.com';

-- 2. Ver convites para esse usuário
SELECT 'CONVITES PARA ESSE USUARIO:' as Info;
SELECT cg.*, u.nome as gerente_nome, u.email as gerente_email, c.nome as compositor_nome
FROM compositor_gerentes cg
LEFT JOIN usuarios u ON u.id = cg.gerente_usuario_id
LEFT JOIN compositores c ON c.id = cg.compositor_id
WHERE cg.gerente_usuario_id = 8;

-- 3. Ver TODOS os convites
SELECT 'TODOS OS CONVITES:' as Info;
SELECT cg.*, u.nome as gerente_nome, u.email as gerente_email
FROM compositor_gerentes cg
LEFT JOIN usuarios u ON u.id = cg.gerente_usuario_id
ORDER BY cg.id DESC;

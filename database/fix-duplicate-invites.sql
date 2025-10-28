-- Script para limpar convites duplicados e resetar o sistema

-- 1. Ver todos os convites do compositor 1
SELECT 'CONVITES ATUAIS:' as info;
SELECT cg.id, cg.compositor_id, cg.gerente_usuario_id, u.email, cg.status, cg.convidado_em
FROM compositor_gerentes cg
JOIN usuarios u ON cg.gerente_usuario_id = u.id
WHERE cg.compositor_id = 1;

-- 2. OPÇÃO A: Deletar TODOS os convites do compositor 1 (para começar do zero)
-- DELETE FROM compositor_gerentes WHERE compositor_id = 1;

-- 3. OPÇÃO B: Deletar apenas convites para sid.websp@gmail.com
DELETE FROM compositor_gerentes 
WHERE compositor_id = 1 
  AND gerente_usuario_id = (SELECT id FROM usuarios WHERE email = 'sid.websp@gmail.com');

-- 4. Verificar após deletar
SELECT 'CONVITES APÓS LIMPEZA:' as info;
SELECT cg.id, cg.compositor_id, cg.gerente_usuario_id, u.email, cg.status, cg.convidado_em
FROM compositor_gerentes cg
JOIN usuarios u ON cg.gerente_usuario_id = u.id
WHERE cg.compositor_id = 1;

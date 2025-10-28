-- ==============================================
-- LIMPAR CONVITES ANTIGOS E TESTAR NOTIFICAÇÕES
-- ==============================================

USE canticosccb_plataforma;

-- 1. Verificar convites existentes
SELECT 'CONVITES EXISTENTES:' as Status;
SELECT cg.id, c.nome as compositor, u.email as gerente_email, cg.status
FROM compositor_gerentes cg
JOIN compositores c ON c.id = cg.compositor_id
JOIN usuarios u ON u.id = cg.gerente_usuario_id
ORDER BY cg.id DESC
LIMIT 10;

-- 2. Deletar convites pendentes antigos (para poder testar novamente)
DELETE FROM compositor_gerentes WHERE status = 'pendente';
SELECT 'Convites pendentes deletados!' as Status;

-- 3. Verificar notificações existentes
SELECT 'NOTIFICAÇÕES EXISTENTES:' as Status;
SELECT n.id, u.email, n.tipo, n.titulo, n.mensagem, n.lida
FROM notificacoes n
JOIN usuarios u ON u.id = n.usuario_id
ORDER BY n.id DESC
LIMIT 10;

-- 4. Deletar notificações antigas de teste (opcional)
-- DELETE FROM notificacoes WHERE tipo = 'convite';
-- SELECT 'Notificações de convite deletadas!' as Status;

-- FIM

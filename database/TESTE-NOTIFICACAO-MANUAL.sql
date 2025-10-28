-- Teste manual de notificação
USE canticosccb_plataforma;

-- 1. Buscar ID do usuário sid.websp@gmail.com
SELECT 'Buscando usuário...' as Status;
SELECT id, nome, email FROM usuarios WHERE email = 'sid.websp@gmail.com';

-- 2. Criar notificação de teste
INSERT INTO notificacoes (usuario_id, tipo, titulo, mensagem, link)
SELECT id, 'convite', 'Teste de Notificação', 'Esta é uma notificação de teste para verificar se o sistema está funcionando!', '/composer/managers'
FROM usuarios WHERE email = 'sid.websp@gmail.com';

SELECT 'Notificação criada!' as Status;

-- 3. Verificar se foi criada
SELECT * FROM notificacoes ORDER BY id DESC LIMIT 1;

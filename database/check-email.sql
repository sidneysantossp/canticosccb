-- Verificar se o email existe

-- 1. Buscar na tabela usuarios
SELECT id, nome, email, tipo, ativo 
FROM usuarios 
WHERE email = 'compositor@canticosccb.com.br';

-- 2. Buscar na tabela compositores
SELECT c.*, u.email
FROM compositores c
LEFT JOIN usuarios u ON c.usuario_id = u.id
WHERE u.email = 'compositor@canticosccb.com.br';

-- 3. Ver todos os emails cadastrados
SELECT id, nome, email, tipo 
FROM usuarios 
ORDER BY created_at DESC 
LIMIT 10;

-- 4. SOLUÇÃO: Deletar o usuário se for um teste
-- DELETE FROM usuarios WHERE email = 'compositor@canticosccb.com.br';

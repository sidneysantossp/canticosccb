-- Limpar email de teste do banco de dados
-- Execute este arquivo se quiser testar novamente com o mesmo email

DELETE FROM usuarios WHERE email = 'sid.websp@gmail.com';

-- Verificar se foi removido
SELECT * FROM usuarios WHERE email = 'sid.websp@gmail.com';

-- Verificar estrutura da tabela usuarios
USE canticosccb_plataforma;

DESCRIBE usuarios;

-- Ver dados atuais do seu usuário
SELECT id, nome, email, telefone, localizacao, data_nascimento, biografia, created_at
FROM usuarios 
WHERE email = 'sid.websp@gmail.com';

-- Popular dados de teste (ajuste o email se necessário)
UPDATE usuarios 
SET 
  telefone = '(11) 98765-4321',
  localizacao = 'São Paulo, SP',
  data_nascimento = '1990-01-15',
  biografia = 'Esta é minha biografia de teste.'
WHERE email = 'sid.websp@gmail.com';

-- Verificar se atualizou
SELECT id, nome, email, telefone, localizacao, data_nascimento, biografia
FROM usuarios 
WHERE email = 'sid.websp@gmail.com';

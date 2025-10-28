-- Verificar estrutura da tabela usuarios
USE canticosccb_plataforma;

SHOW CREATE TABLE usuarios;

SELECT ENGINE, TABLE_COLLATION 
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'canticosccb_plataforma' 
AND TABLE_NAME = 'usuarios';

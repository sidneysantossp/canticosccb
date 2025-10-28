USE canticosccb_plataforma;

-- Resetar senha do Sidney para: senha123
UPDATE usuarios 
SET senha = '$2y$10$xGvI4kZc.3mQa8xhvGG7/.3kYWBVWJxLqZ6zN6KvY0I7.H9xKVq0K'
WHERE email = 'sid.websp@gmail.com';

SELECT 'Senha resetada para: senha123' as Info;
SELECT id, nome, email FROM usuarios WHERE email = 'sid.websp@gmail.com';

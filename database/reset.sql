-- ============================================
-- RESET COMPLETO DO BANCO
-- CUIDADO: Este script APAGA TODOS OS DADOS!
-- ============================================

USE canticosccb_plataforma;

-- Desabilitar checagem de chaves estrangeiras temporariamente
SET FOREIGN_KEY_CHECKS = 0;

-- Limpar todas as tabelas
TRUNCATE TABLE `hinos`;
TRUNCATE TABLE `albuns`;
TRUNCATE TABLE `generos`;
TRUNCATE TABLE `categorias`;
TRUNCATE TABLE `compositores`;
TRUNCATE TABLE `usuarios`;

-- Reabilitar checagem de chaves estrangeiras
SET FOREIGN_KEY_CHECKS = 1;

-- Resetar AUTO_INCREMENT
ALTER TABLE `hinos` AUTO_INCREMENT = 1;
ALTER TABLE `albuns` AUTO_INCREMENT = 1;
ALTER TABLE `generos` AUTO_INCREMENT = 1;
ALTER TABLE `categorias` AUTO_INCREMENT = 1;
ALTER TABLE `compositores` AUTO_INCREMENT = 1;
ALTER TABLE `usuarios` AUTO_INCREMENT = 1;

SELECT 'Banco de dados resetado com sucesso!' AS status;

-- ============================================
-- REMOVER TODAS AS TABELAS
-- CUIDADO: Este script APAGA O SCHEMA COMPLETO!
-- ============================================

USE canticosccb_plataforma;

-- Desabilitar checagem de chaves estrangeiras
SET FOREIGN_KEY_CHECKS = 0;

-- Remover todas as tabelas
DROP TABLE IF EXISTS `hinos`;
DROP TABLE IF EXISTS `albuns`;
DROP TABLE IF EXISTS `generos`;
DROP TABLE IF EXISTS `categorias`;
DROP TABLE IF EXISTS `compositores`;
DROP TABLE IF EXISTS `usuarios`;

-- Reabilitar checagem de chaves estrangeiras
SET FOREIGN_KEY_CHECKS = 1;

SELECT 'Todas as tabelas foram removidas!' AS status;

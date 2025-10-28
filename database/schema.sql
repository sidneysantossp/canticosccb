-- ============================================
-- SCHEMA DO BANCO DE DADOS
-- Database: canticosccb_plataforma
-- ============================================

-- Usar o banco de dados
USE canticosccb_plataforma;

-- ============================================
-- 1. TABELA: usuarios
-- Autenticação 100% MySQL - Segura com bcrypt
-- ============================================
CREATE TABLE IF NOT EXISTS `usuarios` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `nome` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `senha` VARCHAR(255) NOT NULL COMMENT 'Hash bcrypt da senha',
  `avatar_url` TEXT DEFAULT NULL,
  `tipo` ENUM('usuario', 'compositor', 'admin') DEFAULT 'usuario',
  `ativo` TINYINT(1) DEFAULT 1,
  `ultimo_acesso` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_email` (`email`),
  INDEX `idx_tipo` (`tipo`),
  INDEX `idx_ativo` (`ativo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Autenticação MySQL - Senhas com bcrypt (PASSWORD_DEFAULT)';

-- ============================================
-- 2. TABELA: compositores
-- ============================================
CREATE TABLE IF NOT EXISTS `compositores` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `nome` VARCHAR(255) NOT NULL,
  `nome_artistico` VARCHAR(255) DEFAULT NULL,
  `biografia` TEXT DEFAULT NULL,
  `avatar_url` TEXT DEFAULT NULL,
  `verificado` TINYINT(1) DEFAULT 0,
  `ativo` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_nome` (`nome`),
  INDEX `idx_verificado` (`verificado`),
  INDEX `idx_ativo` (`ativo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 3. TABELA: categorias
-- ============================================
CREATE TABLE IF NOT EXISTS `categorias` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `nome` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL UNIQUE,
  `descricao` TEXT DEFAULT NULL,
  `imagem_url` TEXT DEFAULT NULL,
  `ativo` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_slug` (`slug`),
  INDEX `idx_ativo` (`ativo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 4. TABELA: albuns
-- ============================================
CREATE TABLE IF NOT EXISTS `albuns` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `titulo` VARCHAR(255) NOT NULL,
  `descricao` TEXT DEFAULT NULL,
  `cover_url` TEXT DEFAULT NULL,
  `ano` INT DEFAULT NULL,
  `compositor_id` INT UNSIGNED DEFAULT NULL,
  `ativo` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_titulo` (`titulo`),
  INDEX `idx_compositor_id` (`compositor_id`),
  INDEX `idx_ativo` (`ativo`),
  FOREIGN KEY (`compositor_id`) REFERENCES `compositores`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 5. TABELA: hinos
-- ============================================
CREATE TABLE IF NOT EXISTS `hinos` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `numero` INT DEFAULT NULL,
  `titulo` VARCHAR(255) NOT NULL,
  `compositor` VARCHAR(255) DEFAULT NULL,
  `categoria` VARCHAR(100) DEFAULT NULL,
  `audio_url` TEXT NOT NULL,
  `cover_url` TEXT DEFAULT NULL,
  `duracao` VARCHAR(20) DEFAULT NULL,
  `letra` LONGTEXT DEFAULT NULL,
  `tags` TEXT DEFAULT NULL,
  `ativo` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_numero` (`numero`),
  INDEX `idx_titulo` (`titulo`),
  INDEX `idx_compositor` (`compositor`),
  INDEX `idx_categoria` (`categoria`),
  INDEX `idx_ativo` (`ativo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 6. TABELA: generos (para categorização)
-- ============================================
CREATE TABLE IF NOT EXISTS `generos` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `nome` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL UNIQUE,
  `descricao` TEXT DEFAULT NULL,
  `ativo` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_slug` (`slug`),
  INDEX `idx_ativo` (`ativo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- CONFIRMAÇÃO
-- ============================================
SELECT 'Schema criado com sucesso!' AS status;

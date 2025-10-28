-- ============================================
-- MIGRAÇÃO: Adicionar campos necessários para Compositores
-- Database: canticosccb_plataforma
-- ============================================

USE canticosccb_plataforma;

-- Adicionar campos na tabela compositores
ALTER TABLE `compositores`
ADD COLUMN `usuario_id` INT UNSIGNED DEFAULT NULL AFTER `id`,
ADD COLUMN `tipo_compositor` ENUM('solo', 'group', 'orchestra') DEFAULT 'solo' AFTER `biografia`,
ADD COLUMN `telefone` VARCHAR(20) DEFAULT NULL AFTER `tipo_compositor`,
ADD COLUMN `cep` VARCHAR(10) DEFAULT NULL AFTER `telefone`,
ADD COLUMN `endereco` VARCHAR(255) DEFAULT NULL AFTER `cep`,
ADD COLUMN `numero` VARCHAR(10) DEFAULT NULL AFTER `endereco`,
ADD COLUMN `complemento` VARCHAR(100) DEFAULT NULL AFTER `numero`,
ADD COLUMN `bairro` VARCHAR(100) DEFAULT NULL AFTER `complemento`,
ADD COLUMN `cidade` VARCHAR(100) DEFAULT NULL AFTER `bairro`,
ADD COLUMN `estado` VARCHAR(2) DEFAULT NULL AFTER `cidade`,
ADD COLUMN `website` VARCHAR(255) DEFAULT NULL AFTER `estado`,
ADD COLUMN `instagram` VARCHAR(100) DEFAULT NULL AFTER `website`,
ADD COLUMN `facebook` VARCHAR(100) DEFAULT NULL AFTER `instagram`,
ADD COLUMN `youtube` VARCHAR(100) DEFAULT NULL AFTER `facebook`,
ADD FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE;

-- Adicionar telefone na tabela usuarios
ALTER TABLE `usuarios`
ADD COLUMN `telefone` VARCHAR(20) DEFAULT NULL AFTER `email`;

-- Criar tabela de relacionamento compositor_categorias
CREATE TABLE IF NOT EXISTS `compositor_categorias` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `compositor_id` INT UNSIGNED NOT NULL,
  `categoria_id` INT UNSIGNED NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`compositor_id`) REFERENCES `compositores`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`categoria_id`) REFERENCES `categorias`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_compositor_categoria` (`compositor_id`, `categoria_id`),
  INDEX `idx_compositor` (`compositor_id`),
  INDEX `idx_categoria` (`categoria_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Relacionamento N:N entre compositores e categorias (gêneros)';

-- Migração concluída com sucesso!
-- Execute: SELECT * FROM compositores LIMIT 1; para verificar

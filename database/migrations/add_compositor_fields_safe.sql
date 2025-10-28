-- ============================================
-- MIGRAÇÃO SEGURA: Adicionar campos necessários para Compositores
-- Verifica se colunas existem antes de adicionar
-- Database: canticosccb_plataforma
-- ============================================

USE canticosccb_plataforma;

-- Adicionar usuario_id (se não existir)
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'canticosccb_plataforma' AND TABLE_NAME = 'compositores' AND COLUMN_NAME = 'usuario_id';
SET @query = IF(@col_exists = 0, 
    'ALTER TABLE compositores ADD COLUMN usuario_id INT UNSIGNED DEFAULT NULL AFTER id, ADD FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE', 
    'SELECT "usuario_id já existe" as info');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Adicionar tipo_compositor (se não existir)
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'canticosccb_plataforma' AND TABLE_NAME = 'compositores' AND COLUMN_NAME = 'tipo_compositor';
SET @query = IF(@col_exists = 0, 
    'ALTER TABLE compositores ADD COLUMN tipo_compositor ENUM(\'solo\', \'group\', \'orchestra\') DEFAULT \'solo\' AFTER biografia', 
    'SELECT "tipo_compositor já existe" as info');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Adicionar telefone em compositores (se não existir)
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'canticosccb_plataforma' AND TABLE_NAME = 'compositores' AND COLUMN_NAME = 'telefone';
SET @query = IF(@col_exists = 0, 
    'ALTER TABLE compositores ADD COLUMN telefone VARCHAR(20) DEFAULT NULL AFTER tipo_compositor', 
    'SELECT "telefone já existe" as info');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Adicionar cep (se não existir)
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'canticosccb_plataforma' AND TABLE_NAME = 'compositores' AND COLUMN_NAME = 'cep';
SET @query = IF(@col_exists = 0, 
    'ALTER TABLE compositores ADD COLUMN cep VARCHAR(10) DEFAULT NULL AFTER telefone', 
    'SELECT "cep já existe" as info');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Adicionar endereco (se não existir)
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'canticosccb_plataforma' AND TABLE_NAME = 'compositores' AND COLUMN_NAME = 'endereco';
SET @query = IF(@col_exists = 0, 
    'ALTER TABLE compositores ADD COLUMN endereco VARCHAR(255) DEFAULT NULL AFTER cep', 
    'SELECT "endereco já existe" as info');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Adicionar numero (se não existir)
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'canticosccb_plataforma' AND TABLE_NAME = 'compositores' AND COLUMN_NAME = 'numero';
SET @query = IF(@col_exists = 0, 
    'ALTER TABLE compositores ADD COLUMN numero VARCHAR(10) DEFAULT NULL AFTER endereco', 
    'SELECT "numero já existe" as info');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Adicionar complemento (se não existir)
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'canticosccb_plataforma' AND TABLE_NAME = 'compositores' AND COLUMN_NAME = 'complemento';
SET @query = IF(@col_exists = 0, 
    'ALTER TABLE compositores ADD COLUMN complemento VARCHAR(100) DEFAULT NULL AFTER numero', 
    'SELECT "complemento já existe" as info');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Adicionar bairro (se não existir)
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'canticosccb_plataforma' AND TABLE_NAME = 'compositores' AND COLUMN_NAME = 'bairro';
SET @query = IF(@col_exists = 0, 
    'ALTER TABLE compositores ADD COLUMN bairro VARCHAR(100) DEFAULT NULL AFTER complemento', 
    'SELECT "bairro já existe" as info');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Adicionar cidade (se não existir)
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'canticosccb_plataforma' AND TABLE_NAME = 'compositores' AND COLUMN_NAME = 'cidade';
SET @query = IF(@col_exists = 0, 
    'ALTER TABLE compositores ADD COLUMN cidade VARCHAR(100) DEFAULT NULL AFTER bairro', 
    'SELECT "cidade já existe" as info');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Adicionar estado (se não existir)
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'canticosccb_plataforma' AND TABLE_NAME = 'compositores' AND COLUMN_NAME = 'estado';
SET @query = IF(@col_exists = 0, 
    'ALTER TABLE compositores ADD COLUMN estado VARCHAR(2) DEFAULT NULL AFTER cidade', 
    'SELECT "estado já existe" as info');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Adicionar website (se não existir)
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'canticosccb_plataforma' AND TABLE_NAME = 'compositores' AND COLUMN_NAME = 'website';
SET @query = IF(@col_exists = 0, 
    'ALTER TABLE compositores ADD COLUMN website VARCHAR(255) DEFAULT NULL AFTER estado', 
    'SELECT "website já existe" as info');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Adicionar instagram (se não existir)
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'canticosccb_plataforma' AND TABLE_NAME = 'compositores' AND COLUMN_NAME = 'instagram';
SET @query = IF(@col_exists = 0, 
    'ALTER TABLE compositores ADD COLUMN instagram VARCHAR(100) DEFAULT NULL AFTER website', 
    'SELECT "instagram já existe" as info');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Adicionar facebook (se não existir)
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'canticosccb_plataforma' AND TABLE_NAME = 'compositores' AND COLUMN_NAME = 'facebook';
SET @query = IF(@col_exists = 0, 
    'ALTER TABLE compositores ADD COLUMN facebook VARCHAR(100) DEFAULT NULL AFTER instagram', 
    'SELECT "facebook já existe" as info');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Adicionar youtube (se não existir)
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'canticosccb_plataforma' AND TABLE_NAME = 'compositores' AND COLUMN_NAME = 'youtube';
SET @query = IF(@col_exists = 0, 
    'ALTER TABLE compositores ADD COLUMN youtube VARCHAR(100) DEFAULT NULL AFTER facebook', 
    'SELECT "youtube já existe" as info');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Adicionar telefone na tabela usuarios (se não existir)
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'canticosccb_plataforma' AND TABLE_NAME = 'usuarios' AND COLUMN_NAME = 'telefone';
SET @query = IF(@col_exists = 0, 
    'ALTER TABLE usuarios ADD COLUMN telefone VARCHAR(20) DEFAULT NULL AFTER email', 
    'SELECT "telefone em usuarios já existe" as info');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Criar tabela compositor_categorias (se não existir)
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

SELECT '✅ Migração concluída com sucesso!' as status;

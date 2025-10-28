-- ============================================
-- RELACIONAMENTOS ÁLBUNS E COLETÂNEAS
-- Many-to-many: Um hino pode estar em vários álbuns/coletâneas
-- ============================================

USE canticosccb_plataforma;

-- ============================================
-- 1. TABELA: album_hinos
-- Relacionamento N:N entre álbuns e hinos
-- ============================================
CREATE TABLE IF NOT EXISTS `album_hinos` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `album_id` INT UNSIGNED NOT NULL,
  `hino_id` INT UNSIGNED NOT NULL,
  `ordem` INT DEFAULT NULL COMMENT 'Ordem do hino no álbum (track number)',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_album_id` (`album_id`),
  INDEX `idx_hino_id` (`hino_id`),
  UNIQUE KEY `unique_album_hino` (`album_id`, `hino_id`),
  FOREIGN KEY (`album_id`) REFERENCES `albuns`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`hino_id`) REFERENCES `hinos`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Relacionamento Many-to-Many entre álbuns e hinos';

-- ============================================
-- 2. TABELA: coletanea_hinos
-- Relacionamento N:N entre coletâneas e hinos
-- ============================================
CREATE TABLE IF NOT EXISTS `coletanea_hinos` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `coletanea_id` INT UNSIGNED NOT NULL,
  `hino_id` INT UNSIGNED NOT NULL,
  `ordem` INT DEFAULT NULL COMMENT 'Ordem do hino na coletânea',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_coletanea_id` (`coletanea_id`),
  INDEX `idx_hino_id` (`hino_id`),
  UNIQUE KEY `unique_coletanea_hino` (`coletanea_id`, `hino_id`),
  FOREIGN KEY (`coletanea_id`) REFERENCES `albuns`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`hino_id`) REFERENCES `hinos`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Relacionamento Many-to-Many entre coletâneas e hinos';

-- ============================================
-- 3. Adicionar campo tipo em albuns
-- Para diferenciar álbum normal de coletânea
-- ============================================
ALTER TABLE `albuns` 
ADD COLUMN `tipo` ENUM('album', 'coletanea') DEFAULT 'album' AFTER `titulo`;

-- ============================================
-- CONFIRMAÇÃO
-- ============================================
SELECT 'Tabelas de relacionamento criadas com sucesso!' AS status;

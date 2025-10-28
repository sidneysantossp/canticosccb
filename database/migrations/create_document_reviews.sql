-- Tabela para revisão manual de documentos
USE canticosccb_plataforma;

CREATE TABLE IF NOT EXISTS `document_reviews` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `compositor_id` INT UNSIGNED NOT NULL,
  `document_type` ENUM('rg', 'cnh', 'passport', 'cpf') NOT NULL,
  `extracted_name` VARCHAR(255),
  `expected_name` VARCHAR(255) NOT NULL,
  `similarity` DECIMAL(5,2),
  `status` ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  `admin_notes` TEXT,
  `image_path` TEXT,
  `reviewed_by` INT UNSIGNED,
  `reviewed_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`compositor_id`) REFERENCES `compositores`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`reviewed_by`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL,
  INDEX `idx_status` (`status`),
  INDEX `idx_compositor` (`compositor_id`),
  INDEX `idx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Revisão manual de documentos de compositores';

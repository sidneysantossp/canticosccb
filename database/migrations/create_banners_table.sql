-- Tabela de banners para a Home (Hero/Promocionais/Contextuais)
CREATE TABLE IF NOT EXISTS `banners` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `image_url` VARCHAR(512) NOT NULL,
  `link_url` VARCHAR(512) NULL,
  `link_type` VARCHAR(32) NULL,
  `link_id` VARCHAR(64) NULL,
  `type` ENUM('hero','promotional','contextual') NOT NULL DEFAULT 'hero',
  `position` INT NOT NULL DEFAULT 1,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `gradient_overlay` VARCHAR(255) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_type` (`type`),
  INDEX `idx_active_pos` (`is_active`, `position`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Opcional: inserir um banner de exemplo
-- INSERT INTO `banners` (`title`, `description`, `image_url`, `type`, `position`, `is_active`, `gradient_overlay`)
-- VALUES ('Bem-vindo ao Cânticos CCB', 'Exemplo de banner hero', 'https://placehold.co/1920x820/1a1a1a/ffffff?text=Banner+Placeholder', 'hero', 1, 1, 'bg-gradient-to-br from-[#3b82f6]/80 to-[#8b5cf6]/80');

-- Tabela de likes de hinos
CREATE TABLE IF NOT EXISTS hino_likes (
  id INT(11) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  hino_id INT(11) NOT NULL,
  usuario_id INT(11) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_like (hino_id, usuario_id),
  INDEX idx_hino_id (hino_id),
  INDEX idx_usuario_id (usuario_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

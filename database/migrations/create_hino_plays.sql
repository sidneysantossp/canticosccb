-- Tabela de plays de hinos (eventos de reprodução)
CREATE TABLE IF NOT EXISTS hino_plays (
  id INT(11) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  hino_id INT(11) NOT NULL,
  compositor_id INT(11) UNSIGNED NOT NULL,
  usuario_id INT(11) NULL,
  played_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_hino_id (hino_id),
  INDEX idx_compositor_id (compositor_id),
  INDEX idx_usuario_id (usuario_id),
  INDEX idx_played_at (played_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

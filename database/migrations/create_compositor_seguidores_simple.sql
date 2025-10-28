-- Versão simplificada SEM foreign keys (para testar primeiro)
CREATE TABLE IF NOT EXISTS compositor_seguidores (
  id INT(11) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  compositor_id INT(11) UNSIGNED NOT NULL,
  usuario_id INT(11) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_compositor (compositor_id),
  INDEX idx_usuario (usuario_id),
  UNIQUE KEY unique_follow (compositor_id, usuario_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

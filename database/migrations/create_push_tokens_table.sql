-- Tabela para registrar tokens de push por usuário
CREATE TABLE IF NOT EXISTS push_tokens (
  id INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  usuario_id INT(10) UNSIGNED NULL,
  token VARCHAR(255) NOT NULL,
  plataforma ENUM('web','android','ios') DEFAULT 'web',
  ativo TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_push_tokens_token (token),
  KEY idx_push_tokens_usuario_id (usuario_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

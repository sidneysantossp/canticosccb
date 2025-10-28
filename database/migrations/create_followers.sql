-- Tabela de seguidores de usuários (idempotente)
USE canticosccb_plataforma;

SET @exists := (
  SELECT COUNT(*) FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = 'canticosccb_plataforma' AND TABLE_NAME = 'followers'
);
SET @sql := IF(@exists = 0,
  'CREATE TABLE followers (
     id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
     seguidor_usuario_id INT UNSIGNED NOT NULL,
     seguido_usuario_id INT UNSIGNED NOT NULL,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     UNIQUE KEY u_follow (seguidor_usuario_id, seguido_usuario_id),
     INDEX (seguido_usuario_id),
     INDEX (seguidor_usuario_id)
   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4',
  'SELECT "followers já existe"'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

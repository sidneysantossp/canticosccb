-- Tabela de favoritos (idempotente)
USE canticosccb_plataforma;

SET @exists := (
  SELECT COUNT(*) FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = 'canticosccb_plataforma' AND TABLE_NAME = 'favorites'
);
SET @sql := IF(@exists = 0,
  'CREATE TABLE favorites (
     id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
     usuario_id INT UNSIGNED NOT NULL,
     hino_id INT UNSIGNED NOT NULL,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     UNIQUE KEY u_fav (usuario_id, hino_id),
     INDEX (usuario_id), INDEX (hino_id)
   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4',
  'SELECT "favorites já existe"'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

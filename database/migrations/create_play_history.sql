-- Tabela de histórico de reprodução (idempotente)
USE canticosccb_plataforma;

SET @exists := (
  SELECT COUNT(*) FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = 'canticosccb_plataforma' AND TABLE_NAME = 'play_history'
);
SET @sql := IF(@exists = 0,
  'CREATE TABLE play_history (
     id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
     usuario_id INT UNSIGNED NOT NULL,
     hino_id INT UNSIGNED NOT NULL,
     started_at DATETIME NOT NULL,
     ended_at DATETIME NULL,
     duration_sec INT UNSIGNED DEFAULT 0,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     INDEX (usuario_id), INDEX (hino_id), INDEX (started_at)
   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4',
  'SELECT "play_history já existe"'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

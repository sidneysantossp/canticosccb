-- Tabelas de playlists do usuário (idempotente)
USE canticosccb_plataforma;

-- user_playlists
SET @exists := (
  SELECT COUNT(*) FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = 'canticosccb_plataforma' AND TABLE_NAME = 'user_playlists'
);
SET @sql := IF(@exists = 0,
  'CREATE TABLE user_playlists (
     id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
     usuario_id INT UNSIGNED NOT NULL,
     name VARCHAR(255) NOT NULL,
     description TEXT NULL,
     cover_url VARCHAR(512) NULL,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
     INDEX (usuario_id)
   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4',
  'SELECT "user_playlists já existe"'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- user_playlist_hinos
SET @exists := (
  SELECT COUNT(*) FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = 'canticosccb_plataforma' AND TABLE_NAME = 'user_playlist_hinos'
);
SET @sql := IF(@exists = 0,
  'CREATE TABLE user_playlist_hinos (
     playlist_id INT UNSIGNED NOT NULL,
     hino_id INT UNSIGNED NOT NULL,
     ordem INT UNSIGNED DEFAULT 0,
     PRIMARY KEY (playlist_id, hino_id),
     INDEX (hino_id)
   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4',
  'SELECT "user_playlist_hinos já existe"'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

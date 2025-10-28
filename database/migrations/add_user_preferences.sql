-- Adiciona preferências de usuário (execução idempotente)
USE canticosccb_plataforma;

-- notificacoes_email
SET @exists := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = 'canticosccb_plataforma' AND TABLE_NAME = 'usuarios' AND COLUMN_NAME = 'notificacoes_email');
SET @sql := IF(@exists = 0,
  'ALTER TABLE usuarios ADD COLUMN notificacoes_email TINYINT(1) DEFAULT 1 AFTER biografia',
  'SELECT "notificacoes_email já existe"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- reproducao_automatica
SET @exists := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = 'canticosccb_plataforma' AND TABLE_NAME = 'usuarios' AND COLUMN_NAME = 'reproducao_automatica');
SET @sql := IF(@exists = 0,
  'ALTER TABLE usuarios ADD COLUMN reproducao_automatica TINYINT(1) DEFAULT 1 AFTER notificacoes_email',
  'SELECT "reproducao_automatica já existe"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- perfil_publico
SET @exists := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = 'canticosccb_plataforma' AND TABLE_NAME = 'usuarios' AND COLUMN_NAME = 'perfil_publico');
SET @sql := IF(@exists = 0,
  'ALTER TABLE usuarios ADD COLUMN perfil_publico TINYINT(1) DEFAULT 0 AFTER reproducao_automatica',
  'SELECT "perfil_publico já existe"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SELECT '✅ add_user_preferences.sql concluído' AS status;

-- reproducao_sem_pausas
SET @exists := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = 'canticosccb_plataforma' AND TABLE_NAME = 'usuarios' AND COLUMN_NAME = 'reproducao_sem_pausas');
SET @sql := IF(@exists = 0,
  'ALTER TABLE usuarios ADD COLUMN reproducao_sem_pausas TINYINT(1) DEFAULT 1 AFTER perfil_publico',
  'SELECT "reproducao_sem_pausas já existe"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- crossfade
SET @exists := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = 'canticosccb_plataforma' AND TABLE_NAME = 'usuarios' AND COLUMN_NAME = 'crossfade');
SET @sql := IF(@exists = 0,
  'ALTER TABLE usuarios ADD COLUMN crossfade TINYINT(1) DEFAULT 0 AFTER reproducao_sem_pausas',
  'SELECT "crossfade já existe"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- qualidade_audio
SET @exists := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = 'canticosccb_plataforma' AND TABLE_NAME = 'usuarios' AND COLUMN_NAME = 'qualidade_audio');
SET @sql := IF(@exists = 0,
  'ALTER TABLE usuarios ADD COLUMN qualidade_audio VARCHAR(12) DEFAULT "high" AFTER crossfade',
  'SELECT "qualidade_audio já existe"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- qualidade_download
SET @exists := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = 'canticosccb_plataforma' AND TABLE_NAME = 'usuarios' AND COLUMN_NAME = 'qualidade_download');
SET @sql := IF(@exists = 0,
  'ALTER TABLE usuarios ADD COLUMN qualidade_download VARCHAR(12) DEFAULT "high" AFTER qualidade_audio',
  'SELECT "qualidade_download já existe"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- download_wifi_only
SET @exists := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = 'canticosccb_plataforma' AND TABLE_NAME = 'usuarios' AND COLUMN_NAME = 'download_wifi_only');
SET @sql := IF(@exists = 0,
  'ALTER TABLE usuarios ADD COLUMN download_wifi_only TINYINT(1) DEFAULT 1 AFTER qualidade_download',
  'SELECT "download_wifi_only já existe"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- mostrar_hinos_indisponiveis
SET @exists := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = 'canticosccb_plataforma' AND TABLE_NAME = 'usuarios' AND COLUMN_NAME = 'mostrar_hinos_indisponiveis');
SET @sql := IF(@exists = 0,
  'ALTER TABLE usuarios ADD COLUMN mostrar_hinos_indisponiveis TINYINT(1) DEFAULT 0 AFTER download_wifi_only',
  'SELECT "mostrar_hinos_indisponiveis já existe"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

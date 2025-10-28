-- Adiciona campos de perfil ao usuarios (execução idempotente)
USE canticosccb_plataforma;

-- telefone
SET @exists := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = 'canticosccb_plataforma' AND TABLE_NAME = 'usuarios' AND COLUMN_NAME = 'telefone');
SET @sql := IF(@exists = 0,
  'ALTER TABLE usuarios ADD COLUMN telefone VARCHAR(20) NULL AFTER email',
  'SELECT "telefone já existe"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- localizacao
SET @exists := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = 'canticosccb_plataforma' AND TABLE_NAME = 'usuarios' AND COLUMN_NAME = 'localizacao');
SET @sql := IF(@exists = 0,
  'ALTER TABLE usuarios ADD COLUMN localizacao VARCHAR(255) NULL AFTER telefone',
  'SELECT "localizacao já existe"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- data_nascimento
SET @exists := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = 'canticosccb_plataforma' AND TABLE_NAME = 'usuarios' AND COLUMN_NAME = 'data_nascimento');
SET @sql := IF(@exists = 0,
  'ALTER TABLE usuarios ADD COLUMN data_nascimento DATE NULL AFTER localizacao',
  'SELECT "data_nascimento já existe"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- biografia
SET @exists := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = 'canticosccb_plataforma' AND TABLE_NAME = 'usuarios' AND COLUMN_NAME = 'biografia');
SET @sql := IF(@exists = 0,
  'ALTER TABLE usuarios ADD COLUMN biografia TEXT NULL AFTER data_nascimento',
  'SELECT "biografia já existe"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SELECT '✅ add_user_profile_fields.sql concluído' AS status;

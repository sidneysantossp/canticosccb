# Script PowerShell para executar migration
$mysqlPath = "c:\xampp\mysql\bin\mysql.exe"
$sqlFile = "c:\xampp\htdocs\1canticosccb\database\migrations\create_push_tokens_table.sql"

Write-Host "Executando migration..." -ForegroundColor Green

try {
    # Executar SQL via MySQL command line
    & $mysqlPath -u root -D canticosccb_plataforma -e "CREATE TABLE IF NOT EXISTS push_tokens (id INT(10) UNSIGNED NOT NULL AUTO_INCREMENT, usuario_id INT(10) UNSIGNED NULL, token VARCHAR(255) NOT NULL, plataforma ENUM('web','android','ios') DEFAULT 'web', ativo TINYINT(1) DEFAULT 1, created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, PRIMARY KEY (id), UNIQUE KEY uq_push_tokens_token (token), KEY idx_push_tokens_usuario_id (usuario_id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;"
    
    Write-Host "Migration executada com sucesso!" -ForegroundColor Green
    Write-Host "Tabela push_tokens criada." -ForegroundColor Yellow
} catch {
    Write-Host "Erro na migration: $($_.Exception.Message)" -ForegroundColor Red
}

# Verificar se tabela foi criada
Write-Host "Verificando tabela..." -ForegroundColor Blue
& $mysqlPath -u root -D canticosccb_plataforma -e "SHOW TABLES LIKE 'push_tokens';"

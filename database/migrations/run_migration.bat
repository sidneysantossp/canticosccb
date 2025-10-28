@echo off
echo Executando migração SQL...
cd /d C:\xampp\mysql\bin
mysql.exe -u root canticosccb_plataforma < "C:\xampp\htdocs\1canticosccb\database\migrations\add_compositor_fields.sql"
if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo SUCESSO! Migração executada com sucesso
    echo ========================================
) else (
    echo.
    echo ========================================
    echo ERRO ao executar migração
    echo ========================================
)
pause

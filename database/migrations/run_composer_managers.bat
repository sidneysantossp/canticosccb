@echo off
echo Executando migration: create_composer_managers.sql
mysql -u root -p canticosccb_plataforma < create_composer_managers.sql
if %errorlevel% == 0 (
    echo Migration executada com sucesso!
) else (
    echo Erro ao executar migration!
)
pause

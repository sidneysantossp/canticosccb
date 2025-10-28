@echo off
echo Executando seed de compositor_gerentes...
mysql -u root canticosccb_plataforma < seed_compositor_gerentes.sql
if %errorlevel% equ 0 (
    echo.
    echo [OK] Dados inseridos com sucesso!
) else (
    echo.
    echo [ERRO] Falha ao inserir dados
)
pause

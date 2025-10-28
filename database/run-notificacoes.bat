@echo off
echo ========================================
echo   IMPLEMENTANDO NOTIFICACOES REAIS
echo ========================================
echo.

set MYSQL_PATH=C:\xampp\mysql\bin\mysql.exe
set DB_NAME=canticosccb_plataforma
set SQL_FILE=IMPLEMENTAR-NOTIFICACOES-REAIS.sql

if not exist "%SQL_FILE%" (
    echo ERRO: Arquivo %SQL_FILE% não encontrado!
    pause
    exit /b 1
)

echo Executando script SQL...
echo.

"%MYSQL_PATH%" -u root -p %DB_NAME% < "%SQL_FILE%"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo   SUCESSO! Notificacoes implementadas
    echo ========================================
    echo.
    echo Proximos passos:
    echo 1. Envie um novo convite de gestor
    echo 2. Logue com o usuario convidado
    echo 3. Veja a notificacao real aparecer!
    echo.
) else (
    echo.
    echo ========================================
    echo   ERRO ao executar script!
    echo ========================================
    echo.
)

pause

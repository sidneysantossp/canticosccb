@echo off
REM ============================================
REM Script para configurar banco REMOTO
REM Conecta no servidor canticosccb.com.br
REM ============================================

echo ============================================
echo Setup do Banco de Dados REMOTO
echo Servidor: 203.161.46.119
echo ============================================
echo.

REM Caminho do MySQL
set MYSQL_PATH=C:\xampp\mysql\bin\mysql.exe
set DB_HOST=203.161.46.119
set DB_USER=canticosccb_plataforma
set DB_PASS=Sidney10@KmSs147258!@#$%%
set DB_NAME=canticosccb_plataforma

echo Verificando MySQL...
if not exist "%MYSQL_PATH%" (
    echo ERRO: MySQL nao encontrado em %MYSQL_PATH%
    echo.
    echo Alternativa: Use phpMyAdmin em:
    echo https://canticosccb.com.br/phpmyadmin
    pause
    exit /b 1
)

echo.
echo ============================================
echo Passo 1: Criando Schema (Tabelas)
echo ============================================
echo.
"%MYSQL_PATH%" -h %DB_HOST% -u %DB_USER% -p%DB_PASS% %DB_NAME% < schema.sql
if %ERRORLEVEL% neq 0 (
    echo.
    echo ERRO ao criar schema!
    echo.
    echo Possíveis causas:
    echo 1. Firewall bloqueando conexao remota
    echo 2. MySQL remoto nao permite conexoes externas
    echo 3. Credenciais incorretas
    echo.
    echo SOLUCAO: Use phpMyAdmin:
    echo https://canticosccb.com.br/phpmyadmin
    pause
    exit /b 1
)
echo Schema criado com sucesso!

echo.
echo ============================================
echo Passo 2: Inserindo Dados Iniciais
echo ============================================
echo.
"%MYSQL_PATH%" -h %DB_HOST% -u %DB_USER% -p%DB_PASS% %DB_NAME% < seed.sql
if %ERRORLEVEL% neq 0 (
    echo ERRO ao inserir dados!
    pause
    exit /b 1
)
echo Dados inseridos com sucesso!

echo.
echo ============================================
echo SETUP CONCLUIDO COM SUCESSO!
echo ============================================
echo.
echo Banco de dados configurado:
echo - Host: %DB_HOST%
echo - Database: %DB_NAME%
echo - Usuario Admin: admin@canticosccb.com.br
echo - Senha Admin: admin123 (ALTERE!)
echo.
pause

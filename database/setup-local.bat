@echo off
REM ============================================
REM Script para configurar banco LOCAL (XAMPP)
REM ============================================

echo ============================================
echo Setup do Banco de Dados LOCAL - XAMPP
echo ============================================
echo.

REM Caminho do MySQL do XAMPP
set MYSQL_PATH=C:\xampp\mysql\bin\mysql.exe
set DB_HOST=localhost
set DB_USER=root
set DB_PASS=
set DB_NAME=canticosccb_plataforma

echo Verificando MySQL...
if not exist "%MYSQL_PATH%" (
    echo ERRO: MySQL nao encontrado em %MYSQL_PATH%
    echo Certifique-se que o XAMPP esta instalado
    pause
    exit /b 1
)

echo.
echo ============================================
echo Passo 1: Criando Banco de Dados
echo ============================================
echo.
"%MYSQL_PATH%" -h %DB_HOST% -u %DB_USER% -e "CREATE DATABASE IF NOT EXISTS %DB_NAME% CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
if %ERRORLEVEL% neq 0 (
    echo ERRO ao criar banco!
    echo Verifique se o MySQL esta rodando no XAMPP
    pause
    exit /b 1
)
echo Banco criado com sucesso!

echo.
echo ============================================
echo Passo 2: Criando Tabelas (schema.sql)
echo ============================================
echo.
"%MYSQL_PATH%" -h %DB_HOST% -u %DB_USER% %DB_NAME% < schema.sql
if %ERRORLEVEL% neq 0 (
    echo ERRO ao criar schema!
    pause
    exit /b 1
)
echo Tabelas criadas com sucesso!

echo.
echo ============================================
echo Passo 3: Inserindo Dados (seed.sql)
echo ============================================
echo.
"%MYSQL_PATH%" -h %DB_HOST% -u %DB_USER% %DB_NAME% < seed.sql
if %ERRORLEVEL% neq 0 (
    echo ERRO ao inserir dados!
    pause
    exit /b 1
)
echo Dados inseridos com sucesso!

echo.
echo ============================================
echo SETUP LOCAL CONCLUIDO COM SUCESSO!
echo ============================================
echo.
echo Banco de dados configurado:
echo - Host: %DB_HOST%
echo - Database: %DB_NAME%
echo - Usuario: %DB_USER%
echo - Senha: (vazia)
echo.
echo Credenciais de teste:
echo - Email: admin@canticosccb.com.br
echo - Senha: admin123
echo.
echo Proximos passos:
echo 1. Inicie o frontend: npm run dev
echo 2. Acesse: http://localhost:5173
echo 3. Faca login com as credenciais acima
echo.
pause

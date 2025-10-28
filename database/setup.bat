@echo off
REM ============================================
REM Script para configurar banco de dados
REM Windows Batch Script
REM ============================================

echo ============================================
echo Setup do Banco de Dados - Canticos CCB
echo ============================================
echo.
echo IMPORTANTE: Este sistema usa Firebase para autenticacao!
echo Apos executar este script, voce deve:
echo 1. Criar o usuario admin no Firebase Console
echo 2. Copiar o UID gerado
echo 3. Atualizar o registro no banco com o UID correto
echo.
echo Leia FIREBASE-SETUP.md para instrucoes completas
echo.
pause
echo.

REM Caminho do MySQL (ajuste se necessário)
set MYSQL_PATH=C:\xampp\mysql\bin\mysql.exe
set DB_HOST=localhost
set DB_USER=canticosccb_plataforma
set DB_PASS=Sidney10@KmSs147258!@#$%%
set DB_NAME=canticosccb_plataforma

echo Verificando se MySQL está instalado...
if not exist "%MYSQL_PATH%" (
    echo ERRO: MySQL nao encontrado em %MYSQL_PATH%
    echo Por favor, ajuste o caminho no script
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
    echo ERRO ao criar schema!
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
echo - Senha Admin: admin123 (ALTERE APOS PRIMEIRO LOGIN!)
echo.
echo Proximos passos:
echo 1. Inicie o servidor: npm run dev
echo 2. Acesse: http://localhost:5173
echo 3. Faca login como admin
echo.
pause

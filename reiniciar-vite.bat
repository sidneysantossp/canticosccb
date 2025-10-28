@echo off
echo ========================================
echo Reiniciando Vite com .env.local correto
echo ========================================
echo.

REM 1. Deletar arquivo errado
echo 1. Removendo src\.env.local (se existir)...
if exist src\.env.local del /F /Q src\.env.local
echo OK!

REM 2. Limpar cache do Vite
echo.
echo 2. Limpando cache do Vite...
if exist node_modules\.vite rmdir /S /Q node_modules\.vite
echo OK!

REM 3. Mostrar .env.local
echo.
echo 3. Conteudo do .env.local na raiz:
type .env.local
echo.

REM 4. Instruções
echo ========================================
echo PRONTO! Agora execute:
echo ========================================
echo npm run dev
echo.
pause

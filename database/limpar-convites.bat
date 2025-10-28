@echo off
echo ========================================
echo   LIMPANDO CONVITES ANTIGOS
echo ========================================
echo.

"C:\xampp\mysql\bin\mysql.exe" -u root canticosccb_plataforma < "LIMPAR-CONVITES-E-TESTAR.sql"

echo.
echo ========================================
echo   CONCLUIDO!
echo ========================================
echo.
echo Agora:
echo 1. Va em http://localhost:5175/composer/managers
echo 2. Envie novo convite para sid.websp@gmail.com
echo 3. Verifique as notificacoes!
echo.
pause

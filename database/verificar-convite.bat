@echo off
echo Verificando convite...
"C:\xampp\mysql\bin\mysql.exe" -u root canticosccb_plataforma < "verificar-convite-usuario.sql"
echo.
pause

@echo off
echo Resetando senha para: senha123
"C:\xampp\mysql\bin\mysql.exe" -u root canticosccb_plataforma < "resetar-senha-sidney.sql"
echo.
echo Senha resetada!
echo.
echo Login com:
echo Email: sid.websp@gmail.com
echo Senha: senha123
echo.
pause

@echo off
echo Criando notificacao de teste...
"C:\xampp\mysql\bin\mysql.exe" -u root canticosccb_plataforma < "TESTE-NOTIFICACAO-MANUAL.sql"
echo.
echo Agora va em http://localhost:5175/notifications
echo.
pause

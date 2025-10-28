@echo off
cd /d C:\xampp\mysql\bin
mysql.exe -u root canticosccb_plataforma < "C:\xampp\htdocs\1canticosccb\database\migrations\create_document_reviews.sql"
echo Tabela criada com sucesso!
pause

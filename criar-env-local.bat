@echo off
REM Criar arquivo .env.local

echo # API Local - XAMPP > .env.local
echo VITE_API_BASE_URL=http://localhost/1canticosccb/api >> .env.local
echo. >> .env.local
echo # Midia Local >> .env.local
echo VITE_MEDIA_BASE_URL=http://localhost/1canticosccb/media_protegida >> .env.local

echo.
echo ✅ Arquivo .env.local criado com sucesso!
echo.
echo Conteudo:
type .env.local
echo.
echo.
echo Agora reinicie o Vite com: npm run dev
pause

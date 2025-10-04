@echo off
echo 🚀 Iniciando Canticos CCB React...
echo.

echo ✅ Verificando Node.js...
node --version
if %errorlevel% neq 0 (
    echo ❌ Node.js não encontrado! Instale em: https://nodejs.org/
    pause
    exit /b 1
)

echo.
echo ✅ Verificando NPM...
npm --version

echo.
echo 📦 Instalando dependências...
npm install

echo.
echo 🚀 Iniciando servidor de desenvolvimento...
echo 📱 Acesse: http://localhost:3000
echo.
npm run dev

pause

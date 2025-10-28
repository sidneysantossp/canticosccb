@echo off
echo Limpando cache do Vite...
rmdir /s /q node_modules\.vite 2>nul
echo Cache limpo!
echo.
echo Iniciando Vite...
npm run dev

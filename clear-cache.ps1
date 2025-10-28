# Script para limpar cache do Vite e reiniciar
Write-Host "🧹 Limpando cache do Vite..." -ForegroundColor Cyan

# Limpar cache do Vite
if (Test-Path "node_modules\.vite") {
    Remove-Item -Recurse -Force "node_modules\.vite"
    Write-Host "✅ Cache do Vite removido" -ForegroundColor Green
}

# Limpar dist
if (Test-Path "dist") {
    Remove-Item -Recurse -Force "dist"
    Write-Host "✅ Pasta dist removida" -ForegroundColor Green
}

# Limpar cache do navegador (opcional)
Write-Host ""
Write-Host "💡 Dica: No navegador, pressione Ctrl+Shift+Delete para limpar cache" -ForegroundColor Yellow
Write-Host ""
Write-Host "✅ Cache limpo! Reinicie o servidor com: npm run dev" -ForegroundColor Green

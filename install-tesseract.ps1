# Script de instalação automática do Tesseract OCR para Windows
# Executa: .\install-tesseract.ps1

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Instalador Tesseract OCR" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# URL do instalador mais recente
$installerUrl = "https://digi.bib.uni-mannheim.de/tesseract/tesseract-ocr-w64-setup-5.3.3.20231005.exe"
$installerPath = "$env:TEMP\tesseract-installer.exe"

Write-Host "1. Baixando Tesseract OCR..." -ForegroundColor Yellow
try {
    Invoke-WebRequest -Uri $installerUrl -OutFile $installerPath -UseBasicParsing
    Write-Host "   Download concluido!" -ForegroundColor Green
} catch {
    Write-Host "   ERRO ao baixar!" -ForegroundColor Red
    Write-Host "   Baixe manualmente: https://github.com/UB-Mannheim/tesseract/wiki" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "2. Executando instalador..." -ForegroundColor Yellow
Write-Host "   IMPORTANTE: Marque 'Portuguese' na lista de idiomas!" -ForegroundColor Cyan
Start-Process -FilePath $installerPath -Wait

Write-Host ""
Write-Host "3. Adicionando ao PATH..." -ForegroundColor Yellow

# Verificar se já está no PATH
$tesseractPath = "C:\Program Files\Tesseract-OCR"
$currentPath = [Environment]::GetEnvironmentVariable("Path", "Machine")

if ($currentPath -notlike "*$tesseractPath*") {
    try {
        $newPath = "$currentPath;$tesseractPath"
        [Environment]::SetEnvironmentVariable("Path", $newPath, "Machine")
        Write-Host "   PATH atualizado!" -ForegroundColor Green
    } catch {
        Write-Host "   AVISO: Execute como Administrador para adicionar ao PATH" -ForegroundColor Yellow
    }
} else {
    Write-Host "   Ja esta no PATH!" -ForegroundColor Green
}

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Instalacao concluida!" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "PROXIMO PASSO:" -ForegroundColor Yellow
Write-Host "1. Feche e reabra o terminal" -ForegroundColor White
Write-Host "2. Execute: tesseract --version" -ForegroundColor White
Write-Host ""

# Limpar arquivo temporário
Remove-Item $installerPath -ErrorAction SilentlyContinue

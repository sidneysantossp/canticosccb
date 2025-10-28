# Script PowerShell para upload de arquivos para a VPS
# Uso: .\vps-upload.ps1 -File "arquivo.mp3" -Type "hinos"

param(
    [Parameter(Mandatory=$true)]
    [string]$File,
    
    [Parameter(Mandatory=$true)]
    [ValidateSet("hinos", "albuns", "avatars")]
    [string]$Type
)

# Configurações da VPS
$VPS_IP = "203.161.46.119"
$VPS_USER = "root"
$VPS_SSH_PORT = "22"
$MEDIA_BASE_URL = "http://203.161.46.119"

# Definir diretório de destino
$DESTINO = switch ($Type) {
    "hinos"   { "/var/www/media/hinos" }
    "albuns"  { "/var/www/media/albuns" }
    "avatars" { "/var/www/media/avatars" }
}

# Verificar se arquivo existe
if (-not (Test-Path $File)) {
    Write-Host "❌ Erro: Arquivo '$File' não encontrado!" -ForegroundColor Red
    exit 1
}

Write-Host "📤 Fazendo upload..." -ForegroundColor Cyan
Write-Host "   Arquivo: $File" -ForegroundColor Gray
Write-Host "   Destino: ${VPS_USER}@${VPS_IP}:${DESTINO}/" -ForegroundColor Gray

# Upload via SCP (requer PuTTY ou OpenSSH no Windows)
$fileName = Split-Path $File -Leaf

try {
    # Tentar usar SCP nativo do Windows 10+
    scp -P $VPS_SSH_PORT "$File" "${VPS_USER}@${VPS_IP}:${DESTINO}/"
    
    Write-Host "✅ Upload concluído!" -ForegroundColor Green
    Write-Host "🌐 URL: $MEDIA_BASE_URL/$Type/$fileName" -ForegroundColor Green
}
catch {
    Write-Host "❌ Erro no upload: $_" -ForegroundColor Red
    Write-Host "" -ForegroundColor Yellow
    Write-Host "💡 Dicas:" -ForegroundColor Yellow
    Write-Host "   1. Instale OpenSSH: Configurações > Aplicativos > Recursos Opcionais > Cliente OpenSSH" -ForegroundColor Gray
    Write-Host "   2. Ou instale PuTTY: https://www.putty.org/" -ForegroundColor Gray
    Write-Host "   3. Ou use WinSCP: https://winscp.net/" -ForegroundColor Gray
    exit 1
}

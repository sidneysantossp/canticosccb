#!/bin/bash
# Script para upload de arquivos para a VPS
# Uso: ./vps-upload.sh <arquivo_local> <destino>

# Carregar configurações
source ../.vps-config.local 2>/dev/null || {
    echo "❌ Erro: Arquivo .vps-config.local não encontrado!"
    echo "Crie o arquivo baseado no .vps-config.local.example"
    exit 1
}

# Verificar argumentos
if [ $# -lt 2 ]; then
    echo "Uso: $0 <arquivo_local> <tipo>"
    echo ""
    echo "Tipos disponíveis:"
    echo "  hinos   - Upload para /var/www/media/hinos/"
    echo "  albuns  - Upload para /var/www/media/albuns/"
    echo "  avatars - Upload para /var/www/media/avatars/"
    echo ""
    echo "Exemplo:"
    echo "  $0 hino001.mp3 hinos"
    echo "  $0 capa.jpg albuns"
    exit 1
fi

ARQUIVO=$1
TIPO=$2

# Verificar se arquivo existe
if [ ! -f "$ARQUIVO" ]; then
    echo "❌ Erro: Arquivo '$ARQUIVO' não encontrado!"
    exit 1
fi

# Definir diretório de destino
case $TIPO in
    hinos)
        DESTINO="$VPS_HINOS_DIR"
        ;;
    albuns)
        DESTINO="$VPS_ALBUNS_DIR"
        ;;
    avatars)
        DESTINO="$VPS_AVATARS_DIR"
        ;;
    *)
        echo "❌ Erro: Tipo inválido '$TIPO'"
        echo "Use: hinos, albuns ou avatars"
        exit 1
        ;;
esac

echo "📤 Fazendo upload..."
echo "   Arquivo: $ARQUIVO"
echo "   Destino: $VPS_USER@$VPS_IP:$DESTINO/"

# Upload via SCP
scp -P $VPS_SSH_PORT "$ARQUIVO" "$VPS_USER@$VPS_IP:$DESTINO/"

if [ $# -eq 0 ]; then
    echo "✅ Upload concluído!"
    echo "🌐 URL: $MEDIA_BASE_URL/$TIPO/$(basename $ARQUIVO)"
else
    echo "❌ Erro no upload!"
    exit 1
fi

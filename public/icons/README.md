# Instruções para Gerar Ícones PWA

## Opção 1: Online (Recomendado)
1. Acesse: https://realfavicongenerator.net/
2. Upload do arquivo: public/icons/icon-base.svg
3. Configure as opções PWA
4. Baixe e substitua os arquivos em public/icons/

## Opção 2: ImageMagick (se instalado)
convert public/icons/icon-base.svg -resize 72x72 public/icons/icon-72x72.png
convert public/icons/icon-base.svg -resize 96x96 public/icons/icon-96x96.png
convert public/icons/icon-base.svg -resize 128x128 public/icons/icon-128x128.png
convert public/icons/icon-base.svg -resize 144x144 public/icons/icon-144x144.png
convert public/icons/icon-base.svg -resize 152x152 public/icons/icon-152x152.png
convert public/icons/icon-base.svg -resize 192x192 public/icons/icon-192x192.png
convert public/icons/icon-base.svg -resize 384x384 public/icons/icon-384x384.png
convert public/icons/icon-base.svg -resize 512x512 public/icons/icon-512x512.png

## Opção 3: Photoshop/GIMP
1. Abra o arquivo icon-base.svg
2. Exporte para PNG nos tamanhos: 72x, 96x, 128x, 144x, 152x, 192x, 384x, 512x
3. Salve como: icon-[tamanho]x[tamanho].png

## Arquivos necessários:
- icon-72x72.png
- icon-96x96.png
- icon-128x128.png
- icon-144x144.png
- icon-152x152.png
- icon-192x192.png
- icon-384x384.png
- icon-512x512.png

## Ícones adicionais:
- favicon.ico (16x16, 32x32, 48x48)
- apple-touch-icon.png (180x180)
- shortcut-cantados.png (96x96)
- shortcut-tocados.png (96x96)  
- shortcut-downloads.png (96x96)
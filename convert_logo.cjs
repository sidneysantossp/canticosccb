const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function convertSvgToPng() {
  try {
    const svgPath = path.join(__dirname, 'public', 'logo-canticos-ccb.svg');
    const pngPath = path.join(__dirname, 'public', 'logo-canticos-ccb.png');

    if (!fs.existsSync(svgPath)) {
      console.error('Erro: SVG não encontrado em', svgPath);
      return;
    }

    // Converter SVG para PNG (300px width para boa resolução)
    await sharp(svgPath)
      .resize(300)
      .png()
      .toFile(pngPath);

    console.log('✅ Logo convertida de SVG para PNG com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao converter logo:', error);
  }
}

convertSvgToPng();

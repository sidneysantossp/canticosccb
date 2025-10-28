const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const logoPngPath = path.join(__dirname, 'public', 'logo-canticos-ccb.png');
const logoSvgPath = path.join(__dirname, 'public', 'logo-canticos-ccb.svg');
const outputDir = path.join(__dirname, 'public', 'icons');

function pickInputPath() {
  // Prefer SVG (mais confiável para rasterizar em múltiplos tamanhos)
  if (fs.existsSync(logoSvgPath)) return logoSvgPath;
  if (fs.existsSync(logoPngPath)) return logoPngPath;
  throw new Error('Logo file not found. Expected public/logo-canticos-ccb.png or .svg');
}

const inputPath = pickInputPath();

async function generateIcons() {
  console.log('🎨 Gerando ícones PWA a partir de:', inputPath);
  console.log('📁 Salvando em:', outputDir, '\n');
  
  for (const size of sizes) {
    try {
      const filename = `icon-${size}x${size}.png`;
      const filepath = path.join(outputDir, filename);
      
      // Criar ícone com padding de 10%
      const padding = Math.floor(size * 0.1);
      const logoSize = size - (padding * 2);
      
      await sharp(inputPath)
        .resize(logoSize, logoSize, {
          fit: 'contain',
          background: { r: 15, g: 23, b: 42, alpha: 1 } // #0f172a
        })
        .extend({
          top: padding,
          bottom: padding,
          left: padding,
          right: padding,
          background: { r: 15, g: 23, b: 42, alpha: 1 }
        })
        .png()
        .toFile(filepath);
      
      console.log(`✅ Criado: ${filename} (${size}x${size})`);
    } catch (err) {
      console.error(`❌ Erro ao criar ícone ${size}x${size}:`, err.message);
    }
  }
  
  // Criar apple-touch-icon.png (180x180)
  try {
    const appleSize = 180;
    const applePadding = Math.floor(appleSize * 0.1);
    const appleLogoSize = appleSize - (applePadding * 2);
    
    await sharp(inputPath)
      .resize(appleLogoSize, appleLogoSize, {
        fit: 'contain',
        background: { r: 15, g: 23, b: 42, alpha: 1 }
      })
      .extend({
        top: applePadding,
        bottom: applePadding,
        left: applePadding,
        right: applePadding,
        background: { r: 15, g: 23, b: 42, alpha: 1 }
      })
      .png()
      .toFile(path.join(outputDir, 'apple-touch-icon.png'));
    
    console.log('✅ Criado: apple-touch-icon.png (180x180)');
  } catch (err) {
    console.error('❌ Erro ao criar apple-touch-icon:', err.message);
  }
  
  console.log('\n🎉 Todos os ícones PWA foram gerados com sucesso!');
  console.log('📝 Próximo passo: Atualizar manifest.json e index.html');
}

generateIcons().catch(err => {
  console.error('❌ Erro fatal:', err);
  process.exit(1);
});

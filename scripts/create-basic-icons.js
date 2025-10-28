// Criar ícones básicos SVG para PWA
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const iconsDir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Função para criar SVG de ícone
function createIconSVG(size) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#10b981;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#059669;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.125}" fill="url(#bg)"/>
  <g transform="translate(${size * 0.2}, ${size * 0.2})">
    <rect x="${size * 0.35}" y="${size * 0.1}" width="${size * 0.02}" height="${size * 0.4}" fill="white"/>
    <ellipse cx="${size * 0.3}" cy="${size * 0.45}" rx="${size * 0.04}" ry="${size * 0.025}" fill="white"/>
    ${Array.from({length: 5}, (_, i) => 
      `<line x1="${size * 0.1}" y1="${size * 0.25 + i * size * 0.05}" x2="${size * 0.5}" y2="${size * 0.25 + i * size * 0.05}" stroke="white" stroke-width="${size * 0.003}" opacity="0.7"/>`
    ).join('')}
  </g>
  <text x="${size/2}" y="${size * 0.8}" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="${size * 0.12}" font-weight="bold">CCB</text>
</svg>`;
}

console.log('🎨 Criando ícones SVG básicos...');

// Criar ícones SVG
sizes.forEach(size => {
  const svg = createIconSVG(size);
  const filename = `icon-${size}x${size}.svg`;
  fs.writeFileSync(path.join(iconsDir, filename), svg);
  console.log(`✅ Criado: ${filename}`);
});

// Criar favicon.ico básico (SVG)
const faviconSVG = createIconSVG(32);
fs.writeFileSync(path.join(iconsDir, 'favicon.svg'), faviconSVG);

// Criar apple-touch-icon
const appleTouchIcon = createIconSVG(180);
fs.writeFileSync(path.join(iconsDir, 'apple-touch-icon.svg'), appleTouchIcon);

// Criar ícones de shortcuts
const shortcutIcons = {
  'shortcut-cantados': '#10b981',
  'shortcut-tocados': '#3b82f6', 
  'shortcut-downloads': '#8b5cf6'
};

Object.entries(shortcutIcons).forEach(([name, color]) => {
  const svg = `<svg width="96" height="96" viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg">
  <rect width="96" height="96" rx="12" fill="${color}"/>
  <g transform="translate(24, 24)">
    <rect x="32" y="8" width="2" height="32" fill="white"/>
    <ellipse cx="28" cy="36" rx="4" ry="2.5" fill="white"/>
    ${Array.from({length: 5}, (_, i) => 
      `<line x1="8" y1="${20 + i * 4}" x2="40" y2="${20 + i * 4}" stroke="white" stroke-width="0.5" opacity="0.7"/>`
    ).join('')}
  </g>
  <text x="48" y="75" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="10" font-weight="bold">CCB</text>
</svg>`;
  
  fs.writeFileSync(path.join(iconsDir, `${name}.svg`), svg);
  console.log(`✅ Criado: ${name}.svg`);
});

console.log('');
console.log('📋 Ícones SVG criados com sucesso!');
console.log('');
console.log('🔄 Para converter para PNG:');
console.log('   1. Abra: http://localhost:5173/icons/create-temp-icons.html');
console.log('   2. Ou use: https://convertio.co/svg-png/');
console.log('   3. Ou instale ImageMagick e execute:');
sizes.forEach(size => {
  console.log(`      convert public/icons/icon-${size}x${size}.svg public/icons/icon-${size}x${size}.png`);
});

console.log('');
console.log('✅ PWA está funcional com ícones SVG temporários!');

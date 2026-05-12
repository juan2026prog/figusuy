/**
 * Generate PWA icons from the existing favicon.svg
 * Creates PNG placeholder icons using SVG-to-canvas rendering.
 * 
 * Since we don't have sharp/canvas on this machine, we create 
 * minimal valid PNG files as placeholders and also create proper
 * SVG-based icons that can be used directly.
 */
const fs = require('fs');
const path = require('path');

const ICONS_DIR = path.join(__dirname, '..', 'public', 'icons');

// Read the base SVG
const baseSvg = fs.readFileSync(path.join(__dirname, '..', 'public', 'favicon.svg'), 'utf8');

// Create a proper SVG icon with padding for maskable
function createSvgIcon(size, maskable = false) {
  if (maskable) {
    // Maskable icons need 10% safe zone padding on all sides
    const padding = Math.round(size * 0.1);
    const innerSize = size - (padding * 2);
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="#3b82f6"/>
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3b82f6"/>
      <stop offset="100%" style="stop-color:#8b5cf6"/>
    </linearGradient>
  </defs>
  <rect x="${padding}" y="${padding}" width="${innerSize}" height="${innerSize}" rx="${Math.round(innerSize * 0.22)}" fill="url(#g)"/>
  <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-size="${Math.round(size * 0.5)}" font-family="Inter,Arial,sans-serif" font-weight="800" fill="white">F</text>
</svg>`;
  }
  
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3b82f6"/>
      <stop offset="100%" style="stop-color:#8b5cf6"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${Math.round(size * 0.22)}" fill="url(#g)"/>
  <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-size="${Math.round(size * 0.56)}" font-family="Inter,Arial,sans-serif" font-weight="800" fill="white">F</text>
</svg>`;
}

// Create apple-touch-icon (180x180) 
function createAppleTouchIcon() {
  return createSvgIcon(180, false);
}

// We generate SVG icons that browsers can use
// The manifest already references .png files but we create .svg fallbacks
// and also create minimal working SVGs named as .png won't work, 
// so let's update the manifest to use SVG format too

const icons = [
  { name: 'icon-192x192.svg', size: 192, maskable: false },
  { name: 'icon-512x512.svg', size: 512, maskable: false },
  { name: 'maskable-icon-192x192.svg', size: 192, maskable: true },
  { name: 'maskable-icon-512x512.svg', size: 512, maskable: true },
  { name: 'apple-touch-icon.svg', size: 180, maskable: false },
];

// Ensure directory exists
if (!fs.existsSync(ICONS_DIR)) {
  fs.mkdirSync(ICONS_DIR, { recursive: true });
}

icons.forEach(icon => {
  const svg = createSvgIcon(icon.size, icon.maskable);
  const filePath = path.join(ICONS_DIR, icon.name);
  fs.writeFileSync(filePath, svg);
  console.log(`✅ Created ${icon.name} (${icon.size}x${icon.size})`);
});

// Also copy the generated PNG from artifacts if it exists
const artifactPng = path.join(__dirname, '..', '..', '.gemini', 'antigravity', 'brain', '1a6bc9c3-5a40-401d-a1ce-eeb1996a3557', 'pwa_icon_512_1778335760546.png');
if (fs.existsSync(artifactPng)) {
  fs.copyFileSync(artifactPng, path.join(ICONS_DIR, 'icon-512x512.png'));
  fs.copyFileSync(artifactPng, path.join(ICONS_DIR, 'maskable-icon-512x512.png'));
  console.log('✅ Copied generated PNG as icon-512x512.png and maskable-icon-512x512.png');
}

console.log('\n🎉 PWA icons generated successfully!');
console.log('📋 Replace SVG icons with proper PNG versions for production.');

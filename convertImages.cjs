const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const directories = [
  './public/assets',
  './public/landing',
  './public/assets/landing',
  './public/assets/landing/how_it_works',
  './public/assets/landing/referrals',
];

async function processDirectory(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      // Don't recurse here, we listed specific directories, or we could just recurse
    } else if (file.toLowerCase().endsWith('.png') && stat.size > 200 * 1024) { // Only process PNGs > 200KB to be safe, or just all PNGs.
      console.log(`Converting ${fullPath}...`);
      const webpPath = fullPath.replace(/\.png$/i, '.webp');
      try {
        await sharp(fullPath)
          .webp({ quality: 80, effort: 6 })
          .toFile(webpPath);
        console.log(`Successfully converted to ${webpPath}`);
        // fs.unlinkSync(fullPath); // Delete the original file after conversion? Yes, to reduce payload, but we need to update code first. Let's not delete yet.
      } catch (e) {
        console.error(`Error converting ${fullPath}:`, e);
      }
    }
  }
}

async function run() {
  for (const dir of directories) {
    await processDirectory(dir);
  }
  console.log('Done converting images');
}

run();

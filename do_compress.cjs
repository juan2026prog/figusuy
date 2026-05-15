const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function processFile(fullPath) {
  if (!fs.existsSync(fullPath)) {
    console.log(`File not found: ${fullPath}`);
    return;
  }
  const webpPath = fullPath.replace(/\.png$/i, '.webp');
  try {
    await sharp(fullPath)
      .webp({ quality: 80, effort: 6 })
      .toFile(webpPath);
    console.log(`Successfully converted to ${webpPath}`);
    fs.unlinkSync(fullPath);
    console.log(`Deleted original: ${fullPath}`);
  } catch (e) {
    console.error(`Error converting ${fullPath}:`, e);
  }
}

async function run() {
  await processFile(path.join(__dirname, 'public', 'logo.png'));
  await processFile(path.join(__dirname, 'src', 'components', 'WhpIcon.png'));
  
  // Also delete shop-join.png if it exists since we have webp
  const shopJoinPng = path.join(__dirname, 'public', 'landing', 'shop-join.png');
  if (fs.existsSync(shopJoinPng)) {
    fs.unlinkSync(shopJoinPng);
    console.log(`Deleted shop-join.png`);
  }
}

run();

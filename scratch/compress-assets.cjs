const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const os = require('os');

const ASSETS = [
  { src: 'public/assets/badge-desde-el-comienzo.webp', quality: 60 },
  { src: 'public/assets/avatar-generico.webp', quality: 65 },
  { src: 'public/assets/avatar-tienda.webp', quality: 65 },
  { src: 'public/assets/landing/local_intercambio.webp', quality: 65 },
  { src: 'public/assets/landing/tienda_red.webp', quality: 65 },
  { src: 'public/assets/landing/how_it_works/step1.webp', quality: 65 },
  { src: 'public/assets/landing/how_it_works/step2.webp', quality: 65 },
  { src: 'public/assets/landing/how_it_works/step3.webp', quality: 65 },
  { src: 'public/assets/landing/referrals/logo-referidos.webp', quality: 65 },
  { src: 'public/assets/landing/referrals/step_1.webp', quality: 65 },
  { src: 'public/assets/landing/referrals/step_2.webp', quality: 65 },
  { src: 'public/assets/landing/referrals/step_3.webp', quality: 65 },
];

async function compress() {
  const root = path.resolve(__dirname, '..');
  for (const asset of ASSETS) {
    const filePath = path.join(root, asset.src);
    if (!fs.existsSync(filePath)) {
      console.log(`SKIP (not found): ${asset.src}`);
      continue;
    }
    const before = fs.statSync(filePath).size;
    
    // Read into buffer first, then process
    const inputBuf = fs.readFileSync(filePath);
    const outputBuf = await sharp(inputBuf)
      .webp({ quality: asset.quality, effort: 6 })
      .toBuffer();
    
    if (outputBuf.length < before) {
      // Write to temp file first, then rename (avoids OneDrive lock issues)
      const tmpFile = path.join(os.tmpdir(), `figus_${Date.now()}_${path.basename(filePath)}`);
      fs.writeFileSync(tmpFile, outputBuf);
      // Copy back
      fs.copyFileSync(tmpFile, filePath);
      fs.unlinkSync(tmpFile);
      const after = outputBuf.length;
      const pct = ((1 - after / before) * 100).toFixed(1);
      console.log(`OK ${path.basename(filePath)}: ${(before/1024).toFixed(1)}KB -> ${(after/1024).toFixed(1)}KB (-${pct}%)`);
    } else {
      console.log(`== ${path.basename(filePath)}: ${(before/1024).toFixed(1)}KB (already optimal)`);
    }
  }
  console.log('\nDone!');
}

compress().catch(console.error);

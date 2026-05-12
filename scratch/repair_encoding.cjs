const fs = require('fs');
const path = require('path');

const targets = [
  { from: /â€”/g, to: '—' },
  { from: /CRÃ TICA/g, to: 'CRÍTICA' },
  { from: /Â·/g, to: '·' },
  { from: /Ã¡/g, to: 'á' },
  { from: /Ã©/g, to: 'é' },
  { from: /Ã\u00ad/g, to: 'í' },
  { from: /Ã³/g, to: 'ó' },
  { from: /Ãº/g, to: 'ú' },
  { from: /Ã±/g, to: 'ñ' },
  { from: /Ã/g, to: 'Í' }, // Careful with this one
];

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== 'dist') {
        walk(fullPath);
      }
    } else if (/\.(js|jsx|ts|tsx|html|css)$/.test(file)) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;
      for (const target of targets) {
        if (target.from.test(content)) {
          content = content.replace(target.from, target.to);
          changed = true;
        }
      }
      if (changed) {
        console.log(`Fixed encoding in: ${fullPath}`);
        fs.writeFileSync(fullPath, content, 'utf8');
      }
    }
  }
}

walk(path.join(__dirname, '..', 'src'));

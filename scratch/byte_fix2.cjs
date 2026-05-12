const fs = require('fs');
const path = require('path');

const map = {
  '\u00e2\u2020\u0090': '←',
  '\u00e2\u2014\u008f': '●',
  '\u00e2\u009d\u0152': '❌',
  '\u00e2\u0153\u008f\u00ef\u00b8\u008f': '✍️'
};

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let newContent = content;
  for (const [bad, good] of Object.entries(map)) {
    newContent = newContent.split(bad).join(good);
  }
  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`Fixed hardcoded bytes in: ${filePath}`);
  }
}

function walkDir(dir) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory && !f.startsWith('.') && f !== 'node_modules' && f !== 'dist') {
      walkDir(dirPath);
    } else if (!isDirectory) {
      if (f.match(/\.(js|jsx|html|css|json)$/)) {
        fixFile(dirPath);
      }
    }
  });
}
walkDir('.');

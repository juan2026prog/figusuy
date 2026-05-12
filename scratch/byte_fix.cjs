const fs = require('fs');
let content = fs.readFileSync('src/pages/Matches.jsx', 'utf8');
let lines = content.split('\n');
let mojibake = lines.find(l => l.includes('â'));
if (mojibake) {
  let index = mojibake.indexOf('â');
  let snippet = mojibake.substring(index, index + 5);
  console.log("Snippet:", snippet);
  for(let i=0; i<snippet.length; i++) {
    console.log(`Char ${i}: ${snippet[i]} (code: ${snippet.charCodeAt(i).toString(16)})`);
  }
}

// Just globally replace the common ones in the whole project:
const map = {
  '\u00E2\u008F\u00B3': '⏳',
  '\u00E2\u00AD\u0090': '⭐',
  '\u00E2\u0086\u0090': '←',
  '\u00E2\u0097\u008F': '●',
  '\u00E2\u009C\u008F\u00EF\u00B8\u008F': '✍️',
  '\u00E2\u009D\u00A4\u00EF\u00B8\u008F': '❤️',
  '\u00E2\u009D\u008C': '❌',
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
  const fs = require('fs');
  const path = require('path');
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

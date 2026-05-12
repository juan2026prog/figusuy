const fs = require('fs');
const path = require('path');

const replacements = {
  'â† ': '← ',
  'â— ': '●',
  'â ³': '⏳',
  'â­ ': '⭐',
  'âœ ï¸ ': '✍️',
  'â ¤ï¸ ': '❤️',
  'â Œ': '❌',
  'ÍƒÂ­': 'í',
  'ÍƒÂ': 'Á',
  'NÂº': 'Nº',
  'Â·': '·',
  'Â¡': '¡',
  'Â¿': '¿',
  'Ã¡': 'á',
  'Ã©': 'é',
  'Ã­': 'í',
  'Ã³': 'ó',
  'Ãº': 'ú',
  'Ã±': 'ñ',
  'Ã ': 'Á',
  'Ã‰': 'É',
  'Ã ': 'Í',
  'Ã“': 'Ó',
  'Ãš': 'Ú',
  'Ã‘': 'Ñ'
};

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let newContent = content;
  
  for (const [bad, good] of Object.entries(replacements)) {
    newContent = newContent.split(bad).join(good);
  }
  
  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`Fixed hardcoded string in: ${filePath}`);
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
console.log('Done hard replacement.');

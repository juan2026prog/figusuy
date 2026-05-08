const fs = require('fs');
const path = 'src/pages/Album.jsx';
let content = fs.readFileSync(path, 'utf8');

const replacements = {
  'âœ“': '✓',
  'âŠ•': '⊕',
  'âœ•': '✕',
  'âŒ«': '⌫',
  'â€¹': '‹',
  'â€º': '›',
  'â• ': '═'
};

for (const [bad, good] of Object.entries(replacements)) {
  content = content.split(bad).join(good);
}

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed additional encoding in Album.jsx');

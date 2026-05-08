const fs = require('fs');
const path = 'src/pages/Album.jsx';
let content = fs.readFileSync(path, 'utf8');

const replacements = {
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
  'Ã‘': 'Ñ',
  'Â·': '·',
  'Â¡': '¡',
  'Â¿': '¿',
  'ðŸŽ': '🎉',
  'ðŸ“Œ': '📌',
  'ðŸ’°': '💰',
  'ðŸ’Ž': '💎',
  'ðŸ”¥': '🔥',
  'ðŸš€': '🚀',
  'ðŸ’¡': '💡',
  'ðŸŽ¯': '🎯',
  'ðŸ¥‡': '🥇',
  'ðŸ’¬': '💬'
};

for (const [bad, good] of Object.entries(replacements)) {
  content = content.split(bad).join(good);
}

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed encoding in Album.jsx');

const path2 = 'src/pages/Premium.jsx';
if (fs.existsSync(path2)) {
  let content2 = fs.readFileSync(path2, 'utf8');
  for (const [bad, good] of Object.entries(replacements)) {
    content2 = content2.split(bad).join(good);
  }
  fs.writeFileSync(path2, content2, 'utf8');
  console.log('Fixed encoding in Premium.jsx');
}

const fs = require('fs');

const win1252 = {
  '€': 0x80, '‚': 0x82, 'ƒ': 0x83, '„': 0x84, '…': 0x85, '†': 0x86, '‡': 0x87,
  'ˆ': 0x88, '‰': 0x89, 'Š': 0x8a, '‹': 0x8b, 'Œ': 0x8c, 'Ž': 0x8e, '‘': 0x91,
  '’': 0x92, '“': 0x93, '”': 0x94, '•': 0x95, '–': 0x96, '—': 0x97, '˜': 0x98,
  '™': 0x99, 'š': 0x9a, '›': 0x9b, 'œ': 0x9c, 'ž': 0x9e, 'Ÿ': 0x9f
};

function encodeToWin1252(str) {
  const buf = Buffer.alloc(str.length);
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    const code = str.charCodeAt(i);
    if (code >= 0x00 && code <= 0xFF && !(code >= 0x80 && code <= 0x9F)) {
      buf[i] = code;
    } else if (win1252[char] !== undefined) {
      buf[i] = win1252[char];
    } else {
      // Not a valid win1252 char
      return null;
    }
  }
  return buf;
}

// Common patterns of 2-byte or 3-byte or 4-byte UTF-8 interpreted as Win1252
// For example:
// "â”€" (U+00E2 U+201D U+20AC) -> bytes E2 94 80 -> UTF8 string "─"
function fixMojibake(text) {
  // Replace anything that looks like a sequence of 2-4 Win1252 chars 
  // that form valid UTF-8.
  // Actually, we can just find all words/characters that are double encoded.
  // The safest way is to do known replacements.
  const replacements = {
    'â”€': '─',
    'â ³': '⏳',
    'âœ✨': '✨', // Wait, let's find the actual ones
    'âœ¨': '✨',
    'â— ': '●',
    'âœ“': '✓',
    'âš½': '⚽',
    'âš¡': '⚡',
    'â­ ': '⭐',
    'â—‹': '○',
    'âœ…': '✅',
    'â˜…': '★',
    'â˜†': '☆',
    'âœ”ï¸ ': '✔️',
    'âš™ï¸ ': '⚙️',
    'âœ ï¸ ': '✍️',
    'â¬†ï¸ ': '⬆️',
    'â ¤ï¸ ': '❤️',
    'ÍƒÂ­': 'í',
    'ÍƒÂ': 'Á', // careful, sometimes 'ÍƒÂ' is Álbum, but the full string was 'ÍƒÂ lbumes' -> 'Á lbumes'? Actually 'Álbumes'.
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
  
  for (let [bad, good] of Object.entries(replacements)) {
    text = text.split(bad).join(good);
  }
  return text;
}

const path = 'src/pages/Matches.jsx';
let content = fs.readFileSync(path, 'utf8');
let fixed = fixMojibake(content);
const lines = fixed.split('\n');
console.log("Lines with â:");
console.log(lines.filter(l => l.includes('â')).slice(0, 5));

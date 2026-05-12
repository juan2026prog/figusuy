const fs = require('fs');
const path = require('path');

function fixMojibake(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  // First, identify if there's mojibake
  // These are typical latin1 interpretations of utf8 bytes for emojis
  const hasMojibake = /â|ð|Â/.test(content);
  if (!hasMojibake) return false;

  // Manual mapping for the specific mojibake found
  const replacements = {
    'âš¡': '⚡',
    'â ³': '⏳',
    'ðŸ”„': '🔄',
    'âš ï¸ ': '⚠️',
    'âš ï¸ ': '⚠️', // some editors strip the variation selector
    'âˆž': '∞',
    'âœ…': '✅',
    'â Œ': '❌',
    'âš™ï¸ ': '⚙️',
    'ðŸ§ ': '🧠',
    'ðŸ”’': '🔒',
    'ðŸ›¡ï¸ ': '🛡️',
    'ðŸŒ ': '🌐',
    'ðŸ’°': '💰',
    'ðŸ’¾': '💾',
    'âœ“': '✓',
    'âœ•': '✕',
    'âœ ï¸ ': '✏️',
    'â†’': '→',
    'ðŸš¨': '🚨',
    'â ¤ï¸ ': '❤️',
    'â€¢': '•',
    'ðŸŽ‰': '🎉',
    'Í ': 'Á', // Í lbumes -> Álbumes
    'Á ': 'Á', 
  };

  let fixedContent = content;
  for (const [mojibake, correct] of Object.entries(replacements)) {
    fixedContent = fixedContent.split(mojibake).join(correct);
  }

  // General latin1 to utf8 recovery (might corrupt actual latin1 chars like áéíóú if already correct)
  // Therefore, explicit replacement is safer.

  if (fixedContent !== content) {
    fs.writeFileSync(filePath, fixedContent, 'utf8');
    return true;
  }
  return false;
}

function traverseDir(dir) {
  let count = 0;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      count += traverseDir(fullPath);
    } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
      if (fixMojibake(fullPath)) {
        console.log('Fixed:', fullPath);
        count++;
      }
    }
  }
  return count;
}

const fixed = traverseDir(path.join(__dirname, 'src', 'admin'));
console.log('Total admin files fixed:', fixed);

// Also fix adminStore.js where 🎉 was mojibake
if (fixMojibake(path.join(__dirname, 'src', 'stores', 'adminStore.js'))) {
  console.log('Fixed: adminStore.js');
}


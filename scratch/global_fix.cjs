const fs = require('fs');
const path = require('path');

// Windows-1252 to byte mapping
const win1252 = {
  '€': 0x80, '‚': 0x82, 'ƒ': 0x83, '„': 0x84, '…': 0x85, '†': 0x86, '‡': 0x87,
  'ˆ': 0x88, '‰': 0x89, 'Š': 0x8a, '‹': 0x8b, 'Œ': 0x8c, 'Ž': 0x8e, '‘': 0x91,
  '’': 0x92, '“': 0x93, '”': 0x94, '•': 0x95, '–': 0x96, '—': 0x97, '˜': 0x98,
  '™': 0x99, 'š': 0x9a, '›': 0x9b, 'œ': 0x9c, 'ž': 0x9e, 'Ÿ': 0x9f
};

// Also map standard Latin-1 characters
for (let i = 0xA0; i <= 0xFF; i++) {
  win1252[String.fromCharCode(i)] = i;
}

function decodeMojibake(text) {
  // We look for consecutive characters that exist in win1252 (bytes 0x80 to 0xFF)
  // that form valid UTF-8 sequences.
  // UTF-8 multi-byte characters start with a byte >= 0xC2
  
  let result = '';
  let i = 0;
  
  while (i < text.length) {
    let charCode = text.charCodeAt(i);
    let charStr = text[i];
    
    let byteVal = win1252[charStr];
    
    // Fast path: ASCII or non-win1252
    if (byteVal === undefined || byteVal < 0xC2) {
      result += charStr;
      i++;
      continue;
    }
    
    // It's a leading byte of a potential UTF-8 sequence.
    // Count how many continuation bytes we expect
    let seqLen = 0;
    if (byteVal >= 0xC2 && byteVal <= 0xDF) seqLen = 2;
    else if (byteVal >= 0xE0 && byteVal <= 0xEF) seqLen = 3;
    else if (byteVal >= 0xF0 && byteVal <= 0xF4) seqLen = 4;
    
    if (seqLen === 0) {
      result += charStr;
      i++;
      continue;
    }
    
    // Check if we have enough characters and they are all valid win1252 continuation bytes (0x80 - 0xBF)
    let validSequence = true;
    let bytes = [byteVal];
    
    for (let j = 1; j < seqLen; j++) {
      if (i + j >= text.length) {
        validSequence = false; break;
      }
      let nextChar = text[i + j];
      let nextByte = win1252[nextChar];
      if (nextByte === undefined || nextByte < 0x80 || nextByte > 0xBF) {
        validSequence = false; break;
      }
      bytes.push(nextByte);
    }
    
    if (validSequence) {
      // Decode the bytes to a UTF-8 string
      let decodedStr = Buffer.from(bytes).toString('utf8');
      // Buffer.toString('utf8') returns replacement character '\uFFFD' if invalid
      if (!decodedStr.includes('\uFFFD')) {
        result += decodedStr;
        i += seqLen;
        continue;
      }
    }
    
    // If not valid, just keep the character
    result += charStr;
    i++;
  }
  
  // Specific fallbacks for corrupted cases
  // "ÍƒÂ­" -> "í", "ÍƒÂ" -> "Á"
  result = result.replace(/ÍƒÂ­/g, 'í')
                 .replace(/ÍƒÂ/g, 'Á')
                 .replace(/Âº/g, 'º')
                 .replace(/Â¡/g, '¡')
                 .replace(/Â¿/g, '¿');
                 
  return result;
}

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    // Exclude node_modules, .git, etc
    if (isDirectory && !f.startsWith('.') && f !== 'node_modules' && f !== 'dist') {
      walkDir(dirPath, callback);
    } else if (!isDirectory) {
      // Only process text files (html, js, jsx, css, json)
      if (f.match(/\.(js|jsx|html|css|json)$/)) {
        callback(dirPath);
      }
    }
  });
}

let modifiedFiles = 0;

walkDir('.', (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  let newContent = decodeMojibake(content);
  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`Fixed: ${filePath}`);
    modifiedFiles++;
  }
});

console.log(`Total files modified: ${modifiedFiles}`);

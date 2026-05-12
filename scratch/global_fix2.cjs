const fs = require('fs');
const path = require('path');

// Windows-1252 to byte mapping
const win1252 = {
  '€': 0x80, '‚': 0x82, 'ƒ': 0x83, '„': 0x84, '…': 0x85, '†': 0x86, '‡': 0x87,
  'ˆ': 0x88, '‰': 0x89, 'Š': 0x8a, '‹': 0x8b, 'Œ': 0x8c, 'Ž': 0x8e, '‘': 0x91,
  '’': 0x92, '“': 0x93, '”': 0x94, '•': 0x95, '–': 0x96, '—': 0x97, '˜': 0x98,
  '™': 0x99, 'š': 0x9a, '›': 0x9b, 'œ': 0x9c, 'ž': 0x9e, 'Ÿ': 0x9f
};

// Map standard Latin-1 characters
for (let i = 0xA0; i <= 0xFF; i++) {
  win1252[String.fromCharCode(i)] = i;
}

// Map the "undefined" Win1252 bytes which often just appear as their unicode control code
const undefinedBytes = [0x81, 0x8d, 0x8f, 0x90, 0x9d];
for (let b of undefinedBytes) {
  win1252[String.fromCharCode(b)] = b;
}

function decodeMojibake(text) {
  let result = '';
  let i = 0;
  
  while (i < text.length) {
    let charStr = text[i];
    let byteVal = win1252[charStr];
    
    // Fast path: ASCII or non-win1252
    if (byteVal === undefined || byteVal < 0xC2) {
      result += charStr;
      i++;
      continue;
    }
    
    // Determine expected UTF-8 sequence length
    let seqLen = 0;
    if (byteVal >= 0xC2 && byteVal <= 0xDF) seqLen = 2;
    else if (byteVal >= 0xE0 && byteVal <= 0xEF) seqLen = 3;
    else if (byteVal >= 0xF0 && byteVal <= 0xF4) seqLen = 4;
    
    if (seqLen === 0) {
      result += charStr;
      i++;
      continue;
    }
    
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
      let decodedStr = Buffer.from(bytes).toString('utf8');
      if (!decodedStr.includes('\uFFFD')) {
        result += decodedStr;
        i += seqLen;
        continue;
      }
    }
    
    result += charStr;
    i++;
  }
  return result;
}

function walkDir(dir) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory && !f.startsWith('.') && f !== 'node_modules' && f !== 'dist') {
      walkDir(dirPath);
    } else if (!isDirectory) {
      if (f.match(/\.(js|jsx|html|css|json)$/)) {
        let content = fs.readFileSync(dirPath, 'utf8');
        let newContent = decodeMojibake(content);
        if (content !== newContent) {
          fs.writeFileSync(dirPath, newContent, 'utf8');
          console.log(`Fixed global mojibake in: ${dirPath}`);
        }
      }
    }
  });
}

walkDir('.');
console.log('Global fix 2 done.');

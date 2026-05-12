const fs = require('fs');
const path = 'src/pages/Matches.jsx';
let content = fs.readFileSync(path, 'utf8');

// Function to fix double encoding
function fixDoubleEncoding(text) {
  // Use a regex to find blocks of mojibake
  // Mojibake usually involves sequences of Latin-1 characters that result from UTF-8 bytes.
  // We can try to decode the whole file, but it might crash if there are characters not fitting in latin1
  // Let's try converting the entire string if it contains "â" or "ÍƒÂ" or "Ã"
  try {
      // First convert to latin1 bytes
      let buffer = Buffer.from(text, 'utf8');
      // No, the content is currently UTF-8 containing the characters like "â" (which is C3 A2).
      // If we do Buffer.from(text, 'latin1'), it will take the unicode codepoint of 'â' (U+00E2) and write the byte 0xE2.
      let bytes = Buffer.from(text, 'latin1');
      let decoded = bytes.toString('utf8');
      // If it doesn't throw, and it contains no replacement characters, it might be the fix.
      // But wait, parts of the file are correct UTF-8 (like valid Spanish characters entered later).
      // We shouldn't convert the whole file this way unless the whole file is double encoded.
  } catch(e) {}
}

const lines = content.split('\n');
const mojibakeLines = lines.filter(l => l.includes('â') || l.includes('Ã') || l.includes('ÍƒÂ'));
console.log('Found mojibake lines:', mojibakeLines.length);
if (mojibakeLines.length > 0) {
    console.log(mojibakeLines[0]);
    let text = mojibakeLines[0];
    try {
        let fixed = Buffer.from(text, 'latin1').toString('utf8');
        console.log('Fixed:', fixed);
    } catch(e) {
        console.error(e);
    }
}

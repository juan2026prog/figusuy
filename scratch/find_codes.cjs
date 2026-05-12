const fs = require('fs');
let text = fs.readFileSync('src/pages/Achievements.jsx', 'utf8');
let lines = text.split('\n');

for (let line of lines) {
  if (line.includes('â')) {
    let index = line.indexOf('â');
    let snippet = line.substring(index, index + 6);
    console.log("Found in Achievements:", snippet);
    for(let i=0; i<snippet.length; i++) {
      console.log(`Char ${i}: ${snippet[i]} (code: ${snippet.charCodeAt(i).toString(16).padStart(4, '0')})`);
    }
    console.log("---");
  }
}

text = fs.readFileSync('src/admin/AdminSettings.jsx', 'utf8');
lines = text.split('\n');
for (let line of lines) {
  if (line.includes('â')) {
    let index = line.indexOf('â');
    let snippet = line.substring(index, index + 6);
    console.log("Found in AdminSettings:", snippet);
    for(let i=0; i<snippet.length; i++) {
      console.log(`Char ${i}: ${snippet[i]} (code: ${snippet.charCodeAt(i).toString(16).padStart(4, '0')})`);
    }
    console.log("---");
  }
}

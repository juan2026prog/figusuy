const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'stores', 'influencerStore.js');
const content = fs.readFileSync(filePath, 'utf8');

try {
  let balance = 0;
  const lines = content.split('\n');
  lines.forEach((line, i) => {
    const ob = (line.match(/\{/g) || []).length;
    const cb = (line.match(/\}/g) || []).length;
    
    balance += ob;
    balance -= cb;
    
    if (balance < 0) {
      console.log(`IMBALANCE DETECTED AT LINE ${i+1}: ${line.trim()}`);
      process.exit(1);
    }
  });
  
  console.log(`Final balance: ${balance}`);
} catch (e) {
  console.error(e);
}

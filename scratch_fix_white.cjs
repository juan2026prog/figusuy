const fs = require('fs');
const path = require('path');
const dir = './src/admin';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx'));

let count = 0;
for (const f of files) {
  const filePath = path.join(dir, f);
  let code = fs.readFileSync(filePath, 'utf8');

  // Replace background: 'white' or "#fff" or "#fafafa" with 'var(--admin-panel2)' or 'transparent'
  // But wait, some buttons have `background: 'var(--color-primary)', color: 'white'`. We should NOT replace `color: 'white'`.
  // We ONLY want to replace `background` properties.

  code = code.replace(/background:\s*['"](?:white|#fff|#ffffff|#fafafa|#f8fafc|#f1f5f9)['"]/g, 'background: "var(--admin-panel2)"');
  
  // Replace card border colors that are light
  code = code.replace(/border:\s*['"]1px solid (?:#e2e8f0|#e7e5e4|#f1f5f9|#d6d3d1)['"]/g, 'border: "1px solid var(--admin-line)"');
  
  // Remove light text colors
  code = code.replace(/color:\s*['"](?:#1c1917|#0f172a|#334155|#475569)['"]/g, 'color: "var(--admin-muted)"');

  // Any other inline background colors that might be aggressive light mode colors
  code = code.replace(/background:\s*['"]#eff6ff['"]/g, 'background: "rgba(59, 130, 246, 0.1)"'); // light blue -> dark transparent blue
  code = code.replace(/background:\s*['"]#fef2f2['"]/g, 'background: "rgba(239, 68, 68, 0.1)"'); // light red
  code = code.replace(/background:\s*['"]#fffbeb['"]/g, 'background: "rgba(245, 158, 11, 0.1)"'); // light yellow
  code = code.replace(/background:\s*['"]#ecfdf5['"]/g, 'background: "rgba(16, 185, 129, 0.1)"'); // light green
  code = code.replace(/background:\s*['"]#fff7ed['"]/g, 'background: "rgba(249, 115, 22, 0.1)"'); // light orange
  
  if (code !== fs.readFileSync(filePath, 'utf8')) {
    fs.writeFileSync(filePath, code);
    count++;
  }
}
console.log('Refactored ' + count + ' files for light mode aggressive contrasts.');

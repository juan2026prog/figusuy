/**
 * fix_encoding_final.cjs
 * Corrige TODOS los caracteres mojibake (UTF-8 mal interpretado como Latin-1)
 * en los archivos JSX/JS de FigusUY.
 *
 * Mojibake map:
 *   â‰ˆ  → ≈  (U+2248, ALMOST EQUAL TO)
 *   âœ"  → ✓  (U+2713, CHECK MARK) — como entidad HTML &#x2713;
 *   Â©   → ©  (U+00A9, COPYRIGHT SIGN)
 */

const fs = require('fs')
const path = require('path')

const FILES = [
  'src/components/landing/LandingRenderer.jsx',
  'src/components/PlansModal.jsx',
  'src/components/BusinessPlansModal.jsx',
  'src/components/GlobalFooter.jsx',
  'src/pages/Points.jsx',
  'src/pages/Premium.jsx',
  'src/business/BusinessBilling.jsx',
  'src/stores/brandingStore.js',
  'src/lib/landingBuilder.js',
  'src/lib/landingMenu.js',
]

// Bytes mojibake como strings para buscar con Buffer
// â‰ˆ = 0xC3 0xA2 0xE2 0x80 0xB0 0xCB 0x86  (UTF-8 de â, ‰, ˆ)
// Mejor enfoque: leer como binary latin1 y reemplazar secuencias

const FIXES = [
  // ≈ mojibake — bytes E2 89 88 leídos como Latin-1 dan â‰ˆ
  // En UTF-8 el archivo tiene: c3 a2 e2 80 b0 cb 86
  { from: Buffer.from([0xc3, 0xa2, 0xe2, 0x80, 0xb0, 0xcb, 0x86]), to: Buffer.from('≈', 'utf8') },
  // También puede aparecer como â‰ˆ de otra forma (3 chars Latin-1: â ‰ ˆ)
  { from: Buffer.from([0xc3, 0xa2, 0xe2, 0x80, 0xb0, 0xcc, 0x82]), to: Buffer.from('≈', 'utf8') },
  // ✓ checkmark mojibake — bytes E2 9C 93 leídos como Latin-1 dan âœ"
  // En UTF-8 el archivo tiene: c3 a2 c5 93 e2 80 9c
  { from: Buffer.from([0xc3, 0xa2, 0xc5, 0x93, 0xe2, 0x80, 0x9c]), to: Buffer.from('&#x2713;', 'utf8') },
  // © copyright mojibake — bytes C2 A9 leídos como Latin-1 dan Â©
  // En UTF-8 el archivo tiene: c3 82 c2 a9
  { from: Buffer.from([0xc3, 0x82, 0xc2, 0xa9]), to: Buffer.from('©', 'utf8') },
  // ˜ tilde pequeña en price-uyu (U+02DC) usada incorrectamente como ≈
  { from: Buffer.from('˜', 'utf8'), to: Buffer.from('≈', 'utf8') },
]

function applyFixes(buf) {
  let result = buf

  for (const fix of FIXES) {
    const pattern = fix.from
    const replacement = fix.to
    let output = Buffer.alloc(0)
    let i = 0

    while (i < result.length) {
      let found = false
      if (i + pattern.length <= result.length) {
        let match = true
        for (let j = 0; j < pattern.length; j++) {
          if (result[i + j] !== pattern[j]) { match = false; break }
        }
        if (match) {
          output = Buffer.concat([output, replacement])
          i += pattern.length
          found = true
        }
      }
      if (!found) {
        output = Buffer.concat([output, result.slice(i, i + 1)])
        i++
      }
    }
    result = output
  }

  return result
}

let totalFixed = 0

for (const relPath of FILES) {
  const filePath = path.join(__dirname, relPath)
  if (!fs.existsSync(filePath)) {
    console.log(`  SKIP (not found): ${relPath}`)
    continue
  }

  const original = fs.readFileSync(filePath)
  const fixed = applyFixes(original)

  if (Buffer.compare(original, fixed) !== 0) {
    fs.writeFileSync(filePath, fixed)
    console.log(`  FIXED: ${relPath}`)
    totalFixed++
  } else {
    console.log(`  OK (no changes): ${relPath}`)
  }
}

console.log(`\n✓ Total files fixed: ${totalFixed}`)

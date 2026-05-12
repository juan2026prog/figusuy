/**
 * fix_premium_checks.cjs
 * Corrige los ? literales en span.check de Premium.jsx
 * y los ˜ en price-uyu → ≈
 */
const fs = require('fs')
const path = require('path')

const filePath = path.join(__dirname, 'src/pages/Premium.jsx')
let content = fs.readFileSync(filePath, 'utf8')

// Reemplaza todos los <span className="check">?</span> por &#x2713;
// El ? puede ser el char U+003F o U+FFFD
content = content.replace(/<span className="check">[?]<\/span>/g, '<span className="check">&#x2713;</span>')

// También arregla la variante con comillas simples
content = content.replace(/<span className='check'>[?]<\/span>/g, "<span className='check'>&#x2713;</span>")

// Arregla el ˜ (U+02DC) usado incorrectamente como ≈
content = content.replace(/˜ \$/g, '≈ $')

const count1 = (content.match(/&#x2713;/g) || []).length
const count2 = (content.match(/≈ \$/g) || []).length
console.log('Check spans fixed:', count1)
console.log('Tilde ~ → ≈ fixed:', count2)

fs.writeFileSync(filePath, content, 'utf8')
console.log('Done: src/pages/Premium.jsx')

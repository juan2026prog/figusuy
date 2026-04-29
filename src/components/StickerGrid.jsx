import React from 'react'
import { useThemeStore } from '../stores/themeStore'

export default function StickerGrid({ totalStickers, missingStickers, duplicateStickers, onToggle, mode, searchFilter }) {
  const { isDark } = useThemeStore()
  const missingSet = new Set(missingStickers.map(s => s.sticker_number))
  const duplicateSet = new Set(duplicateStickers.map(s => s.sticker_number))

  const numbers = Array.from({ length: totalStickers }, (_, i) => i + 1)
    .filter(n => !searchFilter || String(n).includes(searchFilter))

  const btnBase = {
    aspectRatio: '1', minHeight: '2.5rem', borderRadius: '0.75rem',
    fontSize: '0.8125rem', fontWeight: 900, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.15s ease', border: 'none', fontFamily: 'inherit',
  }

  const getStyle = (n) => {
    if (missingSet.has(n)) return { ...btnBase, background: '#ef4444', color: 'white' }
    if (duplicateSet.has(n)) return { ...btnBase, background: '#10b981', color: 'white' }
    // "owned" = not missing and not duplicate — shown as dark/inverted
    return {
      ...btnBase,
      background: isDark ? 'rgba(255,255,255,0.06)' : '#fff',
      color: isDark ? 'rgba(255,255,255,0.45)' : '#a8a29e',
      border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#e7e5e4'}`,
    }
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(2.75rem, 1fr))',
      gap: '0.375rem',
    }}>
      {numbers.map(n => (
        <button
          key={n}
          style={getStyle(n)}
          onClick={() => onToggle(n, missingSet.has(n), duplicateSet.has(n))}
          title={`#${n}${missingSet.has(n) ? ' (Faltante)' : duplicateSet.has(n) ? ' (Repetida)' : ''}`}
        >
          {n}
        </button>
      ))}
    </div>
  )
}

import React, { useState } from 'react'

export default function StickerGrid({ totalStickers, missingStickers, duplicateStickers, onToggle, mode }) {
  const [searchQuery, setSearchQuery] = useState('')

  const missingSet = new Set(missingStickers.map(s => s.sticker_number))
  const duplicateSet = new Set(duplicateStickers.map(s => s.sticker_number))

  const filteredNumbers = Array.from({ length: totalStickers }, (_, i) => i + 1)
    .filter(n => {
      if (!searchQuery) return true
      return String(n).includes(searchQuery)
    })

  return (
    <div>
      {/* Search */}
      <div style={{ marginBottom: '1rem' }}>
        <input
          className="input"
          type="text"
          placeholder="Buscar figurita por número..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{ textAlign: 'center' }}
        />
      </div>

      {/* Legend */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '1rem',
        marginBottom: '1rem',
        fontSize: '0.75rem',
        fontWeight: 600,
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <span style={{ width: '0.75rem', height: '0.75rem', borderRadius: '0.25rem', background: '#fef2f2', border: '1.5px solid #fecaca' }} />
          Faltante
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <span style={{ width: '0.75rem', height: '0.75rem', borderRadius: '0.25rem', background: '#f0fdf4', border: '1.5px solid #bbf7d0' }} />
          Repetida
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <span style={{ width: '0.75rem', height: '0.75rem', borderRadius: '0.25rem', background: '#fff', border: '1.5px solid #e2e8f0' }} />
          Sin marcar
        </span>
      </div>

      {/* Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(2.75rem, 1fr))',
        gap: '0.375rem',
      }}>
        {filteredNumbers.map(n => {
          const isMissing = missingSet.has(n)
          const isDuplicate = duplicateSet.has(n)

          let className = 'sticker-item sticker-none'
          if (isMissing) className = 'sticker-item sticker-missing'
          if (isDuplicate) className = 'sticker-item sticker-duplicate'

          return (
            <button
              key={n}
              className={className}
              onClick={() => onToggle(n, isMissing, isDuplicate)}
              title={`Figurita #${n}${isMissing ? ' (Faltante)' : isDuplicate ? ' (Repetida)' : ''}`}
            >
              {n}
            </button>
          )
        })}
      </div>
    </div>
  )
}

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useAppStore } from '../stores/appStore'
import Header from '../components/Header'
import StickerGrid from '../components/StickerGrid'

export default function AlbumPage() {
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const { selectedAlbum, missingStickers, duplicateStickers, addMissingSticker, addDuplicateSticker, removeStickerStatus, bulkAddStickers, albums, selectAlbum, fetchAlbums } = useAppStore()
  const [mode, setMode] = useState('missing') // 'missing' | 'duplicate'
  const [bulkInput, setBulkInput] = useState('')
  const [showBulkInput, setShowBulkInput] = useState(false)

  useEffect(() => {
    if (!selectedAlbum && albums.length === 0) {
      fetchAlbums()
    }
  }, [])

  if (!selectedAlbum) {
    return (
      <div className="page">
        <Header title="Mi Álbum" subtitle="Seleccioná un álbum" />
        <div className="animate-fade-in" style={{
          textAlign: 'center',
          padding: '3rem 1rem',
          background: 'var(--color-surface)',
          borderRadius: 'var(--radius-2xl)',
          border: '1px solid var(--color-border-light)',
        }}>
          <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>📖</span>
          <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>No tenés un álbum seleccionado</p>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '1.25rem' }}>
            Elegí un álbum en la pantalla de inicio para empezar.
          </p>
          <button className="btn btn-primary" onClick={() => navigate('/home')}>
            Ir al inicio
          </button>
        </div>
      </div>
    )
  }

  const totalCollected = selectedAlbum.total_stickers - missingStickers.length
  const pct = Math.round((totalCollected / selectedAlbum.total_stickers) * 100)

  const handleToggle = (number, isMissing, isDuplicate) => {
    if (mode === 'missing') {
      if (isMissing) {
        removeStickerStatus(profile.id, selectedAlbum.id, number)
      } else {
        addMissingSticker(profile.id, selectedAlbum.id, number)
      }
    } else {
      if (isDuplicate) {
        removeStickerStatus(profile.id, selectedAlbum.id, number)
      } else {
        addDuplicateSticker(profile.id, selectedAlbum.id, number)
      }
    }
  }

  const handleBulkAdd = () => {
    const numbers = bulkInput
      .split(/[,\s]+/)
      .map(s => parseInt(s.trim()))
      .filter(n => !isNaN(n) && n >= 1 && n <= selectedAlbum.total_stickers)

    if (numbers.length > 0) {
      bulkAddStickers(profile.id, selectedAlbum.id, numbers, mode)
      setBulkInput('')
      setShowBulkInput(false)
    }
  }

  return (
    <div className="page">
      <Header
        title={selectedAlbum.name}
        subtitle="Mi Álbum"
        rightAction={
          <button className="btn btn-sm btn-secondary" onClick={() => navigate('/home')}>
            Cambiar
          </button>
        }
      />

      {/* Progress */}
      <div className="animate-fade-in-up" style={{
        background: 'var(--color-surface)',
        borderRadius: 'var(--radius-2xl)',
        padding: '1.25rem',
        marginBottom: '1.25rem',
        boxShadow: 'var(--shadow-sm)',
        border: '1px solid var(--color-border-light)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em' }}>{pct}%</span>
          <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
            {totalCollected}/{selectedAlbum.total_stickers}
          </span>
        </div>
        <div className="progress-bar" style={{ height: '10px' }}>
          <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem' }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '1.125rem', fontWeight: 700, color: '#ef4444' }}>{missingStickers.length}</p>
            <p style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Faltantes</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '1.125rem', fontWeight: 700, color: '#10b981' }}>{duplicateStickers.length}</p>
            <p style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Repetidas</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-primary)' }}>{totalCollected}</p>
            <p style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Pegadas</p>
          </div>
        </div>
      </div>

      {/* Mode Tabs */}
      <div className="tab-bar" style={{ marginBottom: '1rem' }}>
        <button
          className={`tab-item ${mode === 'missing' ? 'active' : ''}`}
          onClick={() => setMode('missing')}
        >
          ❌ Faltantes
        </button>
        <button
          className={`tab-item ${mode === 'duplicate' ? 'active' : ''}`}
          onClick={() => setMode('duplicate')}
        >
          🔄 Repetidas
        </button>
      </div>

      {/* Bulk add */}
      <div style={{ marginBottom: '1rem' }}>
        <button
          className="btn btn-sm btn-secondary"
          onClick={() => setShowBulkInput(!showBulkInput)}
          style={{ width: '100%', marginBottom: showBulkInput ? '0.75rem' : 0 }}
        >
          {showBulkInput ? '✕ Cerrar' : `📝 Agregar ${mode === 'missing' ? 'faltantes' : 'repetidas'} en lote`}
        </button>

        {showBulkInput && (
          <div className="animate-fade-in" style={{
            background: 'var(--color-surface)',
            borderRadius: 'var(--radius-xl)',
            padding: '1rem',
            border: '1px solid var(--color-border)',
          }}>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
              Escribí los números separados por coma o espacio:
            </p>
            <textarea
              className="input"
              value={bulkInput}
              onChange={e => setBulkInput(e.target.value)}
              placeholder="Ej: 1, 5, 23, 45, 120..."
              rows={3}
              style={{ resize: 'vertical', marginBottom: '0.5rem' }}
            />
            <button className="btn btn-primary btn-sm" onClick={handleBulkAdd} style={{ width: '100%' }}>
              Agregar {mode === 'missing' ? 'faltantes' : 'repetidas'}
            </button>
          </div>
        )}
      </div>

      {/* Hint */}
      <p style={{
        fontSize: '0.8125rem',
        color: 'var(--color-text-muted)',
        textAlign: 'center',
        marginBottom: '0.75rem',
        fontStyle: 'italic',
      }}>
        Tocá una figurita para marcarla como {mode === 'missing' ? 'faltante' : 'repetida'}
      </p>

      {/* Sticker Grid */}
      <div style={{
        background: 'var(--color-surface)',
        borderRadius: 'var(--radius-2xl)',
        padding: '1rem',
        border: '1px solid var(--color-border-light)',
      }}>
        <StickerGrid
          totalStickers={selectedAlbum.total_stickers}
          missingStickers={missingStickers}
          duplicateStickers={duplicateStickers}
          onToggle={handleToggle}
          mode={mode}
        />
      </div>
    </div>
  )
}

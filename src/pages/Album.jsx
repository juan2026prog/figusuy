// src/pages/AlbumPage.jsx
import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useAppStore } from '../stores/appStore'
import { useToast } from '../components/Toast'
import { supabase } from '../lib/supabase'

export default function AlbumPage() {
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const {
    albums = [],
    selectedAlbum,
    fetchAlbums,
    fetchUserAlbums,
    selectAlbum,
    ownedStickers = [],
    missingStickers = [],
    duplicateStickers = [],
    addOwnedSticker,
    addMissingSticker,
    addDuplicateSticker,
    removeStickerStatus,
    bulkAddStickers,
  } = useAppStore()
  const toast = useToast()

  const [mode, setMode] = useState('have')
  const [viewMode, setViewMode] = useState('numbers') // 'numbers' | 'checklist'
  const [checklistImagesEnabled, setChecklistImagesEnabled] = useState(true)

  useEffect(() => {
    // Fetch checklist setting
    supabase.from('app_settings').select('value').eq('key', 'checklist_images_enabled').single()
      .then(({ data }) => {
        if (data) {
          const val = typeof data.value === 'string' ? data.value.replace(/"/g, '') : data.value
          setChecklistImagesEnabled(val === true || val === 'true')
        }
      })
  }, [])
  const [searchFilter, setSearchFilter] = useState('')
  const [activeTab, setActiveTab] = useState('base')
  const [showBulk, setShowBulk] = useState(false)
  const [bulkInput, setBulkInput] = useState('')

  useEffect(() => {
    fetchAlbums()
    if (profile?.id) {
      fetchUserAlbums(profile.id)
    }
  }, [profile?.id, fetchAlbums, fetchUserAlbums])

  const total = selectedAlbum?.total_stickers || 980

  const tabs = useMemo(
    () => [
      { key: 'base', label: `Base 1-${total}` },
      { key: 'special_m', label: 'Especiales M' },
      { key: 'promos', label: 'Promos' },
      { key: 'missing', label: 'Faltantes' },
      { key: 'duplicates', label: 'Repetidas' },
    ],
    [total]
  )

  const ownedSet = useMemo(
    () => new Set(ownedStickers.map((s) => String(s.sticker_number))),
    [ownedStickers]
  )

  const missingSet = useMemo(
    () => new Set(missingStickers.map((s) => String(s.sticker_number))),
    [missingStickers]
  )

  const duplicateSet = useMemo(
    () => new Set(duplicateStickers.map((s) => String(s.sticker_number))),
    [duplicateStickers]
  )

  const ownedCount = ownedStickers.length
  const missingCount = missingStickers.length
  const duplicateCount = duplicateStickers.length
  const progressPercent = total > 0 ? Math.round((ownedCount / total) * 100) : 0

  const numbers = useMemo(() => {
    let result = []

    if (activeTab === 'base') {
      result = Array.from({ length: total }, (_, i) => String(i + 1))
    } else if (activeTab === 'special_m') {
      result = Array.from({ length: 20 }, (_, i) => `M${i + 1}`)
    } else if (activeTab === 'promos') {
      result = ['P1', 'P2', 'P3', 'F1', 'F2']
    } else if (activeTab === 'missing') {
      result = Array.from(missingSet)
    } else if (activeTab === 'duplicates') {
      result = Array.from(duplicateSet)
    }

    if (!searchFilter.trim()) return result

    const query = searchFilter.trim().toLowerCase()
    return result.filter((n) => {
      if (n.toLowerCase().includes(query)) return true
      const sData = useAppStore.getState().albumStickers?.find(s => String(s.sticker_number) === n)
      if (sData?.name?.toLowerCase().includes(query)) return true
      if (sData?.team?.toLowerCase().includes(query)) return true
      return false
    })
  }, [activeTab, total, missingSet, duplicateSet, searchFilter, useAppStore])

  const albumStickersMap = useMemo(() => {
    const map = {}
    useAppStore.getState().albumStickers?.forEach(s => {
      map[String(s.sticker_number)] = s
    })
    return map
  }, [useAppStore.getState().albumStickers])

  const handleToggle = async (num) => {
    if (!profile?.id || !selectedAlbum?.id) return

    const sticker = String(num)
    const isOwned = ownedSet.has(sticker)
    const isMissing = missingSet.has(sticker)
    const isDuplicate = duplicateSet.has(sticker)

    try {
      if (mode === 'have') {
        if (isOwned) {
          await removeStickerStatus(profile.id, selectedAlbum.id, sticker)
        } else {
          await addOwnedSticker(profile.id, selectedAlbum.id, sticker)
        }
        return
      }

      if (mode === 'missing') {
        if (isMissing) {
          await removeStickerStatus(profile.id, selectedAlbum.id, sticker)
        } else {
          await addMissingSticker(profile.id, selectedAlbum.id, sticker)
        }
        return
      }

      if (mode === 'duplicate') {
        if (isDuplicate) {
          await removeStickerStatus(profile.id, selectedAlbum.id, sticker)
        } else {
          await addDuplicateSticker(profile.id, selectedAlbum.id, sticker)
        }
        return
      }

      if (mode === 'clear') {
        await removeStickerStatus(profile.id, selectedAlbum.id, sticker)
      }
    } catch {
      toast.error('No se pudo actualizar la figurita')
    }
  }

  const handleBulkAdd = async () => {
    if (!bulkInput.trim() || !profile?.id || !selectedAlbum?.id) return

    const nums = bulkInput
      .split(/[,\s]+/)
      .map((n) => n.trim().toUpperCase())
      .filter(Boolean)

    if (!nums.length) {
      toast.error('No se encontraron números válidos')
      return
    }

    const targetMode =
      mode === 'missing' ? 'missing' : mode === 'duplicate' ? 'duplicate' : 'have'

    try {
      await bulkAddStickers(profile.id, selectedAlbum.id, nums, targetMode)
      toast.success(`${nums.length} figurita(s) procesada(s)`)
      setBulkInput('')
      setShowBulk(false)
    } catch {
      toast.error('No se pudo procesar la carga rápida')
    }
  }

  if (!selectedAlbum) {
    return (
      <div className="album-page-root">
        <style>{`
          .album-page-root {
            background-color: #020617;
            min-height: 100vh;
            color: white;
          }
          .no-album-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 2.5rem;
            text-align: center;
            min-height: 60vh;
          }
          .no-album-icon {
            width: 5rem;
            height: 5rem;
            background-color: #0f172a;
            border-radius: 1.5rem;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 2.25rem;
            margin-bottom: 1.5rem;
          }
          .no-album-title { font-size: 1.875rem; font-weight: 900; margin: 0 0 0.5rem; }
          .no-album-desc { color: #94a3b8; margin-bottom: 2rem; }
          .album-list { display: grid; gap: 0.75rem; width: 100%; max-width: 28rem; }
          .album-item-btn {
            display: flex;
            align-items: center;
            gap: 1rem;
            padding: 1rem;
            border-radius: 1rem;
            background-color: #0f172a;
            border: 1px solid rgba(255,255,255,0.1);
            transition: all 0.2s;
            text-align: left;
            cursor: pointer;
          }
          .album-item-btn:hover { border-color: #ea580c; }
          .album-item-icon {
            width: 3rem;
            height: 3rem;
            background-color: #ea580c;
            border-radius: 0.75rem;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
          }
          .album-item-name { font-weight: 900; margin: 0; color: white; }
          .album-item-meta { font-size: 0.75rem; color: #64748b; margin: 0; }
        `}</style>
        <div className="no-album-container">
          <div className="no-album-icon">📖</div>
          <h1 className="no-album-title">Elegí un álbum para empezar</h1>
          <p className="no-album-desc">Seleccioná uno de los álbumes disponibles para administrar tus figuritas.</p>
          <div className="album-list">
            {albums.map((album) => {
              const coverImg = album.cover_url || (album.images && album.images.length > 0 ? album.images[0] : null)
              return (
                <button
                  key={album.id}
                  onClick={async () => {
                    const res = await selectAlbum(album, profile?.id)
                    if (res?.error) {
                      if (res.error.message.includes('límite de álbumes activos')) {
                        const upgrade = window.confirm('Tu plan permite un número limitado de álbumes activos.\n\n¿Querés mejorar tu plan?')
                        if (upgrade) {
                          navigate('/premium')
                        }
                      } else {
                        toast.error(res.error.message)
                      }
                    }
                  }}
                  className="album-item-btn"
                >
                  <div className="album-item-icon" style={coverImg ? { background: 'none' } : {}}>
                    {coverImg ? <img src={coverImg} alt={album.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '0.75rem' }} /> : '⚽'}
                  </div>
                  <div>
                    <p className="album-item-name">{album.name}</p>
                    <p className="album-item-meta">{album.year} • {album.total_stickers} figuritas</p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="album-page-root">
      <style>{`
        .album-page-root {
          background-color: #020617;
          min-height: 100vh;
          color: white;
          font-family: inherit;
        }

        /* TOPBAR */
        .album-topbar {
          position: sticky;
          top: 0;
          z-index: 40;
          height: 5rem;
          background-color: rgba(5, 8, 22, 0.9);
          backdrop-filter: blur(16px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          padding: 0 1rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
        }

        @media (min-width: 768px) {
          .album-topbar { padding: 0 2rem; }
        }

        .topbar-info p {
          font-size: 0.75rem;
          color: #64748b;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin: 0;
        }

        .topbar-info h1 {
          font-size: 1.25rem;
          font-weight: 900;
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 160px;
        }

        @media (min-width: 768px) {
          .topbar-info h1 {
            font-size: 1.5rem;
            max-width: 320px;
          }
        }

        .topbar-search {
          display: none;
          flex: 1;
          max-width: 32rem;
          margin: 0 1.5rem;
        }

        @media (min-width: 1024px) {
          .topbar-search { display: flex; }
        }

        .topbar-search input, .album-search-input {
          width: 100%;
          padding: 0.75rem 1.25rem;
          border-radius: 1rem;
          background-color: #0f172a;
          border: 1px solid rgba(255,255,255,0.1);
          color: white;
          font-size: 0.875rem;
          font-weight: 700;
          outline: none;
        }
        .topbar-search input:focus, .album-search-input:focus {
          border-color: #ea580c;
          box-shadow: 0 0 0 2px rgba(234,88,12,0.2);
        }

        .topbar-actions {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-shrink: 0;
        }

        .album-select {
          display: none;
          padding: 0.625rem 1rem;
          border-radius: 1rem;
          background-color: #0f172a;
          border: 1px solid rgba(255,255,255,0.1);
          color: white;
          font-size: 0.875rem;
          font-weight: 700;
          outline: none;
        }
        @media (min-width: 640px) {
          .album-select { display: block; }
        }

        .btn-primary {
          padding: 0.625rem 1rem;
          border-radius: 1rem;
          background-color: #ea580c;
          color: white;
          font-weight: 900;
          font-size: 0.875rem;
          border: none;
          cursor: pointer;
          box-shadow: 0 10px 15px -3px rgba(234,88,12,0.25);
          transition: all 0.2s;
        }
        .btn-primary:hover {
          background-color: #f97316;
        }

        .album-container {
          max-width: 1500px;
          margin: 0 auto;
          padding: 1.5rem 1rem 6rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        @media (min-width: 768px) {
          .album-container {
            padding: 1.5rem 2rem 2rem;
          }
        }

        /* HERO SUMMARY */
        .album-hero {
          border-radius: 2rem;
          background: linear-gradient(to bottom right, #111827, #0f172a, #1f1308);
          border: 1px solid rgba(255,255,255,0.1);
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
          padding: 1.25rem;
        }

        @media (min-width: 768px) {
          .album-hero { padding: 1.75rem; }
        }

        .album-hero-content {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        @media (min-width: 1280px) {
          .album-hero-content {
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
          }
        }

        .album-hero-info {
          display: flex;
          align-items: center;
          gap: 1.25rem;
          flex: 1;
          min-width: 0;
        }

        .album-hero-icon {
          width: 5rem;
          height: 6rem;
          border-radius: 1.7rem;
          background: linear-gradient(to bottom right, #f97316, #c2410c);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2.25rem;
          box-shadow: 0 20px 25px -5px rgba(234,88,12,0.3);
          flex-shrink: 0;
        }

        .album-hero-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }
        .badge-principal {
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          background-color: rgba(234,88,12,0.2);
          border: 1px solid rgba(234,88,12,0.3);
          color: #f97316;
          font-size: 0.75rem;
          font-weight: 900;
        }
        .badge-secondary {
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          background-color: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.1);
          color: #cbd5e1;
          font-size: 0.75rem;
          font-weight: 900;
        }

        .album-hero-title {
          font-size: 1.875rem;
          font-weight: 900;
          margin: 0;
          letter-spacing: -0.025em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        @media (min-width: 768px) {
          .album-hero-title { font-size: 3rem; }
        }

        .album-hero-desc {
          color: #94a3b8;
          font-size: 0.875rem;
          margin: 0.5rem 0 0;
          display: none;
        }
        @media (min-width: 640px) {
          .album-hero-desc { display: block; }
        }

        .album-stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.75rem;
        }
        @media (min-width: 640px) {
          .album-stats-grid { grid-template-columns: repeat(4, 1fr); }
        }
        @media (min-width: 1280px) {
          .album-stats-grid { min-width: 520px; }
        }

        .stat-card {
          border-radius: 1.5rem;
          padding: 1rem;
          text-align: center;
        }
        .stat-card-default {
          background-color: #070b1a;
          border: 1px solid rgba(255,255,255,0.1);
        }
        .stat-card-success {
          background-color: rgba(6,78,59,0.3);
          border: 1px solid rgba(16,185,129,0.2);
        }
        .stat-card-danger {
          background-color: rgba(127,29,29,0.3);
          border: 1px solid rgba(239,68,68,0.2);
        }
        .stat-card-primary {
          background-color: #ea580c;
        }

        .stat-value {
          font-size: 1.875rem;
          font-weight: 900;
          margin: 0;
        }
        .stat-value.text-success { color: #34d399; }
        .stat-value.text-danger { color: #f87171; }
        .stat-value.text-white { color: white; }

        .stat-label {
          font-size: 0.625rem;
          font-weight: 900;
          text-transform: uppercase;
          margin: 0.25rem 0 0;
          color: #64748b;
        }
        .stat-card-primary .stat-label { color: #ffedd5; }

        .progress-section {
          margin-top: 1.5rem;
        }
        .progress-header {
          display: flex;
          justify-content: space-between;
          font-size: 0.875rem;
          font-weight: 900;
          margin-bottom: 0.5rem;
        }
        .progress-header .progress-text { color: #f97316; }

        .progress-bar-container {
          height: 1rem;
          border-radius: 9999px;
          background-color: #070b1a;
          border: 1px solid rgba(255,255,255,0.1);
          overflow: hidden;
          display: flex;
        }
        .progress-fill {
          height: 100%;
          transition: width 0.3s ease;
        }
        .progress-fill-owned { background-color: #ea580c; }
        .progress-fill-missing { background-color: #ef4444; }

        .progress-legend {
          display: flex;
          justify-content: space-between;
          font-size: 0.75rem;
          font-weight: 700;
          color: #64748b;
          margin-top: 0.5rem;
        }
        .progress-legend .text-danger { color: #f87171; }

        /* MAIN GRID CONTENT */
        .content-layout {
          display: grid;
          gap: 1.5rem;
          align-items: start;
        }

        @media (min-width: 1280px) {
          .content-layout {
            grid-template-columns: 1fr 360px;
          }
        }

        .control-panel {
          background-color: #0f172a;
          border-radius: 2rem;
          border: 1px solid rgba(255,255,255,0.1);
          box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5);
          display: flex;
          flex-direction: column;
        }

        .control-header {
          padding: 1.25rem;
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        @media (min-width: 768px) {
          .control-header { padding: 1.5rem; }
        }

        .control-title-row {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        @media (min-width: 1536px) {
          .control-title-row {
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
          }
        }

        .control-title h3 {
          font-size: 1.5rem;
          font-weight: 900;
          margin: 0;
        }
        @media (min-width: 768px) {
          .control-title h3 { font-size: 1.875rem; }
        }

        .control-title p {
          font-size: 0.875rem;
          color: #94a3b8;
          margin: 0.25rem 0 0;
        }

        .view-toggle-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(255,255,255,0.05);
          padding: 0.25rem;
          border-radius: 1rem;
          width: fit-content;
          margin-bottom: 1rem;
        }
        
        .view-toggle-btn {
          padding: 0.5rem 1rem;
          border-radius: 0.75rem;
          font-weight: 700;
          font-size: 0.875rem;
          border: none;
          background: transparent;
          color: #94a3b8;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .view-toggle-btn.active {
          background: #ea580c;
          color: white;
          box-shadow: 0 4px 6px -1px rgba(234,88,12,0.2);
        }

        .mode-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .mode-btn {
          padding: 0.75rem 1rem;
          border-radius: 1rem;
          font-weight: 900;
          font-size: 0.875rem;
          transition: all 0.2s;
          cursor: pointer;
          border: 1px solid transparent;
        }
        .mode-btn-inactive {
          background-color: rgba(255,255,255,0.1);
          border-color: rgba(255,255,255,0.1);
          color: #cbd5e1;
        }
        .mode-btn-inactive:hover { background-color: rgba(255,255,255,0.2); }
        .mode-btn-active-have { background-color: white; color: #020617; box-shadow: 0 0 0 2px #ea580c; }
        .mode-btn-active-dup { background-color: rgba(16,185,129,0.15); border-color: rgba(16,185,129,0.3); color: #6ee7b7; box-shadow: 0 0 0 2px #ea580c; }
        .mode-btn-active-mis { background-color: rgba(239,68,68,0.15); border-color: rgba(239,68,68,0.3); color: #fca5a5; box-shadow: 0 0 0 2px #ea580c; }
        .mode-btn-active-clr { background-color: rgba(255,255,255,0.2); border-color: rgba(255,255,255,0.2); color: white; box-shadow: 0 0 0 2px #ea580c; }

        .search-bulk-row {
          margin-top: 1.25rem;
          display: grid;
          gap: 0.75rem;
        }
        @media (min-width: 1024px) {
          .search-bulk-row { grid-template-columns: 1fr auto auto; }
        }

        .btn-secondary {
          padding: 0.75rem 1.25rem;
          border-radius: 1rem;
          background-color: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.1);
          color: white;
          font-weight: 900;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-secondary:hover { background-color: rgba(255,255,255,0.2); }

        .bulk-input-container {
          margin-top: 1rem;
          padding: 1rem;
          border-radius: 1rem;
          background-color: #070b1a;
          border: 1px solid rgba(255,255,255,0.1);
        }
        .bulk-textarea {
          width: 100%;
          background: transparent;
          border: none;
          outline: none;
          color: white;
          font-size: 0.875rem;
          font-weight: 700;
          min-height: 5rem;
          resize: none;
          margin-bottom: 0.75rem;
        }
        .bulk-textarea::placeholder { color: #475569; }
        .btn-white {
          width: 100%;
          padding: 0.75rem;
          background-color: white;
          color: #020617;
          border-radius: 0.75rem;
          font-weight: 900;
          font-size: 0.875rem;
          border: none;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        .btn-white:hover { background-color: #f1f5f9; }

        .legend-row {
          margin-top: 1.25rem;
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          font-size: 0.75rem;
          font-weight: 700;
          color: #94a3b8;
        }
        .legend-item {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }
        .legend-color {
          width: 1rem;
          height: 1rem;
          border-radius: 0.25rem;
        }

        .tabs-container {
          padding: 1.25rem 1.25rem 0;
          display: flex;
          gap: 0.5rem;
          overflow-x: auto;
          scrollbar-width: none;
        }
        @media (min-width: 768px) {
          .tabs-container { padding: 1.5rem 1.5rem 0; }
        }

        .tab-btn {
          padding: 0.5rem 1rem;
          border-radius: 0.75rem;
          font-weight: 900;
          font-size: 0.875rem;
          white-space: nowrap;
          cursor: pointer;
          border: 1px solid transparent;
          transition: all 0.2s;
        }
        .tab-btn-active {
          background-color: #ea580c;
          color: white;
        }
        .tab-btn-inactive {
          background-color: #070b1a;
          border-color: rgba(255,255,255,0.1);
          color: #cbd5e1;
        }
        .tab-btn-inactive:hover { border-color: #ea580c; }

        .grid-container-wrapper {
          padding: 1.25rem;
        }
        @media (min-width: 768px) {
          .grid-container-wrapper { padding: 1.5rem; }
        }

        .grid-scroll-area {
          max-height: 480px;
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: #1e293b transparent;
          padding-right: 0.5rem;
        }

        .stickers-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 0.5rem;
        }
        @media (min-width: 640px) { .stickers-grid { grid-template-columns: repeat(8, 1fr); } }
        @media (min-width: 768px) { .stickers-grid { grid-template-columns: repeat(10, 1fr); } }
        @media (min-width: 1024px) { .stickers-grid { grid-template-columns: repeat(12, 1fr); } }
        @media (min-width: 1536px) { .stickers-grid { grid-template-columns: repeat(16, 1fr); } }

        .sticker-btn {
          aspect-ratio: 1 / 1;
          border-radius: 0.75rem;
          font-weight: 900;
          font-size: 0.875rem;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          border: 1px solid transparent;
        }
        .sticker-owned {
          background-color: white;
          color: #020617;
        }
        .sticker-duplicate {
          background-color: #10b981;
          color: white;
          box-shadow: 0 10px 15px -3px rgba(16,185,129,0.2);
        }
        .sticker-missing {
          background-color: #ef4444;
          color: white;
          box-shadow: 0 10px 15px -3px rgba(239,68,68,0.2);
        }
        .sticker-unmarked {
          background-color: #070b1a;
          border-color: rgba(255,255,255,0.1);
          color: #64748b;
        }
        .sticker-unmarked:hover { border-color: #ea580c; }

        .stickers-checklist {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.75rem;
        }
        @media (min-width: 640px) { .stickers-checklist { grid-template-columns: repeat(3, 1fr); } }
        @media (min-width: 1024px) { .stickers-checklist { grid-template-columns: repeat(4, 1fr); } }
        @media (min-width: 1536px) { .stickers-checklist { grid-template-columns: repeat(6, 1fr); } }

        .checklist-card {
          background-color: #070b1a;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 1rem;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          flex-direction: column;
        }
        .checklist-card:hover { border-color: #ea580c; }
        
        .checklist-card.owned { border-color: rgba(255,255,255,0.3); }
        .checklist-card.duplicate { border-color: rgba(16,185,129,0.5); }
        .checklist-card.missing { border-color: rgba(239,68,68,0.5); }

        .checklist-img-wrapper {
          aspect-ratio: 3/4;
          background-color: #0f172a;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        
        .checklist-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .checklist-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #475569;
          gap: 0.5rem;
        }
        
        .checklist-info {
          padding: 0.75rem;
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        
        .checklist-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 0.25rem;
        }
        
        .checklist-num {
          font-weight: 900;
          font-size: 1rem;
          color: white;
        }
        
        .checklist-name {
          font-size: 0.75rem;
          color: #94a3b8;
          font-weight: 700;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .checklist-status {
          margin-top: auto;
          padding-top: 0.5rem;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }
        
        .status-dot {
          width: 0.5rem;
          height: 0.5rem;
          border-radius: 50%;
        }
        .status-text {
          font-size: 0.625rem;
          font-weight: 900;
          text-transform: uppercase;
        }

        .right-panel {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        @media (min-width: 1280px) {
          .right-panel {
            position: sticky;
            top: 6rem;
          }
        }

        .panel-card {
          border-radius: 2rem;
          padding: 1.5rem;
          box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5);
        }
        .panel-card-brand {
          background-color: #ea580c;
        }
        .panel-card-dark {
          background-color: #0f172a;
          border: 1px solid rgba(255,255,255,0.1);
        }

        .panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.75rem;
        }
        .panel-title {
          font-size: 1.5rem;
          font-weight: 900;
          color: white;
          margin: 0;
        }
        .panel-card-dark .panel-title { margin-bottom: 1.25rem; }

        .panel-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          background-color: white;
          color: #ea580c;
          font-size: 0.75rem;
          font-weight: 900;
        }

        .panel-text {
          color: #ffedd5;
          font-size: 0.875rem;
          margin: 0;
        }
        .panel-card-dark .panel-text { color: #94a3b8; }

        .panel-btn {
          margin-top: 1.25rem;
          width: 100%;
          padding: 1rem;
          border-radius: 1rem;
          background-color: white;
          color: #ea580c;
          font-weight: 900;
          font-size: 0.875rem;
          border: none;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        .panel-btn:hover { background-color: #fff7ed; }

        .nav-links {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .nav-link-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem;
          border-radius: 1rem;
          background-color: #070b1a;
          border: 1px solid rgba(255,255,255,0.1);
          transition: border-color 0.2s;
          cursor: pointer;
        }
        .nav-link-btn:hover { border-color: #ea580c; }
        .nav-link-label { font-weight: 900; color: white; font-size: 0.875rem; }
        .nav-link-val { font-weight: 900; font-size: 0.875rem; }
        .text-emerald { color: #34d399; }
        .text-red { color: #f87171; }
        .text-slate { color: #94a3b8; }

        .mobile-nav {
          position: fixed;
          bottom: 0; left: 0; right: 0;
          z-index: 50;
          background-color: rgba(15, 23, 42, 0.95);
          backdrop-filter: blur(16px);
          border-top: 1px solid rgba(255,255,255,0.1);
          padding: 0.75rem 1rem;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0.5rem;
          text-align: center;
        }
        @media (min-width: 768px) {
          .mobile-nav { display: none; }
        }
        .mobile-nav button {
          color: #94a3b8;
          font-size: 0.75rem;
          font-weight: 700;
          border: none;
          background: none;
          cursor: pointer;
        }
        .mobile-nav button.text-brand { color: #f97316; }
      `}</style>

      {/* TOPBAR */}
      <header className="album-topbar">
        <div className="topbar-info">
          <p>Álbum activo</p>
          <h1>{selectedAlbum.name}</h1>
        </div>

        <div className="topbar-search">
          <input
            type="text"
            placeholder="Buscar figurita, código o sección..."
            onChange={(e) => setSearchFilter(e.target.value)}
          />
        </div>

        <div className="topbar-actions">
          <select
            value={String(selectedAlbum.id)}
            onChange={async (e) => {
              const album = albums.find((x) => String(x.id) === e.target.value)
              if (album) {
                const res = await selectAlbum(album, profile?.id)
                if (res?.error) {
                  if (res.error.message.includes('límite de álbumes activos')) {
                    const upgrade = window.confirm('Tu plan permite un número limitado de álbumes activos.\n\n¿Querés mejorar tu plan?')
                    if (upgrade) {
                      navigate('/premium')
                    }
                  } else {
                    toast.error(res.error.message)
                  }
                }
              }
            }}
            className="album-select"
          >
            {albums.map((album) => (
              <option key={album.id} value={String(album.id)}>
                {album.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => navigate('/matches')}
            className="btn-primary"
          >
            Ver intercambios
          </button>
        </div>
      </header>

      <section className="album-container">
        
        {/* HERO SUMMARY */}
        <div className="album-hero">
          <div className="album-hero-content">
            <div className="album-hero-info">
              <div className="album-hero-icon" style={selectedAlbum.cover_url || (selectedAlbum.images && selectedAlbum.images.length > 0) ? { background: 'none' } : {}}>
                {selectedAlbum.cover_url || (selectedAlbum.images && selectedAlbum.images.length > 0) ? (
                  <img src={selectedAlbum.cover_url || selectedAlbum.images[0]} alt={selectedAlbum.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '1.7rem' }} />
                ) : '⚽'}
              </div>
              <div style={{ minWidth: 0 }}>
                <div className="album-hero-badges">
                  <span className="badge-principal">Principal</span>
                  <span className="badge-secondary">{total} figuritas</span>
                </div>
                <h2 className="album-hero-title">{selectedAlbum.name}</h2>
                <p className="album-hero-desc">
                  Marcá tus figuritas, repetidas y faltantes desde una sola plantilla.
                </p>
              </div>
            </div>

            <div className="album-stats-grid">
              <div className="stat-card stat-card-default">
                <p className="stat-value">{ownedCount}</p>
                <p className="stat-label">Tengo</p>
              </div>
              <div className="stat-card stat-card-success">
                <p className="stat-value text-success">{duplicateCount}</p>
                <p className="stat-label">Repetidas</p>
              </div>
              <div className="stat-card stat-card-danger">
                <p className="stat-value text-danger">{missingCount}</p>
                <p className="stat-label">Faltantes</p>
              </div>
              <div className="stat-card stat-card-primary">
                <p className="stat-value text-white">{progressPercent}%</p>
                <p className="stat-label">Completo</p>
              </div>
            </div>
          </div>

          <div className="progress-section">
            <div className="progress-header">
              <span>Progreso del álbum</span>
              <span className="progress-text">{ownedCount} / {total}</span>
            </div>
            <div className="progress-bar-container">
              <div className="progress-fill progress-fill-owned" style={{ width: `${progressPercent}%` }} />
              <div className="progress-fill progress-fill-missing" style={{ width: `${(missingCount / total) * 100}%` }} />
            </div>
            <div className="progress-legend">
              <span>✓ Marcadas como tengo</span>
              <span className="text-danger">❌ Faltantes</span>
            </div>
          </div>
        </div>

        {/* CONTENT GRID */}
        <div className="content-layout">
          
          {/* CONTROL PANEL */}
          <div className="control-panel">
            <div className="control-header">
              <div className="view-toggle-row">
                <button 
                  className={`view-toggle-btn ${viewMode === 'numbers' ? 'active' : ''}`}
                  onClick={() => setViewMode('numbers')}
                >
                  Números
                </button>
                <button 
                  className={`view-toggle-btn ${viewMode === 'checklist' ? 'active' : ''}`}
                  onClick={() => setViewMode('checklist')}
                >
                  Checklist
                </button>
              </div>

              <div className="control-title-row">
                <div className="control-title">
                  <h3>Control de figuritas</h3>
                  <p>Elegí un modo y tocá las figuritas para marcarlas.</p>
                </div>
                
                <div className="mode-buttons">
                  {[
                    { key: 'have', label: '✓ Tengo', activeClass: 'mode-btn-active-have' },
                    { key: 'duplicate', label: '🔁 Repetida', activeClass: 'mode-btn-active-dup' },
                    { key: 'missing', label: '❌ Faltante', activeClass: 'mode-btn-active-mis' },
                    { key: 'clear', label: 'Borrar', activeClass: 'mode-btn-active-clr' },
                  ].map(({ key, label, activeClass }) => (
                    <button
                      key={key}
                      onClick={() => setMode(key)}
                      className={`mode-btn ${mode === key ? activeClass : 'mode-btn-inactive'}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="search-bulk-row">
                <input
                  type="text"
                  placeholder="Buscar número o código: 10, 125, M1..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="album-search-input"
                />
                <button
                  onClick={() => setShowBulk((prev) => !prev)}
                  className="btn-primary"
                >
                  Carga rápida
                </button>
                <button className="btn-secondary">
                  Guardar
                </button>
              </div>

              {showBulk && (
                <div className="bulk-input-container">
                  <textarea
                    placeholder="Ingresá los números separados por coma o espacio (ej: 1, 5, 12, M3...)"
                    value={bulkInput}
                    onChange={(e) => setBulkInput(e.target.value)}
                    className="bulk-textarea"
                  />
                  <button
                    onClick={handleBulkAdd}
                    className="btn-white"
                  >
                    Procesar figuritas
                  </button>
                </div>
              )}

              <div className="legend-row">
                <span className="legend-item"><span className="legend-color" style={{ backgroundColor: 'white' }}></span> Tengo</span>
                <span className="legend-item"><span className="legend-color" style={{ backgroundColor: '#10b981' }}></span> Repetida</span>
                <span className="legend-item"><span className="legend-color" style={{ backgroundColor: '#ef4444' }}></span> Faltante</span>
                <span className="legend-item"><span className="legend-color" style={{ backgroundColor: '#070b1a', border: '1px solid rgba(255,255,255,0.2)' }}></span> Sin marcar</span>
              </div>
            </div>

            {/* TABS */}
            <div className="tabs-container">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`tab-btn ${activeTab === tab.key ? 'tab-btn-active' : 'tab-btn-inactive'}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* GRID */}
            <div className="grid-container-wrapper">
              <div className="grid-scroll-area">
                {viewMode === 'numbers' ? (
                  <div className="stickers-grid">
                    {numbers.map((num) => {
                      const sticker = String(num)
                      const isOwned = ownedSet.has(sticker)
                      const isMissing = missingSet.has(sticker)
                      const isDuplicate = duplicateSet.has(sticker)

                      let cls = 'sticker-btn '

                      if (isDuplicate) {
                        cls += 'sticker-duplicate'
                      } else if (isMissing) {
                        cls += 'sticker-missing'
                      } else if (isOwned) {
                        cls += 'sticker-owned'
                      } else {
                        cls += 'sticker-unmarked'
                      }

                      return (
                        <button key={sticker} onClick={() => handleToggle(sticker)} className={cls}>
                          {sticker}
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <div className="stickers-checklist">
                    {numbers.map((num) => {
                      const sticker = String(num)
                      const isOwned = ownedSet.has(sticker)
                      const isMissing = missingSet.has(sticker)
                      const isDuplicate = duplicateSet.has(sticker)
                      const sData = albumStickersMap[sticker]

                      let statusColor = '#070b1a'
                      let statusText = 'Sin marcar'
                      let statusTextCol = '#64748b'
                      let cardCls = 'checklist-card '

                      if (isDuplicate) {
                        statusColor = '#10b981'
                        statusText = 'Repetida'
                        statusTextCol = '#10b981'
                        cardCls += 'duplicate'
                      } else if (isMissing) {
                        statusColor = '#ef4444'
                        statusText = 'Faltante'
                        statusTextCol = '#ef4444'
                        cardCls += 'missing'
                      } else if (isOwned) {
                        statusColor = 'white'
                        statusText = 'Tengo'
                        statusTextCol = 'white'
                        cardCls += 'owned'
                      }

                      return (
                        <div key={sticker} onClick={() => handleToggle(sticker)} className={cardCls}>
                          {checklistImagesEnabled && (
                            <div className="checklist-img-wrapper">
                              {sData?.image_url ? (
                                <img src={sData.image_url} alt={sData.name || sticker} className="checklist-img" loading="lazy" />
                              ) : (
                                <div className="checklist-placeholder">
                                  <span style={{ fontSize: '1.5rem' }}>📷</span>
                                  <span style={{ fontSize: '0.625rem', fontWeight: 700 }}>Sin imagen</span>
                                </div>
                              )}
                            </div>
                          )}
                          <div className="checklist-info">
                            <div className="checklist-header">
                              <span className="checklist-num">{sticker}</span>
                            </div>
                            {sData?.name && <span className="checklist-name">{sData.name}</span>}
                            <div className="checklist-status">
                              <div className="status-dot" style={{ backgroundColor: statusColor }}></div>
                              <span className="status-text" style={{ color: statusTextCol }}>{statusText}</span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT PANEL */}
          <aside className="right-panel">
            <div className="panel-card panel-card-brand">
              <div className="panel-header">
                <h3 className="panel-title">Intercambios</h3>
                <span className="panel-badge">7 nuevos</span>
              </div>
              <p className="panel-text">Hay personas cerca que pueden tener tus faltantes.</p>
              <button
                onClick={() => navigate('/matches')}
                className="panel-btn"
              >
                Ver intercambios
              </button>
            </div>

            <div className="panel-card panel-card-dark">
              <h3 className="panel-title">Navegación rápida</h3>
              <div className="nav-links">
                {[
                  { label: 'Ver faltantes', value: missingCount, colorClass: 'text-red', tab: 'missing' },
                  { label: 'Ver repetidas', value: duplicateCount, colorClass: 'text-emerald', tab: 'duplicates' },
                  { label: 'Especiales M', value: 'M1+', colorClass: 'text-slate', tab: 'special_m' },
                ].map((item) => (
                  <button
                    key={item.tab}
                    onClick={() => setActiveTab(item.tab)}
                    className="nav-link-btn"
                  >
                    <span className="nav-link-label">{item.label}</span>
                    <span className={`nav-link-val ${item.colorClass}`}>{item.value}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="panel-card panel-card-dark">
              <h3 className="panel-title">Consejo</h3>
              <p className="panel-text">
                Marcá primero tus faltantes. Después cargá repetidas para que FigusUY encuentre
                mejores intercambios.
              </p>
            </div>
          </aside>
        </div>
      </section>

      {/* MOBILE NAV */}
      <nav className="mobile-nav">
        <button className="text-brand">📚<br/>Álbumes</button>
        <button onClick={() => navigate('/matches')}>🔄<br/>Cruces</button>
        <button>💬<br/>Chats</button>
        <button>👤<br/>Perfil</button>
      </nav>
    </div>
  )
}
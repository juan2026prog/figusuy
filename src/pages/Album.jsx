// src/pages/AlbumPage.jsx
import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useAppStore } from '../stores/appStore'
import { useToast } from '../components/Toast'
import { supabase } from '../lib/supabase'
import { ALBUM_PROGRESS_STATES, getPartnerStoreAlbumState, markAlbumCompleted, subscribePartnerStoreStorage } from '../lib/partnerStore'
import { getUserLocation } from '../utils/location'

export default function AlbumPage() {
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const {
    albums = [],
    selectedAlbum,
    fetchAlbums,
    fetchUserAlbums,
    selectAlbum,
    userAlbums = [],
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
          let val = data.value
          if (typeof val === 'string') val = val.replace(/"/g, '').toLowerCase()
          const isEnabled = val === true || val === 'true'
          setChecklistImagesEnabled(isEnabled)
        }
      })
  }, [])

  const [searchFilter, setSearchFilter] = useState('')
  const [activeTab, setActiveTab] = useState('base')
  const [showBulk, setShowBulk] = useState(false)
  const [bulkInput, setBulkInput] = useState('')
  const [showCompletionConfirm, setShowCompletionConfirm] = useState(false)
  const [showCompletionCelebration, setShowCompletionCelebration] = useState(false)
  const [completionPromptDismissed, setCompletionPromptDismissed] = useState(false)
  const [showPartnerStoreSelector, setShowPartnerStoreSelector] = useState(false)
  const [partnerStores, setPartnerStores] = useState([])
  const [loadingPartnerStores, setLoadingPartnerStores] = useState(false)
  const [userCoords, setUserCoords] = useState(null)
  
  const [partnerStoreStateTick, setPartnerStoreStateTick] = useState(0)

  useEffect(() => subscribePartnerStoreStorage(() => setPartnerStoreStateTick(prev => prev + 1)), [])

  useEffect(() => {
    fetchAlbums()
    if (profile?.id) {
      fetchUserAlbums(profile.id)
    }
  }, [profile?.id, fetchAlbums, fetchUserAlbums])

  const total = selectedAlbum?.total_stickers || 980

  const albumStickers = useAppStore(state => state.albumStickers)

  const specialGroups = useMemo(() => {
    if (!selectedAlbum?.special_codes) return {}
    
    const config = selectedAlbum.special_codes
    const grouped = {}

    if (Array.isArray(config)) {
      config.forEach(code => {
        const prefix = String(code).replace(/[0-9]/g, '').toUpperCase() || 'EXTRA'
        if (!grouped[prefix]) grouped[prefix] = []
        grouped[prefix].push(String(code))
      })
    } else if (typeof config === 'object') {
      const prefixes = Object.keys(config)
      
      prefixes.forEach(prefix => {
        const groupConfig = config[prefix]
        const sequence = typeof groupConfig === 'object' ? groupConfig.sequence : ''
        
        if (sequence) {
          let codes = []
          const numericRange = sequence.match(/^(\d+)-(\d+)$/)
          const alphaRange = sequence.match(/^([A-Z])-([A-Z])$/i)
          
          if (numericRange) {
            const start = parseInt(numericRange[1])
            const end = parseInt(numericRange[2])
            for (let i = start; i <= end; i++) codes.push(`${prefix}${i}`)
          } else if (alphaRange) {
            const start = alphaRange[1].toUpperCase().charCodeAt(0)
            const end = alphaRange[2].toUpperCase().charCodeAt(0)
            for (let i = start; i <= end; i++) codes.push(`${prefix}${String.fromCharCode(i)}`)
          } else {
            codes = sequence.split(',').map(s => `${prefix}${s.trim()}`)
          }
          grouped[prefix] = codes
        } else {
          // Scan stickers for prefix
          albumStickers.forEach(s => {
            const num = String(s.sticker_number)
            if (num.startsWith(prefix)) {
              if (!grouped[prefix]) grouped[prefix] = []
              grouped[prefix].push(num)
            }
          })
        }
      })
    }
    
    return grouped
  }, [selectedAlbum?.special_codes, albumStickers])

  const tabs = useMemo(() => {
    const baseTabs = [
      { key: 'base', label: `Base 1-${total}` }
    ]
    
    const config = selectedAlbum?.special_codes || {}
    const isMapping = !Array.isArray(config) && typeof config === 'object'

    // Add dynamic special tabs based on config keys
    const prefixes = isMapping ? Object.keys(config) : (Array.isArray(config) ? config : [])
    
    prefixes.forEach(prefix => {
      const groupConfig = config[prefix]
      let label = typeof groupConfig === 'object' ? groupConfig.label : groupConfig
      
      // Fallback labels if no mapping provided
      if (!label) {
        if (prefix === 'P' || prefix === 'PROMO') label = 'Promos'
        else if (prefix === 'F') label = 'Extra F'
        else if (prefix === 'M') label = 'Especiales M'
        else if (prefix === 'LE' || prefix === 'LEGEND') label = 'Leyendas'
        else if (prefix === 'EXTRA') label = 'Especiales'
        else label = `Especiales ${prefix}`
      }
      
      baseTabs.push({ key: `special_${prefix}`, label })
    })

    baseTabs.push({ key: 'missing', label: 'Faltantes' })
    baseTabs.push({ key: 'duplicates', label: 'Repetidas' })

    return baseTabs
  }, [total, specialGroups, selectedAlbum?.special_codes])

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
  const currentUserAlbum = useMemo(
    () => userAlbums.find(item => item.album_id === selectedAlbum?.id) || null,
    [userAlbums, selectedAlbum?.id]
  )
  const legendState = useMemo(
    () => getPartnerStoreAlbumState(profile?.id, selectedAlbum?.id),
    [profile?.id, selectedAlbum?.id, partnerStoreStateTick]
  )
  const albumProgressState = legendState.status || ALBUM_PROGRESS_STATES.IN_PROGRESS
  const isAlbumLocked = albumProgressState !== ALBUM_PROGRESS_STATES.IN_PROGRESS
  const isAlbumCompleted = albumProgressState === ALBUM_PROGRESS_STATES.COMPLETED
  const isAlbumPartnerVerified = albumProgressState === ALBUM_PROGRESS_STATES.PARTNER_VERIFIED

  const albumStickersMap = useMemo(() => {
    const map = {}
    albumStickers?.forEach(s => {
      map[String(s.sticker_number)] = s
    })
    return map
  }, [albumStickers])

  const numbers = useMemo(() => {
    let result = []

    if (activeTab === 'base') {
      result = Array.from({ length: total }, (_, i) => String(i + 1))
    } else if (activeTab === 'missing') {
      result = Array.from(missingSet)
    } else if (activeTab === 'duplicates') {
      result = Array.from(duplicateSet)
    } else if (activeTab.startsWith('special_')) {
      const prefix = activeTab.replace('special_', '')
      result = specialGroups[prefix] || []
    }

    if (!searchFilter.trim()) return result

    const query = searchFilter.trim().toLowerCase()
    return result.filter((n) => {
      if (n.toLowerCase().includes(query)) return true
      const sData = albumStickersMap[n]
      if (sData?.name?.toLowerCase().includes(query)) return true
      if (sData?.team?.toLowerCase().includes(query)) return true
      return false
    })
  }, [activeTab, total, missingSet, duplicateSet, searchFilter, specialGroups, albumStickersMap])

  useEffect(() => {
    if (ownedCount < total && completionPromptDismissed) {
      setCompletionPromptDismissed(false)
    }
    if (!selectedAlbum?.id || !profile?.id) return
    if (ownedCount < total || total <= 0) return
    if (albumProgressState !== ALBUM_PROGRESS_STATES.IN_PROGRESS) return
    if (completionPromptDismissed) return
    if (showCompletionConfirm || showCompletionCelebration) return
    setShowCompletionConfirm(true)
  }, [
    completionPromptDismissed,
    albumProgressState,
    ownedCount,
    profile?.id,
    selectedAlbum?.id,
    showCompletionCelebration,
    showCompletionConfirm,
    total
  ])

  const handleToggle = async (num) => {
    if (!profile?.id || !selectedAlbum?.id) return
    if (isAlbumLocked) {
      toast.error('Este album ya esta cerrado. Solo puedes revisarlo o validarlo en una Tienda PartnerStore.')
      return
    }

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
    if (isAlbumLocked) {
      toast.error('Este album ya esta cerrado. No puedes modificarlo.')
      return
    }

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

  const handleConfirmAlbumCompletion = () => {
    markAlbumCompleted({
      userId: profile.id,
      userName: profile.name || 'Coleccionista FigusUY',
      albumId: selectedAlbum.id,
      albumName: selectedAlbum.name,
      albumCover: selectedAlbum.cover_url || selectedAlbum.images?.[0] || null,
      albumYear: selectedAlbum.year || null
    })
    setCompletionPromptDismissed(false)
    setPartnerStoreStateTick(prev => prev + 1)
    setShowCompletionConfirm(false)
    setShowCompletionCelebration(true)
  }

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  const handleOpenPartnerStoreSelector = async () => {
    setShowCompletionCelebration(false)
    setShowPartnerStoreSelector(true)
    setLoadingPartnerStores(true)

    let coords = userCoords
    if (!coords && profile?.lat) {
       coords = { lat: profile.lat, lng: profile.lng }
       setUserCoords(coords)
    }

    if (!coords) {
       try {
         coords = await getUserLocation(5000)
         setUserCoords(coords)
       } catch (err) {
         console.log('Location not available', err)
       }
    }

    const { data } = await supabase
      .from('locations')
      .select('*')
      .eq('is_active', true)
      .eq('business_plan', 'legend')

    if (data) {
       const stores = data.map(store => {
         let dist = Infinity
         if (coords && store.lat && store.lng) {
            dist = calculateDistance(coords.lat, coords.lng, store.lat, store.lng)
         }
         return { ...store, _distance: dist }
       }).sort((a, b) => a._distance - b._distance)
       setPartnerStores(stores)
    }
    setLoadingPartnerStores(false)
  }

  if (!selectedAlbum) {
    return (
      <div className="album-page-root">
        <style>{`
          .album-page-root {
            background-color: var(--color-bg);
            min-height: 100vh;
            color: var(--color-text); }
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
            background-color: var(--color-surface);
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 2.25rem;
            margin-bottom: 1.5rem;
          }
          .no-album-title { font-size: 1.875rem; font-weight: 900; margin: 0 0 0.5rem; }
          .no-album-desc { color: var(--color-text-secondary); margin-bottom: 2rem; }
          .album-list { display: grid; gap: 0.75rem; width: 100%; max-width: 28rem; }
          .album-item-btn {
            display: flex;
            align-items: center;
            gap: 1rem;
            padding: 1rem;
            border-radius: 4px;
            background-color: var(--color-surface);
            border: 1px solid var(--color-border-light);
            transition: all 0.2s;
            text-align: left;
            cursor: pointer;
          }
          .album-item-btn:hover { border-color: var(--color-primary); }
          .album-item-icon {
            aspect-ratio: 3/4;
            width: 4rem;
            background-color: var(--color-primary);
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
            overflow: hidden;
            flex-shrink: 0;
          }
          .album-item-icon img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          .album-item-name { font-weight: 900; margin: 0; color: var(--color-text); font-size: 1rem; }
          .album-item-meta { font-size: 0.75rem; color: var(--color-text-muted); margin: 0; }
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
          background-color: var(--color-bg);
          min-height: 100vh;
          color: var(--color-text);
          padding: 24px;
          max-width: 1480px;
          margin: auto;
          font-family: 'Barlow', system-ui, sans-serif;
        }

        /* ALBUM HEADER CARD */
        .album-header-section {
          border: 1px solid var(--color-border);
          background: var(--color-surface);
          margin-bottom: 18px;
        }
        .album-header-card {
          display: grid;
          grid-template-columns: 120px 1fr;
          gap: 22px;
          padding: 24px;
        }
        .album-cover {
          aspect-ratio: 3/4;
          border: 1px solid var(--color-border-light);
          background: linear-gradient(180deg, var(--color-surface-hover), var(--color-bg));
          display: grid;
          place-items: center;
          text-align: center;
          min-height: 140px;
          border-radius: 2px;
          overflow: hidden;
        }
        .album-cover b {
          font: italic 900 2.8rem 'Barlow Condensed', sans-serif;
          color: var(--color-primary);
        }
        .album-cover span {
          font: 800 .55rem 'Barlow Condensed', sans-serif;
          letter-spacing: .12em;
          text-transform: uppercase;
          color: var(--color-text-muted);
        }
        .album-header-info {
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .album-kicker {
          font: 800 .72rem 'Barlow Condensed', sans-serif;
          letter-spacing: .16em;
          text-transform: uppercase;
          color: var(--color-primary);
          margin-bottom: 4px;
        }
        .album-header-title {
          font: italic 900 clamp(1.8rem, 4vw, 2.3rem) 'Barlow Condensed', sans-serif;
          line-height: .95;
          text-transform: uppercase;
          margin: 0;
        }
        .album-header-subtitle {
          color: var(--color-text-secondary);
          font-size: .9rem;
          margin-top: 4px;
        }

        .album-header-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1px;
          background: var(--color-border);
          margin-top: 18px;
        }
        .album-header-stat {
          background: var(--color-surface);
          padding: 16px;
          text-align: center;
        }
        .album-header-stat b {
          display: block;
          font: italic 900 2.2rem 'Barlow Condensed', sans-serif;
          color: var(--color-text);
          line-height: 1;
        }
        .album-header-stat span {
          font-size: .72rem;
          text-transform: uppercase;
          color: var(--color-text-muted);
          font-weight: 700;
        }
        .album-header-stat.primary b { color: var(--color-primary); }
        .album-header-stat.success b { color: var(--color-success); }
        .album-header-stat.danger b { color: var(--color-danger); }

        .progress-container {
          padding: 18px 20px;
          border-top: 1px solid var(--color-border);
        }
        .progress-info {
          display: flex;
          justify-content: space-between;
          font: 800 .9rem 'Barlow Condensed', sans-serif;
          text-transform: uppercase;
          letter-spacing: .05em;
          margin-bottom: 8px;
        }
        .progress-bar {
          height: 18px;
          border: 1px solid var(--color-border-light);
          background: var(--color-bg);
          position: relative;
          overflow: hidden;
        }
        .progress-fill {
          height: 100%;
          background: var(--color-primary);
          transition: width 0.3s ease;
        }

        /* HYBRID CONVERSION LAYOUT */
        .hybrid-layout {
          display: grid;
          grid-template-columns: 1fr 300px;
          gap: 18px;
        }
        @media (max-width: 1024px) {
          .hybrid-layout { grid-template-columns: 1fr; }
        }

        .action-strip {
          border: 1px solid var(--color-border);
          background: var(--color-surface);
          display: grid;
          grid-template-columns: 1fr 280px;
          gap: 1px;
          background: var(--color-border);
          margin-bottom: 18px;
        }
        @media (max-width: 768px) {
          .action-strip { grid-template-columns: 1fr; }
        }
        
        .bulk-add-section {
          background: var(--color-surface-hover);
          padding: 16px;
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 10px;
          align-items: end;
        }
        .bulk-add-section input {
          height: 48px;
          background: var(--color-bg);
          border: 1px solid var(--color-border-light);
          padding: 0 14px;
          color: var(--color-text);
          font-weight: 700;
          width: 100%;
        }
        .matches-proof-box {
          background: var(--color-surface-hover);
          padding: 16px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          text-align: center;
        }
        .matches-proof-box b {
          font: italic 900 1.8rem 'Barlow Condensed', sans-serif;
          color: var(--color-primary);
          line-height: .9;
        }
        .matches-proof-box span {
          color: var(--color-text-secondary);
          font-size: .82rem;
          margin-top: 4px;
        }

        /* MODES SELECTOR */
        .modes-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1px;
          background: var(--color-border);
          border: 1px solid var(--color-border);
          margin-bottom: 18px;
        }
        @media (max-width: 640px) {
          .modes-grid { grid-template-columns: repeat(2, 1fr); }
        }
        .mode-card {
          border: 0;
          background: var(--color-surface);
          padding: 14px;
          text-align: left;
          color: var(--color-text);
          cursor: pointer;
          transition: all 0.2s;
        }
        .mode-card small {
          display: block;
          font: 800 .62rem 'Barlow Condensed', sans-serif;
          letter-spacing: .12em;
          text-transform: uppercase;
          color: var(--color-text-muted);
        }
        .mode-card b {
          display: block;
          font: italic 900 1.35rem 'Barlow Condensed', sans-serif;
          text-transform: uppercase;
          line-height:.95;
          margin-top: 6px;
        }
        .mode-card span {
          display: block;
          font-size: .76rem;
          color: var(--color-text-muted);
          margin-top: 6px;
        }
        .mode-card.active { background: var(--color-primary); color: #fff; }
        .mode-card.active b, .mode-card.active small, .mode-card.active span { color: #fff; }
        .mode-card.have b { color: var(--color-text); }
        .mode-card.dup b { color: var(--color-success); }
        .mode-card.miss b { color: var(--color-danger); }
        .mode-card.clear b { color: var(--color-text-secondary); }

        /* MAIN CONTENT AREA */
        .main-content {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          padding: 18px;
        }
        .tabs-header {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: center;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }
        .filter-tabs {
          display: flex;
          gap: 1px;
          background: var(--color-border);
          border: 1px solid var(--color-border);
          overflow-x: auto;
        }
        .filter-tab {
          border: 0;
          background: var(--color-surface);
          color: var(--color-text-muted);
          padding: .7rem 1rem;
          font: 800 .82rem 'Barlow Condensed', sans-serif;
          letter-spacing: .08em;
          text-transform: uppercase;
          white-space: nowrap;
          cursor: pointer;
        }
        .filter-tab.active {
          background: var(--color-primary);
          color: #fff;
        }

        /* STICKERS GRID (VISTA RAPIDA) */
        .stickers-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(64px, 1fr));
          gap: 8px;
          padding: 10px;
          background: var(--color-bg);
          border: 1px solid var(--color-border);
        }
        
        .sticker-cell {
          aspect-ratio: 1/1;
          display: flex;
          justify-content: center;
          align-items: center;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .sticker-cell:hover { border-color: var(--color-primary); transform: translateY(-2px); }
        .sticker-cell b { font: 900 1.4rem 'Barlow Condensed', sans-serif; color: var(--color-text); }
        
        .sticker-cell.have { background: var(--color-primary); border-color: var(--color-primary); }
        .sticker-cell.have b { color: #fff; }
        
        .sticker-cell.dup { background: var(--color-success); border-color: var(--color-success); }
        .sticker-cell.dup b { color: #fff; }
        
        .sticker-cell.miss { background: var(--color-danger); border-color: var(--color-danger); }
        .sticker-cell.miss b { color: #fff; }

        /* CHECKLIST IMAGES VIEW */
        .stickers-checklist {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
        }
        @media (min-width: 640px) { .stickers-checklist { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); } }
        @media (min-width: 1024px) { .stickers-checklist { grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); } }

        .checklist-card {
          background-color: var(--color-surface-hover);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 4px;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          flex-direction: column;
          position: relative;
        }
        .checklist-card:hover { 
          transform: translateY(-4px); 
          border-color: var(--color-primary);
          box-shadow: 0 12px 20px -8px rgba(255,90,0,0.3);
        }
        .checklist-card.owned { border-color: rgba(255,255,255,0.2); }
        .checklist-card.duplicate { border-color: rgba(34,197,94,0.4); }
        .checklist-card.missing { border-color: rgba(239,68,68,0.4); }

        .checklist-img-wrapper {
          aspect-ratio: 3/4;
          width: 100%;
          background-color: var(--color-bg);
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
          transition: transform 0.3s ease;
        }
        .checklist-card:hover .checklist-img {
          transform: scale(1.05);
        }
        
        .checklist-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: var(--color-text-muted);
          gap: 0.5rem;
          background: linear-gradient(135deg, var(--color-surface) 0%, var(--color-bg) 100%);
          width: 100%;
          height: 100%;
        }
        
        .checklist-info {
          padding: 0.75rem;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          background: var(--color-surface);
        }
        
        .checklist-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .checklist-num {
          font-weight: 900;
          font-size: 1.1rem;
          color: var(--color-primary);
          font-family: 'Barlow Condensed', sans-serif;
        }
        
        .checklist-name {
          font-size: 0.85rem;
          color: var(--color-text); font-weight: 700;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .checklist-status {
          margin-top: 0.25rem;
          display: flex;
          align-items: center;
          gap: 0.375rem;
        }
        
        .status-dot {
          width: 0.375rem;
          height: 0.375rem;
          border-radius: 50%;
        }
        .status-text {
          font-size: 0.625rem;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.02em;
        }
      `}</style>

      {/* ═══ ALBUM HEADER ═══ */}
      <div className="album-header-section">
        <div className="album-header-card">
          <div className="album-cover">
            {(selectedAlbum.cover_url || (selectedAlbum.images && selectedAlbum.images.length > 0)) ? (
              <img src={selectedAlbum.cover_url || selectedAlbum.images[0]} alt={selectedAlbum.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div><b>{selectedAlbum?.year?.toString().slice(-2) || '26'}</b><span>Album</span></div>
            )}
          </div>
          <div className="album-header-info">
            <span className="album-kicker">{selectedAlbum.year} · Álbum principal</span>
            <h1 className="album-header-title">{selectedAlbum.name}</h1>
            <p className="album-header-subtitle">Marcá tus figuritas, repetidas y faltantes desde una sola plantilla.</p>
            <div className="album-header-stats">
              <div className="album-header-stat"><b>{ownedCount}</b><span>Tengo</span></div>
              <div className="album-header-stat success"><b>{duplicateCount}</b><span>Repetidas</span></div>
              <div className="album-header-stat danger"><b>{missingCount}</b><span>Faltantes</span></div>
              <div className="album-header-stat primary"><b>{progressPercent}%</b><span>Completo</span></div>
            </div>
          </div>
        </div>
        <div className="progress-container">
          <div className="progress-info">
            <span>Progreso del álbum</span>
            <span style={{ color: 'var(--color-primary)' }}>{ownedCount} / {total}</span>
          </div>
          <div className="progress-bar"><div className="progress-fill" style={{ width: `${progressPercent}%` }} /></div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
            <span className="biz-chip blue">
              {albumProgressState === ALBUM_PROGRESS_STATES.IN_PROGRESS
                ? 'In progress'
                : albumProgressState === ALBUM_PROGRESS_STATES.PARTNER_VERIFIED
                  ? 'Partner Verified'
                  : 'Completed (sin verificar)'}
            </span>
            {isAlbumLocked && <span className="biz-chip">Edicion bloqueada</span>}
          </div>
        </div>
      </div>

      <div className="hybrid-layout">
        <div>
          {/* ═══ ACTION STRIP ═══ */}
          <div className="action-strip">
            <div className="bulk-add-section">
              <div style={{ width: '100%' }}>
                <span className="album-kicker" style={{ fontSize: '.68rem' }}>Carga rápida</span>
                <input placeholder="Ej: 10, 45, 89, M1..." value={bulkInput} onChange={(e) => setBulkInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleBulkAdd()} />
              </div>
              <button className="btn-orange" style={{ height: 48 }} onClick={handleBulkAdd}>Guardar</button>
            </div>
            <div className="matches-proof-box">
              <b>Cargá tus repetidas</b>
              <span>y encontrá cruces cerca tuyo</span>
            </div>
          </div>

          {/* ═══ MODES ═══ */}
          <div className="modes-grid">
            <button className={`mode-card ${mode === 'have' ? 'active' : 'have'}`} onClick={() => setMode('have')}>
              <small>{mode === 'have' ? 'Modo activo' : 'Modo'}</small><b>✓ Tengo</b><span>Ya la tengo</span>
            </button>
            <button className={`mode-card ${mode === 'duplicate' ? 'active' : 'dup'}`} onClick={() => setMode('duplicate')}>
              <small>{mode === 'duplicate' ? 'Modo activo' : 'Modo'}</small><b>⊕ Repetida</b><span>La puedo cambiar</span>
            </button>
            <button className={`mode-card ${mode === 'missing' ? 'active' : 'miss'}`} onClick={() => setMode('missing')}>
              <small>{mode === 'missing' ? 'Modo activo' : 'Modo'}</small><b>✕ Faltante</b><span>La estoy buscando</span>
            </button>
            <button className={`mode-card ${mode === 'clear' ? 'active' : 'clear'}`} onClick={() => setMode('clear')}>
              <small>{mode === 'clear' ? 'Modo activo' : 'Modo'}</small><b>⌫ Borrar</b><span>Quitar marca</span>
            </button>
          </div>

          {/* ═══ TABS + GRID ═══ */}
          <div className="main-content">
            <div className="tabs-header">
              <div className="filter-tabs">
                {tabs.map(t => (
                  <button key={t.key} className={`filter-tab ${activeTab === t.key ? 'active' : ''}`} onClick={() => setActiveTab(t.key)}>{t.label}</button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '1px', background: 'var(--color-border)', border: '1px solid var(--color-border)' }}>
                  <button onClick={() => setViewMode('numbers')} style={{ padding: '4px 8px', border: 0, background: viewMode === 'numbers' ? 'var(--color-primary)' : 'var(--color-surface)', color: viewMode === 'numbers' ? '#fff' : 'var(--color-text-muted)', fontSize: '.72rem', fontWeight: 800, cursor: 'pointer', fontFamily: "'Barlow Condensed', sans-serif", textTransform: 'uppercase' }}>Rápida</button>
                  {(checklistImagesEnabled || selectedAlbum?.has_detailed_stickers) && (
                    <button onClick={() => setViewMode('checklist')} style={{ padding: '4px 8px', border: 0, background: viewMode === 'checklist' ? 'var(--color-primary)' : 'var(--color-surface)', color: viewMode === 'checklist' ? '#fff' : 'var(--color-text-muted)', fontSize: '.72rem', fontWeight: 800, cursor: 'pointer', fontFamily: "'Barlow Condensed', sans-serif", textTransform: 'uppercase' }}>Checklist</button>
                  )}
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <input style={{ height: 40, fontSize: '.85rem', width: '100%', padding: '0 14px', background: 'var(--color-bg)', border: '1px solid var(--color-border-light)', color: 'var(--color-text)', fontWeight: 700 }} placeholder="Buscar por número, nombre o equipo..." value={searchFilter} onChange={(e) => setSearchFilter(e.target.value)} />
            </div>

            {viewMode === 'numbers' ? (
              <div className="stickers-grid">
                {numbers.map(num => {
                  const status = ownedSet.has(num) ? 'have' : missingSet.has(num) ? 'miss' : duplicateSet.has(num) ? 'dup' : ''
                  return (
                    <button key={num} className={`sticker-cell ${status}`} onClick={() => handleToggle(num)}>
                      <b>{num}</b>
                    </button>
                  )
                })}
              </div>
            ) : (
              <div className="stickers-checklist">
                {numbers.map(num => {
                  const sticker = String(num)
                  const isOwned = ownedSet.has(sticker)
                  const isMissing = missingSet.has(sticker)
                  const isDuplicate = duplicateSet.has(sticker)
                  const sData = albumStickersMap[sticker]

                  let statusColor = 'var(--color-surface-hover)'
                  let statusText = 'Sin marcar'
                  let statusTextCol = 'var(--color-text-muted)'
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
                      <div className="checklist-info">
                        <div className="checklist-header">
                          <span className="checklist-num">{sticker}</span>
                          {sData?.sticker_code && <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--color-text-muted)', letterSpacing: '0.05em' }}>{sData.sticker_code}</span>}
                        </div>
                        {sData?.name && <span className="checklist-name">{sData.name}</span>}
                        {(sData?.team || sData?.country) && <span style={{ fontSize: '0.65rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>{sData.team || sData.country}</span>}
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

        <div className="album-sidebar">
          <div className="sidebar-card">
            <span className="album-kicker">Siguiente mejora</span>
            <h3>Te faltan {missingCount}</h3>
            <p>Marcá tus repetidas y desbloqueá los mejores cruces cerca tuyo.</p>
            {isAlbumCompleted ? (
              <button className="btn-orange" style={{ width: '100%', marginTop: 14 }} onClick={handleOpenPartnerStoreSelector}>Validar en Tienda PartnerStore</button>
            ) : isAlbumPartnerVerified ? (
              <button className="btn-orange" style={{ width: '100%', marginTop: 14 }} onClick={() => navigate('/achievements')}>Ver logro</button>
            ) : (
              <button className="btn-orange" style={{ width: '100%', marginTop: 14 }} onClick={() => navigate('/matches')}>Ver cruces</button>
            )}
          </div>

          <div className="quick-stats-list">
            <div className="qs-item"><span>Más cerca</span><b>--</b></div>
            <div className="qs-item"><span>Cerrás hoy</span><b>--</b></div>
            <div className="qs-item"><span>Mejor score</span><b>--</b></div>
          </div>
        </div>
      </div>

      {showCompletionConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.82)', zIndex: 1200, display: 'grid', placeItems: 'center', padding: '1rem' }}>
          <div style={{ width: '100%', maxWidth: '34rem', border: '1px solid var(--color-border)', background: 'var(--color-surface)', padding: '1.5rem' }}>
            <div className="album-kicker">Confirmar cierre</div>
            <h2 style={{ margin: '.55rem 0 0', font: "italic 900 2.2rem 'Barlow Condensed'", textTransform: 'uppercase', lineHeight: '.9' }}>Seguro que completaste este album?</h2>
            <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6, marginTop: '.8rem' }}>
              Estas por marcar este album como completado. Una vez confirmado, el album se cerrara, no podras modificarlo y luego podras validarlo en una Tienda PartnerStore.
            </p>
            <div style={{ display: 'grid', gap: '.55rem', marginTop: '1rem', color: 'var(--color-text-secondary)', fontSize: '.88rem' }}>
              <span>- El album se cerrara</span>
              <span>- No vas a poder modificarlo</span>
              <span>- Quedara marcado como completado</span>
              <span>- Luego podras validarlo en una Tienda PartnerStore</span>
            </div>
            <div style={{ display: 'flex', gap: '.7rem', marginTop: '1.25rem' }}>
              <button className="btn-orange" onClick={handleConfirmAlbumCompletion}>Confirmar album</button>
              <button className="btn-ghost" onClick={() => { setCompletionPromptDismissed(true); setShowCompletionConfirm(false) }}>Volver</button>
            </div>
          </div>
        </div>
      )}

      {showCompletionCelebration && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.88)', zIndex: 1210, display: 'grid', placeItems: 'center', padding: '1rem' }}>
          <div style={{ width: '100%', maxWidth: '38rem', border: '1px solid rgba(255,90,0,.35)', background: 'linear-gradient(135deg, rgba(255,90,0,.14), rgba(250,204,21,.08)), var(--color-surface)', padding: '1.6rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem' }}>🎉</div>
            <div className="album-kicker" style={{ marginTop: '.4rem' }}>Completion moment</div>
            <h2 style={{ margin: '.55rem 0 0', font: "italic 900 2.6rem 'Barlow Condensed'", textTransform: 'uppercase', lineHeight: '.9' }}>Album completado</h2>
            <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6, marginTop: '.9rem' }}>
              El album quedo cerrado y ahora figura como <strong>Completed (sin verificar)</strong>. Validalo en una Tienda PartnerStore para desbloquear tu badge, rewards y un beneficio exclusivo.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '.7rem', marginTop: '1.2rem' }}>
              <button className="btn-orange" onClick={handleOpenPartnerStoreSelector}>Validar en Tienda PartnerStore</button>
              <button className="btn-ghost" onClick={() => setShowCompletionCelebration(false)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {showPartnerStoreSelector && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.82)', zIndex: 1200, display: 'grid', placeItems: 'center', padding: '1rem' }}>
          <div style={{ width: '100%', maxWidth: '38rem', border: '1px solid var(--color-border)', background: 'var(--color-surface)', display: 'flex', flexDirection: 'column', maxHeight: '85vh' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ font: "italic 900 2.2rem 'Barlow Condensed'", textTransform: 'uppercase', lineHeight: '.9', margin: 0 }}>Tiendas PartnerStore</h2>
                <button className="btn-ghost" style={{ padding: '0.4rem 0.8rem' }} onClick={() => setShowPartnerStoreSelector(false)}>Cerrar</button>
              </div>
              <p style={{ color: 'var(--color-text-secondary)', marginTop: '.5rem', fontSize: '.9rem' }}>Encontrá la tienda más cercana para validar tu álbum y desbloquear beneficios exclusivos.</p>
            </div>
            <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {loadingPartnerStores ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-secondary)' }}>Buscando tiendas cercanas...</div>
              ) : partnerStores.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-secondary)' }}>No hay tiendas PartnerStore disponibles.</div>
              ) : (
                partnerStores.map(store => {
                  const meta = store.metadata || {}
                  const zone = store.neighborhood || meta.zone || meta.neighborhood
                  const locParts = [zone, store.department || meta.city].filter(Boolean)
                  const locationStr = locParts.length > 0 ? locParts.join(' · ') : ''
                  
                  let distStr = null
                  if (store._distance !== Infinity) {
                    distStr = store._distance < 1 ? `${Math.round(store._distance * 1000)} m` : `${store._distance.toFixed(1)} km`
                  }

                  const benefitTitle = meta.partner_benefit_title || '10% OFF en sobres al validar'

                  return (
                    <div key={store.id} style={{ padding: '1.2rem', border: '1px solid var(--color-border)', background: 'rgba(255,255,255,0.03)', position: 'relative', overflow: 'hidden' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <h3 style={{ font: "italic 900 1.6rem 'Barlow Condensed'", textTransform: 'uppercase', lineHeight: '1', margin: '0 0 .3rem' }}>{store.name}</h3>
                          <div style={{ fontSize: '.85rem', color: 'var(--color-text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {locationStr}
                            {distStr && <span style={{ color: 'var(--orange)' }}>· {distStr}</span>}
                          </div>
                        </div>
                      </div>
                      
                      <div style={{ fontSize: '.85rem', color: 'var(--color-text-secondary)', marginTop: '.6rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>location_on</span> {store.address || 'Dirección no disponible'}
                      </div>
                      
                      {meta.hours && (
                        <div style={{ fontSize: '.85rem', color: 'var(--color-text-secondary)', marginTop: '.3rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>schedule</span> {meta.hours}
                        </div>
                      )}

                      <div style={{ marginTop: '1rem', background: 'linear-gradient(135deg, rgba(255,90,0,.15), rgba(250,204,21,.1))', border: '1px solid rgba(255,90,0,.3)', padding: '.75rem', display: 'flex', alignItems: 'center', gap: '.5rem', borderRadius: '2px' }}>
                        <span style={{ fontSize: '1.2rem' }}>🎁</span>
                        <div>
                          <div style={{ font: "900 .8rem 'Barlow Condensed'", letterSpacing: '.05em', textTransform: 'uppercase', color: 'var(--orange)' }}>Beneficio PartnerStore visible</div>
                          <div style={{ fontSize: '.85rem', fontWeight: 600 }}>{benefitTitle}</div>
                        </div>
                      </div>

                      <button 
                        className="btn-orange" 
                        style={{ width: '100%', marginTop: '1rem', padding: '.65rem' }}
                        onClick={() => navigate('/stores')}
                      >
                        Ver en el mapa
                      </button>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

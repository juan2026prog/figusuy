import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ConfirmDialog from '../components/ConfirmDialog'
import { LiveBadge, LiveFeed } from '../components/LiveMomentum'
import { formatRelativeTime } from '../lib/liveMomentum'
import { useToast } from '../components/Toast'
import { useLiveMomentum } from '../hooks/useLiveMomentum'
import { supabase } from '../lib/supabase'
import { ALBUM_PROGRESS_STATES, getPartnerStoreAlbumState, markAlbumCompleted } from '../lib/partnerStore'
import { useAuthStore } from '../stores/authStore'
import { useAppStore } from '../stores/appStore'
import { getUserLocation } from '../utils/location'

const POKEMON_TOOLTIP_STYLES = `
  .pokemon-tooltip {
    position: fixed;
    z-index: 10000;
    background: #0d0d0d;
    border: 1px solid rgba(249, 115, 22, 0.3);
    border-radius: 12px;
    padding: 12px 16px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.8), 0 0 15px rgba(249, 115, 22, 0.1);
    pointer-events: none;
    min-width: 180px;
    max-width: 280px;
    animation: tooltip-fade 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    transform-origin: bottom center;
  }
  @keyframes tooltip-fade {
    from { opacity: 0; transform: translateY(8px) scale(0.95); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
  .pokemon-tooltip-name {
    color: #fff;
    font-size: 1rem;
    font-weight: 800;
    display: block;
    margin-bottom: 4px;
    letter-spacing: -0.01em;
  }
  .pokemon-tooltip-rarity {
    color: var(--color-primary);
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .pokemon-tooltip-rarity::before {
    content: '';
    width: 6px;
    height: 6px;
    background: var(--color-primary);
    border-radius: 50%;
    box-shadow: 0 0 8px var(--color-primary);
  }
  .checklist-num {
    cursor: pointer;
    transition: all 0.2s;
  }
  .checklist-num:hover {
    color: var(--color-primary);
    text-shadow: 0 0 8px rgba(249, 115, 22, 0.5);
  }
`;

const MODE_META = {
  have: { icon: 'check_circle', eyebrow: 'Modo activo', title: 'Tengo', description: 'Marca figuritas que ya estan en tu album.' },
  duplicate: { icon: 'sync_alt', eyebrow: 'Modo activo', title: 'Repetida', description: 'Marca figuritas listas para intercambio.' },
  missing: { icon: 'radio_button_unchecked', eyebrow: 'Modo activo', title: 'Faltante', description: 'Marca las que todavia estas buscando.' },
  clear: { icon: 'ink_eraser', eyebrow: 'Modo activo', title: 'Borrar', description: 'Quita una marca sin cambiar de pantalla.' },
}

const STATUS_META = {
  [ALBUM_PROGRESS_STATES.IN_PROGRESS]: { label: 'En progreso', detail: 'Tu album sigue abierto para edicion y cruces.', tone: 'blue' },
  [ALBUM_PROGRESS_STATES.COMPLETED]: { label: 'Pendiente de revisión', detail: 'Álbum completado. Pendiente de validación en Collector Hub.', tone: 'orange' },
  [ALBUM_PROGRESS_STATES.PARTNER_VERIFIED]: { label: 'Oficialmente Validado', detail: 'Ya quedo validado con recompensa activada.', tone: 'green' },
}

const compareNatural = (a, b) => {
  if (typeof a !== 'string' || typeof b !== 'string') return 0
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
}

export default function AlbumPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const { profile, loading: authLoading } = useAuthStore()
  
  // Granular selectors for performance and reliability in Zustand v5
  const albums = useAppStore(state => state.albums)
  const selectedAlbum = useAppStore(state => state.selectedAlbum)
  const fetchAlbums = useAppStore(state => state.fetchAlbums)
  const fetchUserAlbums = useAppStore(state => state.fetchUserAlbums)
  const selectAlbum = useAppStore(state => state.selectAlbum)
  const userAlbums = useAppStore(state => state.userAlbums)
  const ownedStickers = useAppStore(state => state.ownedStickers)
  const missingStickers = useAppStore(state => state.missingStickers)
  const duplicateStickers = useAppStore(state => state.duplicateStickers)
  const addOwnedSticker = useAppStore(state => state.addOwnedSticker)
  const addMissingSticker = useAppStore(state => state.addMissingSticker)
  const addDuplicateSticker = useAppStore(state => state.addDuplicateSticker)
  const decrementDuplicateSticker = useAppStore(state => state.decrementDuplicateSticker)
  const removeStickerStatus = useAppStore(state => state.removeStickerStatus)
  const bulkAddStickers = useAppStore(state => state.bulkAddStickers)
  const matches = useAppStore(state => state.matches)
  const albumStickers = useAppStore(state => state.albumStickers)
  const storeLoading = useAppStore(state => state.loading)

  const [mode, setMode] = useState('have')
  const [viewMode, setViewMode] = useState('numbers')
  const [checklistImagesEnabled, setChecklistImagesEnabled] = useState(true)
  const [isMobileGrid, setIsMobileGrid] = useState(() => typeof window !== 'undefined' ? window.innerWidth <= 640 : false)
  const [mobileGridPage, setMobileGridPage] = useState(0)
  const [searchFilter, setSearchFilter] = useState('')
  const [activeTab, setActiveTab] = useState('base')
  const [bulkInput, setBulkInput] = useState('')
  const [showCompletionConfirm, setShowCompletionConfirm] = useState(false)
  const [showCompletionCelebration, setShowCompletionCelebration] = useState(false)
  const [completionPromptDismissed, setCompletionPromptDismissed] = useState(false)
  const [showPartnerStoreSelector, setShowPartnerStoreSelector] = useState(false)
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false)
  const [partnerStores, setPartnerStores] = useState([])
  const [loadingPartnerStores, setLoadingPartnerStores] = useState(false)
  const [userCoords, setUserCoords] = useState(null)
  const [legendState, setLegendState] = useState({ status: ALBUM_PROGRESS_STATES.IN_PROGRESS })
  const [partnerStoreStateTick, setPartnerStoreStateTick] = useState(0)
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false)
  const [pokemonTooltip, setPokemonTooltip] = useState(null)

  // Inject tooltip styles
  useEffect(() => {
    const styleId = 'pokemon-tooltip-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.innerHTML = POKEMON_TOOLTIP_STYLES;
      document.head.appendChild(style);
    }
  }, [])

  // Click outside listener for custom dropdown
  useEffect(() => {
    if (!isSwitcherOpen) return
    const handleClickOutside = () => setIsSwitcherOpen(false)
    window.addEventListener('click', handleClickOutside)
    return () => window.removeEventListener('click', handleClickOutside)
  }, [isSwitcherOpen])

  useEffect(() => {
    supabase.from('app_settings').select('value').eq('key', 'checklist_images_enabled').single().then(({ data }) => {
      if (!data) return
      let value = data.value
      if (typeof value === 'string') value = value.replace(/"/g, '').toLowerCase()
      setChecklistImagesEnabled(value === true || value === 'true')
    })
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return undefined
    const mediaQuery = window.matchMedia('(max-width: 640px)')
    const applyMatch = (event) => setIsMobileGrid(event.matches)
    setIsMobileGrid(mediaQuery.matches)
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', applyMatch)
      return () => mediaQuery.removeEventListener('change', applyMatch)
    }
    mediaQuery.addListener(applyMatch)
    return () => mediaQuery.removeListener(applyMatch)
  }, [])

  const [isInitializing, setIsInitializing] = useState(true)

  useEffect(() => {
    const init = async () => {
      try {
        const promises = [fetchAlbums()]
        if (profile?.id) promises.push(fetchUserAlbums(profile.id))
        await Promise.all(promises)
      } catch (err) {
        console.error('Error initializing album page:', err)
      } finally {
        setIsInitializing(false)
      }
    }
    init()
  }, [profile?.id, fetchAlbums, fetchUserAlbums])

  // Safety auto-selection if only one album exists and none selected
  useEffect(() => {
    if (!isInitializing && !selectedAlbum && albums.length > 0) {
      // If user already has an active album in progress, it will be auto-selected by fetchUserAlbums
      // But if they don't, we stay in the picker so they can choose.
    }
  }, [isInitializing, selectedAlbum, albums.length])

  const total = useMemo(() => {
    if (selectedAlbum?.name === "Panini´s FIFA World Cup 2026") return 1134
    return selectedAlbum?.total_stickers || 980
  }, [selectedAlbum])

  const specialGroups = useMemo(() => {
    if (!selectedAlbum?.special_codes) return {}
    const config = selectedAlbum.special_codes
    const grouped = {}

    if (Array.isArray(config)) {
      config.forEach((code) => {
        const prefix = String(code).replace(/[0-9]/g, '').toUpperCase() || 'EXTRA'
        if (!grouped[prefix]) grouped[prefix] = []
        grouped[prefix].push(String(code))
      })
      Object.keys(grouped).forEach((prefix) => {
        grouped[prefix].sort(compareNatural)
      })
      return grouped
    }

    if (typeof config === 'object') {
      Object.keys(config).forEach((prefix) => {
        const groupConfig = config[prefix]
        const sequence = typeof groupConfig === 'object' ? groupConfig.sequence : ''

        if (sequence) {
          let codes = []
          const numericRange = sequence.match(/^(\d+)-(\d+)$/)
          const alphaRange = sequence.match(/^([A-Z])-([A-Z])$/i)
          if (numericRange) {
            const start = parseInt(numericRange[1], 10)
            const end = parseInt(numericRange[2], 10)
            for (let i = start; i <= end; i += 1) codes.push(`${prefix}${i}`)
          } else if (alphaRange) {
            const start = alphaRange[1].toUpperCase().charCodeAt(0)
            const end = alphaRange[2].toUpperCase().charCodeAt(0)
            for (let i = start; i <= end; i += 1) codes.push(`${prefix}${String.fromCharCode(i)}`)
          } else {
            codes = sequence.split(',').map((item) => `${prefix}${item.trim()}`)
          }
          grouped[prefix] = codes
          return
        }

        albumStickers.forEach((sticker) => {
          const num = String(sticker.sticker_number)
          if (!num.startsWith(prefix)) return
          if (!grouped[prefix]) grouped[prefix] = []
          grouped[prefix].push(num)
        })
        if (grouped[prefix]) {
          grouped[prefix].sort(compareNatural)
        }
      })
    }

    return grouped
  }, [selectedAlbum?.special_codes, albumStickers])

  const tabs = useMemo(() => {
    const baseTabs = [{ key: 'base', label: `Base 1-${total}` }]
    const config = selectedAlbum?.special_codes || {}
    const prefixes = !Array.isArray(config) && typeof config === 'object' ? Object.keys(config) : []

    prefixes.forEach((prefix) => {
      const groupConfig = config[prefix]
      let label = typeof groupConfig === 'object' ? groupConfig.label : groupConfig
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
  }, [selectedAlbum?.special_codes, total])

  const ownedSet = useMemo(() => new Set(ownedStickers.map((item) => String(item.sticker_number))), [ownedStickers])
  const missingSet = useMemo(() => new Set(missingStickers.map((item) => String(item.sticker_number))), [missingStickers])
  const duplicateSet = useMemo(() => new Set(duplicateStickers.map((item) => String(item.sticker_number))), [duplicateStickers])

  const ownedCount = ownedStickers.length
  const missingCount = missingStickers.length
  const duplicateCount = useMemo(() => duplicateStickers.reduce((acc, curr) => acc + (curr.quantity || 1), 0), [duplicateStickers])
  const progressPercent = total > 0 ? Math.round((ownedCount / total) * 100) : 0
  const emptyCount = Math.max(total - ownedCount - missingCount - duplicateCount, 0)

  const { summary, feed, nearMatchesCount, mutualMatchesCount } = useLiveMomentum({
    matches,
    missingCount,
    duplicateCount,
  })

  const [liveActivities, setLiveActivities] = useState([])
  const [loadingActivities, setLoadingActivities] = useState(true)

  const getSafeName = (profile) => {
    if (!profile) return 'Un coleccionista'
    const name = profile.username || profile.name || ''
    if (!name) return 'Un coleccionista'
    const firstSpace = name.indexOf(' ')
    if (firstSpace > 0) {
      return name.substring(0, firstSpace)
    }
    return name
  }

  useEffect(() => {
    let active = true
    const fetchActivities = async () => {
      try {
        const { data: recentAlbums } = await supabase
          .from('user_albums')
          .select(`
            id,
            created_at,
            progress_state,
            album:albums(name),
            profile:profiles(name, username)
          `)
          .order('created_at', { ascending: false })
          .limit(3)

        const { data: recentDuplicates } = await supabase
          .from('stickers_duplicate')
          .select(`
            id,
            created_at,
            album:albums(name),
            profile:profiles(name, username)
          `)
          .order('created_at', { ascending: false })
          .limit(3)

        const { data: recentLocations } = await supabase
          .from('locations')
          .select('id, name, neighborhood, department, created_at')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(3)

        if (!active) return

        const list = []

        if (recentAlbums) {
          recentAlbums.forEach(item => {
            const userName = getSafeName(item.profile)
            if (item.progress_state === 'completed' || item.progress_state === 'legend_verified') {
              list.push({
                id: `album-comp-${item.id}`,
                date: new Date(item.created_at),
                title: `${userName.toUpperCase()} COMPLETÓ SU ÁLBUM`,
                desc: `Cerró la colección de ${item.album?.name || 'su álbum'}`,
              })
            } else {
              list.push({
                id: `album-join-${item.id}`,
                date: new Date(item.created_at),
                title: `${userName.toUpperCase()} EMPEZÓ A CAMBIAR`,
                desc: `Activó la colección de ${item.album?.name || 'su álbum'}`,
              })
            }
          })
        }

        if (recentDuplicates) {
          recentDuplicates.forEach(item => {
            const userName = getSafeName(item.profile)
            list.push({
              id: `dup-${item.id}`,
              date: new Date(item.created_at),
              title: `${userName.toUpperCase()} CARGÓ REPETIDAS`,
              desc: `Abrió nuevas oportunidades de cambio en ${item.album?.name || 'su álbum'}`,
            })
          })
        }

        if (recentLocations) {
          recentLocations.forEach(item => {
            list.push({
              id: `loc-${item.id}`,
              date: new Date(item.created_at),
              title: `NUEVO PUNTO ACTIVO`,
              desc: `Se activó un punto de encuentro: ${item.name} en ${item.neighborhood || item.department || 'Uruguay'}`,
            })
          })
        }

        const sorted = list
          .sort((a, b) => b.date - a.date)
          .slice(0, 3)

        setLiveActivities(sorted)
      } catch (err) {
        console.error('Error fetching live activities:', err)
      } finally {
        if (active) setLoadingActivities(false)
      }
    }

    fetchActivities()
    const timer = setInterval(fetchActivities, 60000)
    return () => {
      active = false
      clearInterval(timer)
    }
  }, [])

  const currentUserAlbum = useMemo(
    () => userAlbums.find((item) => item.album_id === selectedAlbum?.id) || null,
    [userAlbums, selectedAlbum?.id]
  )

  useEffect(() => {
    let cancelled = false
    const loadLegendState = async () => {
      if (!profile?.id || !selectedAlbum?.id) {
        if (!cancelled) setLegendState({ status: ALBUM_PROGRESS_STATES.IN_PROGRESS })
        return
      }
      const state = await getPartnerStoreAlbumState(profile.id, selectedAlbum.id)
      if (!cancelled) setLegendState(state || { status: ALBUM_PROGRESS_STATES.IN_PROGRESS })
    }
    loadLegendState()
    return () => {
      cancelled = true
    }
  }, [profile?.id, selectedAlbum?.id, partnerStoreStateTick])

  const albumProgressState = legendState.status || ALBUM_PROGRESS_STATES.IN_PROGRESS
  const isAlbumLocked = albumProgressState !== ALBUM_PROGRESS_STATES.IN_PROGRESS
  const isAlbumCompleted = albumProgressState === ALBUM_PROGRESS_STATES.COMPLETED
  const isAlbumPartnerVerified = albumProgressState === ALBUM_PROGRESS_STATES.PARTNER_VERIFIED
  const statusMeta = STATUS_META[albumProgressState] || STATUS_META[ALBUM_PROGRESS_STATES.IN_PROGRESS]

  const albumStickersMap = useMemo(() => {
    const map = {}
    albumStickers?.forEach((sticker) => {
      map[String(sticker.sticker_number)] = sticker
    })
    return map
  }, [albumStickers])

  const entireCanonicalStructure = useMemo(() => {
    if (!selectedAlbum) return []
    let result = []
    const isPaniniWC2026 = selectedAlbum.name === "Panini´s FIFA World Cup 2026"

    // 1. Base section
    if (isPaniniWC2026) {
      const flagMap = {
        MEX: { iso: "mx", name: "México" }, RSA: { iso: "za", name: "Sudáfrica" }, KOR: { iso: "kr", name: "Corea del Sur" }, CZE: { iso: "cz", name: "Rep. Checa" },
        CAN: { iso: "ca", name: "Canadá" }, BIH: { iso: "ba", name: "Bosnia" }, QAT: { iso: "qa", name: "Qatar" }, SUI: { iso: "ch", name: "Suiza" },
        BRA: { iso: "br", name: "Brasil" }, MAR: { iso: "ma", name: "Marruecos" }, HAI: { iso: "ht", name: "Haití" }, SCO: { iso: "gb-sct", name: "Escocia" },
        USA: { iso: "us", name: "EE.UU." }, PAR: { iso: "py", name: "Paraguay" }, AUS: { iso: "au", name: "Australia" }, TUR: { iso: "tr", name: "Turquía" },
        GER: { iso: "de", name: "Alemania" }, CUW: { iso: "cw", name: "Curazao" }, CIV: { iso: "ci", name: "C. Marfil" }, ECU: { iso: "ec", name: "Ecuador" },
        NED: { iso: "nl", name: "P. Bajos" }, JPN: { iso: "jp", name: "Japón" }, SWE: { iso: "se", name: "Suecia" }, TUN: { iso: "tn", name: "Túnez" },
        BEL: { iso: "be", name: "Bélgica" }, EGY: { iso: "eg", name: "Egipto" }, IRN: { iso: "ir", name: "Irán" }, NZL: { iso: "nz", name: "N. Zelanda" },
        ESP: { iso: "es", name: "España" }, URU: { iso: "uy", name: "Uruguay" }, KSA: { iso: "sa", name: "Arabia S." }, CPV: { iso: "cv", name: "Cabo Verde" },
        FRA: { iso: "fr", name: "Francia" }, SEN: { iso: "sn", name: "Senegal" }, NOR: { iso: "no", name: "Noruega" }, IRQ: { iso: "iq", name: "Irak" },
        ARG: { iso: "ar", name: "Argentina" }, AUT: { iso: "at", name: "Austria" }, DZA: { iso: "dz", name: "Argelia" }, JOR: { iso: "jo", name: "Jordania" },
        POR: { iso: "pt", name: "Portugal" }, COL: { iso: "co", name: "Colombia" }, COD: { iso: "cd", name: "RD Congo" }, UZB: { iso: "uz", name: "Uzbekistán" },
        ENG: { iso: "gb-eng", name: "Inglaterra" }, CRO: { iso: "hr", name: "Croacia" }, PAN: { iso: "pa", name: "Panamá" }, GHA: { iso: "gh", name: "Ghana" }
      }

      // Correcting the ENG entry
      flagMap.ENG = { iso: "gb-eng", name: "Inglaterra" }

      const groups = [
        { name: "GRUPO A", teams: ["MEX", "RSA", "KOR", "CZE"] },
        { name: "GRUPO B", teams: ["CAN", "BIH", "QAT", "SUI"] },
        { name: "GRUPO C", teams: ["BRA", "MAR", "HAI", "SCO"] },
        { name: "GRUPO D", teams: ["USA", "PAR", "AUS", "TUR"] },
        { name: "GRUPO E", teams: ["GER", "CUW", "CIV", "ECU"] },
        { name: "GRUPO F", teams: ["NED", "JPN", "SWE", "TUN"] },
        { name: "GRUPO G", teams: ["BEL", "EGY", "IRN", "NZL"] },
        { name: "GRUPO H", teams: ["ESP", "URU", "KSA", "CPV"] },
        { name: "GRUPO I", teams: ["FRA", "SEN", "NOR", "IRQ"] },
        { name: "GRUPO J", teams: ["ARG", "AUT", "DZA", "JOR"] },
        { name: "GRUPO K", teams: ["POR", "COL", "COD", "UZB"] },
        { name: "GRUPO L", teams: ["ENG", "CRO", "PAN", "GHA"] }
      ]

      result.push("00")
      for (let i = 1; i <= 8; i++) result.push(`FWC${i}`)
      
      groups.forEach(group => {
        result.push({ 
          type: 'subtitle', 
          label: group.name, 
          flags: group.teams.map(t => flagMap[t]) 
        })
        group.teams.forEach(team => {
          for (let i = 1; i <= 20; i++) result.push(`${team}${i}`)
        })
      })

      for (let i = 9; i <= 19; i++) result.push(`FWC${i}`)
      for (let i = 1; i <= 14; i++) result.push(`CC${i}`)
    } else {
      result = Array.from({ length: total }, (_, index) => String(index + 1))
    }

    // 2. Special sections
    const config = selectedAlbum.special_codes || {}
    const prefixes = !Array.isArray(config) && typeof config === 'object' ? Object.keys(config) : []
    prefixes.forEach((prefix) => {
      const groupConfig = config[prefix]
      let label = typeof groupConfig === 'object' ? groupConfig.label : groupConfig
      if (!label) {
        if (prefix === 'P' || prefix === 'PROMO') label = 'Promos'
        else if (prefix === 'F') label = 'Extra F'
        else if (prefix === 'M') label = 'Especiales M'
        else if (prefix === 'LE' || prefix === 'LEGEND') label = 'Leyendas'
        else if (prefix === 'EXTRA') label = 'Especiales'
        else label = `Especiales ${prefix}`
      }
      
      const codes = specialGroups[prefix] || []
      if (codes.length > 0) {
        result.push({
          type: 'subtitle',
          label: label,
          flags: []
        })
        result.push(...codes)
      }
    })

    return result
  }, [selectedAlbum, total, specialGroups])

  const numbers = useMemo(() => {
    if (!selectedAlbum) return []

    // 1. Generate tabAllowedSet
    let tabAllowedSet = new Set()
    
    if (activeTab === 'base') {
      const isPaniniWC2026 = selectedAlbum.name === "Panini´s FIFA World Cup 2026"
      if (isPaniniWC2026) {
        tabAllowedSet.add("00")
        for (let i = 1; i <= 8; i++) tabAllowedSet.add(`FWC${i}`)
        const teams = [
          "MEX", "RSA", "KOR", "CZE", "CAN", "BIH", "QAT", "SUI",
          "BRA", "MAR", "HAI", "SCO", "USA", "PAR", "AUS", "TUR",
          "GER", "CUW", "CIV", "ECU", "NED", "JPN", "SWE", "TUN",
          "BEL", "EGY", "IRN", "NZL", "ESP", "URU", "KSA", "CPV",
          "FRA", "SEN", "NOR", "IRQ", "ARG", "AUT", "DZA", "JOR",
          "POR", "COL", "COD", "UZB", "ENG", "CRO", "PAN", "GHA"
        ]
        teams.forEach(team => {
          for (let i = 1; i <= 20; i++) tabAllowedSet.add(`${team}${i}`)
        })
        for (let i = 9; i <= 19; i++) tabAllowedSet.add(`FWC${i}`)
        for (let i = 1; i <= 14; i++) tabAllowedSet.add(`CC${i}`)
      } else {
        for (let i = 1; i <= total; i++) tabAllowedSet.add(String(i))
      }
    }
    else if (activeTab.startsWith('special_')) {
      const prefix = activeTab.replace('special_', '')
      const codes = specialGroups[prefix] || []
      codes.forEach(c => tabAllowedSet.add(c))
    }
    else if (activeTab === 'missing') {
      tabAllowedSet = missingSet
    }
    else if (activeTab === 'duplicates') {
      tabAllowedSet = duplicateSet
    }

    // 2. Intersect with search filter
    let finalAllowedSet = new Set()
    const query = searchFilter.trim().toLowerCase()
    
    for (const sticker of tabAllowedSet) {
      if (query) {
        const stickerData = albumStickersMap[sticker]
        if (
          sticker.toLowerCase().includes(query) ||
          stickerData?.name?.toLowerCase().includes(query) ||
          stickerData?.team?.toLowerCase().includes(query) ||
          stickerData?.country?.toLowerCase().includes(query)
        ) {
          finalAllowedSet.add(sticker)
        }
      } else {
        finalAllowedSet.add(sticker)
      }
    }

    // 3. Lookahead filter on entireCanonicalStructure using finalAllowedSet
    const filtered = []
    for (let i = 0; i < entireCanonicalStructure.length; i++) {
      const item = entireCanonicalStructure[i]
      if (typeof item === 'object' && item.type === 'subtitle') {
        // Look ahead to check if there is at least one visible sticker in this section
        let hasVisibleStickers = false
        for (let j = i + 1; j < entireCanonicalStructure.length; j++) {
          const nextItem = entireCanonicalStructure[j]
          if (typeof nextItem === 'object' && nextItem.type === 'subtitle') {
            break
          }
          if (finalAllowedSet.has(nextItem)) {
            hasVisibleStickers = true
            break
          }
        }
        if (hasVisibleStickers) {
          filtered.push(item)
        }
      } else {
        if (finalAllowedSet.has(item)) {
          filtered.push(item)
        }
      }
    }

    return filtered
  }, [activeTab, total, missingSet, duplicateSet, searchFilter, specialGroups, albumStickersMap, selectedAlbum, entireCanonicalStructure])

  const mobileGridPageSize = 120
  const shouldPaginateMobileGrid = isMobileGrid && viewMode === 'numbers' && numbers.length > mobileGridPageSize
  const totalMobileGridPages = shouldPaginateMobileGrid ? Math.ceil(numbers.length / mobileGridPageSize) : 1
  const safeMobileGridPage = Math.min(mobileGridPage, Math.max(totalMobileGridPages - 1, 0))
  const visibleNumbers = shouldPaginateMobileGrid
    ? numbers.slice(safeMobileGridPage * mobileGridPageSize, (safeMobileGridPage + 1) * mobileGridPageSize)
    : numbers

  useEffect(() => {
    setMobileGridPage(0)
  }, [activeTab, searchFilter, viewMode, selectedAlbum?.id])

  useEffect(() => {
    if (mobileGridPage !== safeMobileGridPage) setMobileGridPage(safeMobileGridPage)
  }, [mobileGridPage, safeMobileGridPage])

  useEffect(() => {
    if (ownedCount < total && completionPromptDismissed) setCompletionPromptDismissed(false)
    if (!selectedAlbum?.id || !profile?.id) return
    if (ownedCount < total || total <= 0) return
    if (albumProgressState !== ALBUM_PROGRESS_STATES.IN_PROGRESS) return
    if (completionPromptDismissed || showCompletionConfirm || showCompletionCelebration) return
    setShowCompletionConfirm(true)
  }, [
    albumProgressState,
    completionPromptDismissed,
    ownedCount,
    profile?.id,
    selectedAlbum?.id,
    showCompletionCelebration,
    showCompletionConfirm,
    total,
  ])

  const handleToggle = async (num) => {
    if (!profile?.id || !selectedAlbum?.id) return
    if (isAlbumLocked) {
      toast.error('Este album ya esta cerrado. Solo puedes revisarlo o validarlo en una Collector Hub.')
      return
    }

    const sticker = String(num)

    try {
      if (mode === 'have') {
        if (ownedSet.has(sticker)) await removeStickerStatus(profile.id, selectedAlbum.id, sticker)
        else await addOwnedSticker(profile.id, selectedAlbum.id, sticker)
        return
      }

      if (mode === 'missing') {
        if (missingSet.has(sticker)) await removeStickerStatus(profile.id, selectedAlbum.id, sticker)
        else await addMissingSticker(profile.id, selectedAlbum.id, sticker)
        return
      }

      if (mode === 'duplicate') {
        if (duplicateSet.has(sticker)) {
          const existing = duplicateStickers.find(item => String(item.sticker_number) === sticker)
          const currentQty = existing ? existing.quantity || 1 : 1
          await addDuplicateSticker(profile.id, selectedAlbum.id, sticker, currentQty + 1)
        } else {
          await addDuplicateSticker(profile.id, selectedAlbum.id, sticker, 1)
        }
        return
      }

      if (mode === 'clear') await removeStickerStatus(profile.id, selectedAlbum.id, sticker)
    } catch {
      toast.error('Hubo un error al actualizar el estado.')
    }
  }

  const handleIncrement = async (num, e) => {
    if (e) e.stopPropagation()
    if (isAlbumLocked) {
      toast.error('Este album ya esta cerrado. No puedes modificarlo.')
      return
    }
    const sticker = String(num)
    try {
      const existing = duplicateStickers.find(item => String(item.sticker_number) === sticker)
      const currentQty = existing ? existing.quantity || 1 : 0
      await addDuplicateSticker(profile.id, selectedAlbum.id, sticker, currentQty + 1)
    } catch {
      toast.error('Hubo un error al actualizar la cantidad.')
    }
  }

  const handleDecrement = async (num, e) => {
    if (e) e.stopPropagation()
    if (isAlbumLocked) {
      toast.error('Este album ya esta cerrado. No puedes modificarlo.')
      return
    }
    const sticker = String(num)
    try {
      await decrementDuplicateSticker(profile.id, selectedAlbum.id, sticker)
    } catch {
      toast.error('Hubo un error al actualizar la cantidad.')
    }
  }

  const handlePokemonHover = (e, sticker) => {
    if (!selectedAlbum) return;
    const isTPC = selectedAlbum.editorial === 'The Pokémon Company';
    const isTCG = selectedAlbum.name?.toLowerCase().includes('pokémon tcg') || selectedAlbum.name?.toLowerCase().includes('pokemon tcg');
    
    if (!isTPC || !isTCG) return;

    const stickerData = albumStickersMap[sticker];
    const rect = e.currentTarget.getBoundingClientRect();
    
    setPokemonTooltip({
      name: stickerData?.name || 'Información no disponible',
      rarity: stickerData?.team || 'Información no disponible',
      x: rect.left + rect.width / 2,
      y: rect.top - 10
    });
  };

  const handlePokemonLeave = () => {
    setPokemonTooltip(null);
  };

  const handlePokemonTouch = (e, sticker) => {
    e.stopPropagation();
    if (pokemonTooltip) {
      setPokemonTooltip(null);
    } else {
      handlePokemonHover(e, sticker);
    }
  };

  const handleBulkAdd = async () => {
    if (!bulkInput.trim() || !profile?.id || !selectedAlbum?.id) return
    if (isAlbumLocked) {
      toast.error('Este album ya esta cerrado. No puedes modificarlo.')
      return
    }

    const nums = bulkInput
      .split(/[,\s]+/)
      .map((item) => item.trim().toUpperCase())
      .filter(Boolean)

    if (!nums.length) {
      toast.error('No se encontraron numeros validos')
      return
    }

    const targetMode = mode === 'missing' ? 'missing' : mode === 'duplicate' ? 'duplicate' : 'have'

    try {
      await bulkAddStickers(profile.id, selectedAlbum.id, nums, targetMode)
      toast.success(`${nums.length} figurita(s) procesada(s)`)
      setBulkInput('')
    } catch {
      toast.error('No se pudo procesar la carga rapida')
    }
  }

  const handleConfirmAlbumCompletion = async () => {
    try {
      const nextState = await markAlbumCompleted({
        userId: profile.id,
        userName: profile.name || 'Coleccionista FigusUY',
        albumId: selectedAlbum.id,
        albumName: selectedAlbum.name,
        albumCover: selectedAlbum.cover_url || selectedAlbum.images?.[0] || null,
        albumYear: selectedAlbum.year || null,
      })
      setLegendState(nextState || { status: ALBUM_PROGRESS_STATES.COMPLETED })
      setCompletionPromptDismissed(false)
      setPartnerStoreStateTick((prev) => prev + 1)
      setShowCompletionConfirm(false)
      setShowCompletionCelebration(true)
    } catch (error) {
      toast.error(error.message || 'No se pudo completar el album')
      setShowCompletionConfirm(false)
    }
  }

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity
    const R = 6371
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLon = ((lon2 - lon1) * Math.PI) / 180
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
      + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180)
      * Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
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
      } catch {
        // Ignore location failures and continue without distance sorting.
      }
    }

    const { data } = await supabase.from('locations').select('*').eq('is_active', true).eq('business_plan', 'legend')

    if (data) {
      const stores = data
        .map((store) => {
          let distance = Infinity
          if (coords && store.lat && store.lng) distance = calculateDistance(coords.lat, coords.lng, store.lat, store.lng)
          return { ...store, _distance: distance }
        })
        .sort((a, b) => a._distance - b._distance)
      setPartnerStores(stores)
    }

    setLoadingPartnerStores(false)
  }

  const handleSelectAlbum = async (album) => {
    const res = await selectAlbum(album, profile?.id)
    if (!res?.error) return
    if (res.error.message.toLowerCase().includes('álbumes activos')) {
      setShowUpgradePrompt(true)
      return
    }
    toast.error(res.error.message)
  }

  const nextAction = isAlbumCompleted
    ? { label: 'Validar en Collector Hub', action: handleOpenPartnerStoreSelector }
    : isAlbumPartnerVerified
      ? { label: 'Ver logro', action: () => navigate('/achievements') }
      : { label: 'Ver cruces', action: () => navigate('/matches') }

  const albumCover = selectedAlbum?.cover_url || selectedAlbum?.images?.[0] || null
  const canUseChecklist = checklistImagesEnabled || selectedAlbum?.has_detailed_stickers

  if (isInitializing || (authLoading && !profile)) {
    return (
      <div className="album-page-root album-page-v2 flex-center" style={{ minHeight: '60vh' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--color-primary)]"></div>
          <p className="text-[var(--color-text-secondary)] font-medium">Sincronizando colecciones...</p>
        </div>
      </div>
    )
  }

  if (!selectedAlbum) {
    return (
      <div className="album-page-root album-page-v2 animate-fade-in">
        <section className="album-empty-hero">
          <div className="album-empty-copy">
            <span className="album-kicker">Mi album</span>
            <h1>Elegi una coleccion para empezar a mover tu progreso</h1>
            <p>
              Selecciona un album activo y desde aca podras cargar figuritas, detectar faltantes,
              abrir cruces y cerrar la coleccion con mejor contexto.
            </p>
          </div>
          
          <div className="album-empty-grid">
            {albums.length > 0 ? (
              albums.map((album) => {
                const coverImg = album.cover_url || album.images?.[0] || null
                return (
                  <button key={album.id} className="album-picker-card animate-fade-in-up" onClick={() => handleSelectAlbum(album)}>
                    <div className="album-picker-cover">
                      {coverImg ? (
                        <img src={coverImg} alt={album.name} />
                      ) : (
                        <div className="album-picker-fallback">
                          <span className="material-symbols-outlined">menu_book</span>
                          <b style={{ position: 'absolute', bottom: '10px', fontSize: '1.2rem', opacity: 0.5 }}>{album.year || '2026'}</b>
                        </div>
                      )}
                    </div>
                    <div className="album-picker-body">
                      <div className="album-picker-info">
                        <span className="album-picker-year">{album.year || 'Coleccion activa'}</span>
                        <h3>{album.name}</h3>
                      </div>
                      <div className="album-picker-meta">
                        <span>{album.total_stickers} figuritas</span>
                        <span className="material-symbols-outlined">arrow_outward</span>
                      </div>
                    </div>
                  </button>
                )
              })
            ) : (
              <div className="album-panel flex-center flex-col p-12 text-center gap-4 w-full" style={{ gridColumn: '1 / -1' }}>
                <span className="material-symbols-outlined text-4xl text-[var(--color-text-muted)]">search_off</span>
                <div>
                  <h3 className="text-xl font-bold">No se encontraron álbumes activos</h3>
                  <p className="text-[var(--color-text-muted)]">Vuelve a intentarlo en unos minutos o contacta a soporte.</p>
                </div>
                <button className="album-primary-btn" onClick={() => fetchAlbums()}>Reintentar</button>
              </div>
            )}
          </div>
        </section>

        <ConfirmDialog
          isOpen={showUpgradePrompt}
          title="Llegaste al limite de álbumes activos"
          message="Tu plan actual tiene un limite de álbumes activos. Si quieres seguir cargando colecciones, revisa los planes premium."
          confirmText="Ver planes"
          cancelText="Ahora no"
          variant="info"
          onConfirm={() => {
            setShowUpgradePrompt(false)
            navigate('/premium')
          }}
          onCancel={() => setShowUpgradePrompt(false)}
        />
      </div>
    )
  }

  return (
    <div className="album-page-root album-page-v2 animate-fade-in" onClick={() => setPokemonTooltip(null)}>
      {pokemonTooltip && (
        <div 
          className="pokemon-tooltip" 
          style={{ 
            left: `${pokemonTooltip.x}px`, 
            top: `${pokemonTooltip.y}px`,
            transform: 'translate(-50%, -100%)'
          }}
        >
          <span className="pokemon-tooltip-name">{pokemonTooltip.name}</span>
          <span className="pokemon-tooltip-rarity">{pokemonTooltip.rarity}</span>
        </div>
      )}
      <section className="album-hero-panel animate-fade-in-up">
        <div className="album-hero-main">
          <div className="album-cover album-cover-v2">
            {albumCover ? (
              <img src={albumCover} alt={selectedAlbum.name} />
            ) : (
              <div className="album-cover-fallback">
                <b>{selectedAlbum?.year?.toString().slice(-2) || '26'}</b>
                <span>Album</span>
              </div>
            )}
          </div>

          <div className="album-hero-copy">
            <h1>{selectedAlbum.name}</h1>
            <div className="album-hero-tags">
              <span className={`biz-chip ${statusMeta.tone}`}>{statusMeta.label}</span>
              {isAlbumLocked ? <span className="biz-chip">Edicion bloqueada</span> : null}
            </div>
            <p>
              Revisá tu progreso, detectá oportunidades y decidí rápido dónde empujar tus cruces hoy.
            </p>

            {userAlbums.length > 1 && (
              <div className="album-switcher-v2" onClick={(e) => e.stopPropagation()}>
                <button className="switcher-toggle" onClick={() => setIsSwitcherOpen(!isSwitcherOpen)}>
                  <span className="material-symbols-outlined" style={{ fontSize: '1.1rem', opacity: 0.7 }}>swap_horiz</span>
                  <span>Cambiar álbum</span>
                  <span className="material-symbols-outlined" style={{ 
                    transition: 'transform 0.2s', 
                    transform: isSwitcherOpen ? 'rotate(180deg)' : 'rotate(0deg)' 
                  }}>expand_more</span>
                </button>
                {isSwitcherOpen && (
                  <div className="switcher-menu animate-dropdown-pop">
                    {userAlbums.map(ua => (
                      <div 
                        key={ua.album_id} 
                        className={`switcher-option ${selectedAlbum.id === ua.album_id ? 'active' : ''}`}
                        onClick={() => {
                          handleSelectAlbum(ua.album);
                          setIsSwitcherOpen(false);
                        }}
                      >
                        {ua.album?.name || 'Colección'}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="album-hero-side">
          <div className="album-progress-card">
            <div className="album-progress-head">
              <span className="album-kicker">PROGRESO</span>
              <strong>{ownedCount} / {total}</strong>
            </div>
            <div className="progress-bar progress-bar-v2">
              <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
            </div>
            <p>
              Te faltan {emptyCount} figuritas. Hay {nearMatchesCount || 0} cruces activos cerca y {mutualMatchesCount || 0} usuarios con alta compatibilidad ahora.
            </p>
            <button className="album-primary-btn w-full" onClick={nextAction.action}>VER MEJORES CRUCES</button>
          </div>
        </div>
      </section>

      <section className="album-middle-panels animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <div className="album-panel album-state-panel">
          <span className="album-kicker">ESTADO DEL ́LBUM</span>
          <div className="album-state-grid">
            <div className="state-card have">
              <strong>{ownedCount}</strong>
              <span>TENGO</span>
            </div>
            <div className="state-card duplicate">
              <strong>{duplicateCount}</strong>
              <span>REPETIDAS</span>
            </div>
            <div className="state-card missing">
              <strong>{missingCount}</strong>
              <span>FALTANTES</span>
            </div>
            <div className="state-card">
              <strong>{progressPercent}%</strong>
              <span>COMPLETO</span>
            </div>
          </div>
          
          <div className="album-category-bars">
            <div className="category-bar">
              <div className="category-bar-head"><span>BASE</span><span>{progressPercent}%</span></div>
              <div className="progress-bar progress-bar-v2"><div className="progress-fill" style={{ width: `${progressPercent}%` }} /></div>
            </div>
            <div className="category-bar">
              <div className="category-bar-head"><span>ESPECIALES</span><span>{Math.round(progressPercent * 0.8)}%</span></div>
              <div className="progress-bar progress-bar-v2"><div className="progress-fill" style={{ width: `${Math.round(progressPercent * 0.8)}%` }} /></div>
            </div>
            <div className="category-bar">
              <div className="category-bar-head"><span>LEYENDAS</span><span>{Math.round(progressPercent * 0.4)}%</span></div>
              <div className="progress-bar progress-bar-v2"><div className="progress-fill" style={{ width: `${Math.round(progressPercent * 0.4)}%` }} /></div>
            </div>
          </div>
        </div>

        <div className="album-panel album-opportunity-panel">
          <div className="opportunity-head">
            <span className="album-kicker">QUÉ CONVIENE HACER</span>
            <h2>OPORTUNIDAD AHORA</h2>
            <p>Tenés {nearMatchesCount || 0} cruces muy fuertes cerca y un usuario que puede cerrarte {mutualMatchesCount || 0} hoy.</p>
          </div>
          
          <div className="opportunity-cards">
            <div className="opp-card highlight">
              <strong>{mutualMatchesCount || 0}</strong>
              <span>TE PUEDE DAR HOY</span>
            </div>
            <div className="opp-card">
              <strong>{Math.round((mutualMatchesCount || 0) / 1.5) || 0}</strong>
              <span>MUTUOS LISTOS</span>
            </div>
            <div className="opp-card">
              <strong>{nearMatchesCount || 0}</strong>
              <span>CRUCES CERCA</span>
            </div>
            <div className="opp-card">
              <strong>Match</strong>
              <span>MEJOR MATCH AHORA</span>
            </div>
          </div>
          <button className="album-primary-btn w-full" onClick={nextAction.action}>ABRIR MEJOR MATCH</button>
        </div>
      </section>

      {!loadingActivities && liveActivities.length > 0 && (
        <section className="album-live-feed-strip">
          <span className="album-kicker">AHORA EN FIGUSUY</span>
          <div className="live-feed-grid">
            {liveActivities.map((activity) => (
              <div key={activity.id} className="live-feed-card">
                <strong>{activity.title}</strong>
                <p>{activity.desc} {formatRelativeTime(activity.date)}.</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="album-workspace animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        <div className="album-editor-column">
          <section className="album-panel album-tools-panel">
            <div className="album-tools-copy">
              <span className="album-kicker">Carga rapida</span>
              <h2>Actualiza figuritas sin salir del tablero</h2>
              <p>Pega numeros separados por coma o espacio y se cargaran segun el modo actual.</p>
            </div>
            <div className="album-bulk-form">
              <input
                placeholder="Ej: 10, 45, 89, M1"
                value={bulkInput}
                onChange={(event) => setBulkInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') handleBulkAdd()
                }}
              />
              <button className="album-primary-btn" onClick={handleBulkAdd}>Guardar</button>
            </div>
          </section>

          <section className="album-panel">
            <div className="album-section-head">
              <div>
                <span className="album-kicker">Modo de carga</span>
                <h2>Define como quieres recorrer el album</h2>
              </div>
            </div>

            <div className="modes-grid modes-grid-v2 stagger-children">
              {Object.entries(MODE_META).map(([key, meta]) => (
                <button
                  key={key}
                  className={`mode-card mode-card-v2 ${key} ${mode === key ? 'active' : ''}`}
                  onClick={() => setMode(key)}
                >
                  <small>{mode === key ? meta.eyebrow : 'Modo disponible'}</small>
                  <b><span className="material-symbols-outlined">{meta.icon}</span>{meta.title}</b>
                  <span>{meta.description}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="album-panel album-grid-panel">
            <div className="tabs-header album-tabs-header">
              <div>
                <span className="album-kicker">Explorador</span>
                <h2>Recorre la coleccion por bloque o por estado</h2>
              </div>
              <div className="album-view-switch">
                <button className={viewMode === 'numbers' ? 'active' : ''} onClick={() => setViewMode('numbers')}>Rapida</button>
                {canUseChecklist ? (
                  <button className={viewMode === 'checklist' ? 'active' : ''} onClick={() => setViewMode('checklist')}>Checklist</button>
                ) : null}
              </div>
            </div>

            <div className="filter-tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  className={`filter-tab ${activeTab === tab.key ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.key)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="album-search-row">
              <input
                className="album-search-input"
                placeholder="Buscar por numero, nombre, equipo o pais..."
                value={searchFilter}
                onChange={(event) => setSearchFilter(event.target.value)}
              />
              <div className="album-search-meta">
                <strong>{numbers.length}</strong>
                <span>resultados</span>
              </div>
            </div>

            {viewMode === 'numbers' ? (
              <>
                {shouldPaginateMobileGrid ? (
                  <div className="mobile-grid-toolbar" style={{ background: 'rgba(255,255,255,0.03)', padding: '1.25rem', borderRadius: '1rem', marginBottom: '1.5rem', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="mobile-grid-meta" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <b style={{ color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.875rem', fontStyle: 'italic' }}>Pagina {safeMobileGridPage + 1}</b>
                        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', fontWeight: 600 }}>
                          {safeMobileGridPage * mobileGridPageSize + 1}-{Math.min((safeMobileGridPage + 1) * mobileGridPageSize, numbers.length)} de {numbers.length}
                        </span>
                      </div>
                      <div style={{ background: 'rgba(249, 115, 22, 0.1)', padding: '0.35rem 0.75rem', borderRadius: '2rem', fontSize: '0.7rem', color: 'var(--color-primary)', fontWeight: 800 }}>
                        {Math.round(((safeMobileGridPage + 1) / totalMobileGridPages) * 100)}% EXPLORADO
                      </div>
                    </div>
                    <div className="mobile-grid-nav" style={{ display: 'flex', gap: '0.75rem' }}>
                      <button 
                        onClick={() => setMobileGridPage((page) => Math.max(page - 1, 0))} 
                        disabled={safeMobileGridPage === 0}
                        style={{ 
                          flex: 1, padding: '1rem', borderRadius: '0.75rem', 
                          background: 'rgba(255,255,255,0.05)', color: 'white', 
                          border: '1px solid rgba(255,255,255,0.1)', 
                          fontWeight: 900, fontSize: '0.8rem', letterSpacing: '0.05em',
                          opacity: safeMobileGridPage === 0 ? 0.3 : 1,
                          cursor: 'pointer', transition: 'all 0.2s'
                        }}
                      >
                        ANTERIOR
                      </button>
                      <button 
                        onClick={() => setMobileGridPage((page) => Math.min(page + 1, totalMobileGridPages - 1))} 
                        disabled={safeMobileGridPage >= totalMobileGridPages - 1}
                        style={{ 
                          flex: 1, padding: '1rem', borderRadius: '0.75rem', 
                          background: 'var(--color-primary)', color: 'white', 
                          border: 'none', fontWeight: 900, fontSize: '0.8rem', letterSpacing: '0.05em',
                          opacity: safeMobileGridPage >= totalMobileGridPages - 1 ? 0.3 : 1,
                          cursor: 'pointer', boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3)',
                          transition: 'all 0.2s'
                        }}
                      >
                        SIGUIENTE
                      </button>
                    </div>
                  </div>
                ) : null}

                <div className="stickers-grid stickers-grid-v2">
                  {visibleNumbers.map((item, idx) => {
                    if (typeof item === 'object' && item.type === 'subtitle') {
                      return (
                        <div key={`sub-${idx}`} className="grid-subtitle" style={{ gridColumn: '1 / -1', padding: '1.5rem 0.5rem 0.5rem', display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid var(--color-surface-hover)', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{item.label}</span>
                          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                            {item.flags?.map((f, fi) => (
                              <div key={fi} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                <img src={`https://flagcdn.com/w40/${f.iso}.png`} alt={f.name} style={{ height: '12px', borderRadius: '2px', boxShadow: '0 1px 2px rgba(0,0,0,0.3)' }} />
                                <span style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>{f.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    }

                    const num = item
                    const status = ownedSet.has(num) ? 'have' : missingSet.has(num) ? 'miss' : duplicateSet.has(num) ? 'dup' : ''
                    const dupRow = status === 'dup' ? duplicateStickers.find(d => String(d.sticker_number) === String(num)) : null
                    const quantity = dupRow ? dupRow.quantity || 1 : 0
                    return (
                      <div
                        key={num}
                        className={`sticker-cell ${status} animate-scale-in`}
                        style={{ animationDelay: `${(idx % 20) * 0.02}s` }}
                        onClick={() => handleToggle(num)}
                        onMouseEnter={(e) => handlePokemonHover(e, num)}
                        onMouseLeave={handlePokemonLeave}
                        onTouchStart={(e) => handlePokemonTouch(e, num)}
                      >
                        <b>{num}</b>
                        {status === 'dup' && quantity > 1 && (
                          <span className="dup-badge">×{quantity}</span>
                        )}
                        {mode === 'duplicate' && status === 'dup' && (
                          <div className="dup-controls" onClick={(e) => e.stopPropagation()}>
                            <button className="control-btn minus" onClick={(e) => handleDecrement(num, e)}>−</button>
                            <button className="control-btn plus" onClick={(e) => handleIncrement(num, e)}>+</button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </>
            ) : (
              <div className="stickers-checklist">
                {numbers.map((item, idx) => {
                  if (typeof item === 'object' && item.type === 'subtitle') {
                    return (
                      <div key={`sub-chk-${idx}`} className="checklist-subtitle" style={{ gridColumn: '1 / -1', padding: '2rem 1rem 0.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem', borderBottom: '2px solid var(--color-surface-hover)', marginBottom: '1rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: 900, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>{item.label}</span>
                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                          {item.flags?.map((f, fi) => (
                            <div key={fi} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <img src={`https://flagcdn.com/w40/${f.iso}.png`} alt={f.name} style={{ height: '16px', borderRadius: '3px', boxShadow: '0 2px 4px rgba(0,0,0,0.4)' }} />
                              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>{f.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  }

                  const sticker = String(item)
                  const isOwned = ownedSet.has(sticker)
                  const isMissing = missingSet.has(sticker)
                  const isDuplicate = duplicateSet.has(sticker)
                  const stickerData = albumStickersMap[sticker]

                  let statusColor = 'var(--color-surface-hover)'
                  let statusText = 'Sin marcar'
                  let statusTextCol = 'var(--color-text-muted)'
                  let cardCls = 'checklist-card'

                  const dupRow = isDuplicate ? duplicateStickers.find(d => String(d.sticker_number) === sticker) : null
                  const quantity = dupRow ? dupRow.quantity || 1 : 0

                  if (isDuplicate) {
                    statusColor = '#22c55e'
                    statusText = quantity > 1 ? `Repetida (×${quantity})` : 'Repetida'
                    statusTextCol = '#22c55e'
                    cardCls += ' duplicate'
                  } else if (isMissing) {
                    statusColor = '#ff4d5a'
                    statusText = 'Faltante'
                    statusTextCol = '#ff4d5a'
                    cardCls += ' missing'
                  } else if (isOwned) {
                    statusColor = '#38bdf8'
                    statusText = 'Tengo'
                    statusTextCol = '#38bdf8'
                    cardCls += ' owned'
                  }

                  return (
                    <div key={sticker} className={cardCls} onClick={() => handleToggle(sticker)}>
                      <div className="checklist-img-wrapper">
                        {stickerData?.image_url ? (
                          <img src={stickerData.image_url} alt={stickerData.name || sticker} className="checklist-img" loading="lazy" />
                        ) : (
                          <div className="checklist-placeholder">
                            <span className="material-symbols-outlined">image</span>
                            <span>Sin imagen</span>
                          </div>
                        )}
                      </div>
                      <div className="checklist-info">
                        <div className="checklist-header">
                          <span 
                            className="checklist-num"
                            onMouseEnter={(e) => handlePokemonHover(e, sticker)}
                            onMouseLeave={handlePokemonLeave}
                            onTouchStart={(e) => handlePokemonTouch(e, sticker)}
                          >
                            {sticker}
                          </span>
                          {stickerData?.sticker_code ? <span className="checklist-code">{stickerData.sticker_code}</span> : null}
                        </div>
                        {stickerData?.name ? <span className="checklist-name">{stickerData.name}</span> : null}
                        {stickerData?.team || stickerData?.country ? <span className="checklist-meta">{stickerData.team || stickerData.country}</span> : null}
                        <div className="checklist-status">
                          <div className="status-dot" style={{ backgroundColor: statusColor }} />
                          <span className="status-text" style={{ color: statusTextCol }}>{statusText}</span>
                          {mode === 'duplicate' && isDuplicate && (
                            <div className="checklist-dup-controls" onClick={(e) => e.stopPropagation()} style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
                              <button className="control-btn-chk" onClick={(e) => handleDecrement(sticker, e)} style={{ padding: '2px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer' }}>−</button>
                              <button className="control-btn-chk" onClick={(e) => handleIncrement(sticker, e)} style={{ padding: '2px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer' }}>+</button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        </div>

        <aside className="album-sidebar album-sidebar-v2">
          <section className="album-panel album-side-card accent">
            <span className="album-kicker">Siguiente movimiento</span>
            <h3>Te faltan {missingCount} para cerrar la coleccion</h3>
            <p>Carga repetidas, activa cruces y usa el cierre validado cuando llegues al final.</p>
            <button className="album-primary-btn" onClick={nextAction.action}>{nextAction.label}</button>
          </section>

          <section className="album-panel album-side-card">
            <span className="album-kicker">Radar</span>
            <div className="album-side-stats">
              <div><span>Cruces cerca</span><strong>{nearMatchesCount || '--'}</strong></div>
              <div><span>Mutuos listos</span><strong>{mutualMatchesCount || '--'}</strong></div>
              <div><span>Red activa</span><strong>{summary.activeNow || '--'}</strong></div>
            </div>
          </section>

          <section className="album-panel album-side-feed">
            <LiveFeed title="Pulso del intercambio" items={feed} refreshedAt={summary.refreshedAt} />
          </section>
        </aside>
      </div>

      {showCompletionConfirm ? (
        <div className="album-modal-backdrop">
          <div className="album-modal-card">
            <div className="album-kicker">Confirmar cierre</div>
            <h2>Seguro que completaste este album?</h2>
            <p>
              Si lo confirmas, el album se cerrara y luego podras validarlo en una Tienda Collector Hub
              para desbloquear badge, rewards y beneficio final.
            </p>
            <div className="album-modal-points">
              <span>El album quedara cerrado para edicion</span>
              <span>No podras cambiar el estado de las figuritas</span>
              <span>Despues podras validarlo en una Collector Hub</span>
            </div>
            <div className="album-modal-actions">
              <button className="album-primary-btn" onClick={handleConfirmAlbumCompletion}>Confirmar album</button>
              <button
                className="btn-ghost"
                onClick={() => {
                  setCompletionPromptDismissed(true)
                  setShowCompletionConfirm(false)
                }}
              >
                Volver
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showCompletionCelebration ? (
        <div className="album-modal-backdrop">
          <div className="album-modal-card album-modal-card-celebration">
            <div className="album-modal-icon">
              <span className="material-symbols-outlined">emoji_events</span>
            </div>
            <div className="album-kicker">Cierre registrado</div>
            <h2>Album completado</h2>
            <p>
              Tu coleccion ya figura como completada. El siguiente paso es validarla en una
              Collector Hub para activar el beneficio premium.
            </p>
            <div className="album-modal-actions centered">
              <button className="album-primary-btn" onClick={handleOpenPartnerStoreSelector}>Validar en Collector Hub</button>
              <button className="btn-ghost" onClick={() => setShowCompletionCelebration(false)}>Cerrar</button>
            </div>
          </div>
        </div>
      ) : null}

      {showPartnerStoreSelector ? (
        <div className="album-modal-backdrop">
          <div className="album-modal-card album-modal-large">
            <div className="album-modal-head">
              <div>
                <div className="album-kicker">Collector Hub</div>
                <h2>Tiendas para validar tu album</h2>
              </div>
              <button className="btn-ghost" onClick={() => setShowPartnerStoreSelector(false)}>Cerrar</button>
            </div>

            <div className="album-partner-list">
              {loadingPartnerStores ? (
                <div className="album-partner-empty">Buscando lugares cercanos...</div>
              ) : partnerStores.length === 0 ? (
                <div className="album-partner-empty">No hay Collector Hub disponibles en este momento.</div>
              ) : (
                partnerStores.map((store) => {
                  const meta = store.metadata || {}
                  const radar = store.neighborhood || meta.zone || meta.neighborhood
                  const locationParts = [radar, store.department || meta.city].filter(Boolean)
                  const locationStr = locationParts.join(' - ')
                  const distanceStr = store._distance !== Infinity
                    ? store._distance < 1
                      ? `${Math.round(store._distance * 1000)} m`
                      : `${store._distance.toFixed(1)} km`
                    : null
                  const benefitTitle = meta.partner_benefit_title || 'Beneficio visible al validar'

                  return (
                    <article key={store.id} className="album-partner-card">
                      <div className="album-partner-top">
                        <div>
                          <h3>{store.name}</h3>
                          <p>{locationStr || 'Ubicacion disponible en mapa'}</p>
                        </div>
                        {distanceStr ? <span className="biz-chip orange">{distanceStr}</span> : null}
                      </div>
                      <div className="album-partner-meta">
                        <span className="material-symbols-outlined">location_on</span>
                        <span>{store.address || 'Direccion no disponible'}</span>
                      </div>
                      {meta.hours ? (
                        <div className="album-partner-meta">
                          <span className="material-symbols-outlined">schedule</span>
                          <span>{meta.hours}</span>
                        </div>
                      ) : null}
                      <div className="album-partner-benefit">
                        <span className="material-symbols-outlined">local_activity</span>
                        <div>
                          <strong>Beneficio Collector Hub</strong>
                          <span>{benefitTitle}</span>
                        </div>
                      </div>
                      <button className="album-primary-btn" onClick={() => navigate('/stores')}>Ver en el mapa</button>
                    </article>
                  )
                })
              )}
            </div>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        isOpen={showUpgradePrompt}
        title="Llegaste al limite de álbumes activos"
        message="Tu plan actual tiene un limite de álbumes activos. Si quieres seguir cargando colecciones, puedes revisar los planes premium."
        confirmText="Ver planes"
        cancelText="Ahora no"
        variant="info"
        onConfirm={() => {
          setShowUpgradePrompt(false)
          navigate('/premium')
        }}
        onCancel={() => setShowUpgradePrompt(false)}
      />
    </div>
  )
}

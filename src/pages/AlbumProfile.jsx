import React, { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate, useOutletContext } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import { useAppStore } from '../stores/appStore'
import '../album-profile.css'

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
  .acp-cl-num, .acp-cl-item b {
    cursor: pointer;
    transition: all 0.2s;
  }
  .acp-cl-num:hover, .acp-cl-item b:hover {
    color: var(--color-primary);
    text-shadow: 0 0 8px rgba(249, 115, 22, 0.5);
  }
`;

/* ── helpers ─────────────────────────────────────── */

const statusLabels = { active: 'Activo', new: 'Nuevo', popular: 'Popular', coming_soon: 'Próximamente', archived: 'Archivado' }

function timeAgo(dateStr) {
  if (!dateStr) return null
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'ahora'
  if (mins < 60) return `hace ${mins} min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `hace ${hrs}h`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `hace ${days}d`
  return new Date(dateStr).toLocaleDateString('es-UY', { day: 'numeric', month: 'short' })
}

function generateSlug(name) {
  return (name || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function topN(arr, key, n = 8) {
  const counts = {}
  ;(arr || []).forEach(d => { counts[d[key]] = (counts[d[key]] || 0) + 1 })
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([val, count]) => ({ value: val, count }))
}

/* ── component ─────────────────────────────────────── */

export default function AlbumProfile() {
  const { albumId: routeParam } = useParams()
  const navigate = useNavigate()
  const context = useOutletContext()
  const { user } = useAuthStore()
  const selectAlbum = useAppStore(s => s.selectAlbum)

  const [album, setAlbum] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [stats, setStats] = useState({ userCount: 0, chatCount: 0, lastActivity: null })
  const [mostWanted, setMostWanted] = useState([])
  const [mostRepeated, setMostRepeated] = useState([])
  const [recentActivity, setRecentActivity] = useState([])
  const [gallery, setGallery] = useState([])
  const [showChecklist, setShowChecklist] = useState(false)
  const [checklistData, setChecklistData] = useState(null)
  const [checklistLoading, setChecklistLoading] = useState(false)

  useEffect(() => { loadAll() }, [routeParam])

  async function loadAll() {
    setLoading(true)
    setError(null)
    try {
      const albumData = await resolveAlbum(routeParam)
      if (!albumData) { setError('Álbum no encontrado'); setLoading(false); return }
      setAlbum(albumData)

      // build gallery from all available image arrays
      const imgs = []
      if (albumData.images?.length > 1) imgs.push(...albumData.images.slice(1))
      try {
        if (albumData.secondary_images?.length) imgs.push(...albumData.secondary_images)
        if (albumData.pack_images?.length) imgs.push(...albumData.pack_images)
        if (albumData.special_images?.length) imgs.push(...albumData.special_images)
      } catch { /* columns may not exist yet */ }
      setGallery(imgs)

      // parallel stats fetch
      const id = albumData.id
      await Promise.all([
        fetchStats(id),
        fetchTopStickers(id),
        fetchActivity(id)
      ])
    } catch (err) {
      console.error('AlbumProfile load error:', err)
      setError('Error al cargar el perfil del álbum')
    } finally {
      setLoading(false)
    }
  }

  /* ── resolve album by UUID or slug ── */
  async function resolveAlbum(param) {
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(param)
    if (isUUID) {
      const { data } = await supabase.from('albums').select('*').eq('id', param).single()
      if (data) return data
    }
    // try slug match
    const { data: all } = await supabase.from('albums').select('*').eq('is_active', true)
    const match = (all || []).find(a => generateSlug(a.name) === param || a.slug === param)
    return match || null
  }

  /* ── stats ── */
  async function fetchStats(albumId) {
    const { count: uc } = await supabase.from('user_albums').select('user_id', { count: 'exact', head: true }).eq('album_id', albumId)
    const { count: cc } = await supabase.from('chats').select('id', { count: 'exact', head: true }).eq('album_id', albumId)
    const { data } = await supabase.from('user_albums').select('updated_at').eq('album_id', albumId).order('updated_at', { ascending: false }).limit(1).maybeSingle()
    setStats({ userCount: uc || 0, chatCount: cc || 0, lastActivity: data?.updated_at })
  }

  /* ── most wanted / repeated ── */
  async function fetchTopStickers(albumId) {
    const { data: missing } = await supabase.from('stickers_missing').select('sticker_number').eq('album_id', albumId).limit(5000)
    const { data: dupes } = await supabase.from('stickers_duplicate').select('sticker_number').eq('album_id', albumId).limit(5000)
    setMostWanted(topN(missing, 'sticker_number', 8))
    setMostRepeated(topN(dupes, 'sticker_number', 8))
  }

  /* ── recent activity ── */
  async function fetchActivity(albumId) {
    const { data } = await supabase.from('user_albums')
      .select('created_at')
      .eq('album_id', albumId)
      .order('created_at', { ascending: false })
      .limit(6)
    if (data) {
      setRecentActivity(data.map((r, i) => ({
        id: `act-${i}`,
        label: i === 0 ? 'Nuevo coleccionista se unió' : 'Usuario se sumó al álbum',
        time: timeAgo(r.created_at)
      })))
    } else {
      setRecentActivity([])
    }
  }

  /* ── navigation helpers ── */
  function handleAction(target) {
    if (!user) { 
      if (context?.setShowAuthModal) {
        if (context.setAuthRedirectTo) context.setAuthRedirectTo(target)
        context.setShowAuthModal(true)
      } else {
        navigate('/login', { state: { redirectTo: target } })
      }
      return 
    }
    if (album) selectAlbum(album, user.id)
    navigate(target)
  }

  /* ── checklist popup ── */
  async function openChecklist() {
    setShowChecklist(true)
    if (checklistData) return // already loaded
    setChecklistLoading(true)
    try {
      const isPaniniWC2026 = album.name === "Panini´s FIFA World Cup 2026"

      if (isPaniniWC2026) {
        // Build the exact same structure as Album.jsx
        const flagMap = {
          MEX: { iso: 'mx', name: 'México' }, RSA: { iso: 'za', name: 'Sudáfrica' }, KOR: { iso: 'kr', name: 'Corea del Sur' }, CZE: { iso: 'cz', name: 'Rep. Checa' },
          CAN: { iso: 'ca', name: 'Canadá' }, BIH: { iso: 'ba', name: 'Bosnia' }, QAT: { iso: 'qa', name: 'Qatar' }, SUI: { iso: 'ch', name: 'Suiza' },
          BRA: { iso: 'br', name: 'Brasil' }, MAR: { iso: 'ma', name: 'Marruecos' }, HAI: { iso: 'ht', name: 'Haití' }, SCO: { iso: 'gb-sct', name: 'Escocia' },
          USA: { iso: 'us', name: 'EE.UU.' }, PAR: { iso: 'py', name: 'Paraguay' }, AUS: { iso: 'au', name: 'Australia' }, TUR: { iso: 'tr', name: 'Turquía' },
          GER: { iso: 'de', name: 'Alemania' }, CUW: { iso: 'cw', name: 'Curazao' }, CIV: { iso: 'ci', name: 'C. Marfil' }, ECU: { iso: 'ec', name: 'Ecuador' },
          NED: { iso: 'nl', name: 'P. Bajos' }, JPN: { iso: 'jp', name: 'Japón' }, SWE: { iso: 'se', name: 'Suecia' }, TUN: { iso: 'tn', name: 'Túnez' },
          BEL: { iso: 'be', name: 'Bélgica' }, EGY: { iso: 'eg', name: 'Egipto' }, IRN: { iso: 'ir', name: 'Irán' }, NZL: { iso: 'nz', name: 'N. Zelanda' },
          ESP: { iso: 'es', name: 'España' }, URU: { iso: 'uy', name: 'Uruguay' }, KSA: { iso: 'sa', name: 'Arabia S.' }, CPV: { iso: 'cv', name: 'Cabo Verde' },
          FRA: { iso: 'fr', name: 'Francia' }, SEN: { iso: 'sn', name: 'Senegal' }, NOR: { iso: 'no', name: 'Noruega' }, IRQ: { iso: 'iq', name: 'Irak' },
          ARG: { iso: 'ar', name: 'Argentina' }, AUT: { iso: 'at', name: 'Austria' }, ALG: { iso: 'dz', name: 'Argelia' }, JOR: { iso: 'jo', name: 'Jordania' },
          POR: { iso: 'pt', name: 'Portugal' }, COL: { iso: 'co', name: 'Colombia' }, COD: { iso: 'cd', name: 'RD Congo' }, UZB: { iso: 'uz', name: 'Uzbekistán' },
          ENG: { iso: 'gb-eng', name: 'Inglaterra' }, CRO: { iso: 'hr', name: 'Croacia' }, PAN: { iso: 'pa', name: 'Panamá' }, GHA: { iso: 'gh', name: 'Ghana' }
        }
        const worldCupGroups = [
          { name: 'GRUPO A', teams: ['MEX', 'RSA', 'KOR', 'CZE'] },
          { name: 'GRUPO B', teams: ['CAN', 'BIH', 'QAT', 'SUI'] },
          { name: 'GRUPO C', teams: ['BRA', 'MAR', 'HAI', 'SCO'] },
          { name: 'GRUPO D', teams: ['USA', 'PAR', 'AUS', 'TUR'] },
          { name: 'GRUPO E', teams: ['GER', 'CUW', 'CIV', 'ECU'] },
          { name: 'GRUPO F', teams: ['NED', 'JPN', 'SWE', 'TUN'] },
          { name: 'GRUPO G', teams: ['BEL', 'EGY', 'IRN', 'NZL'] },
          { name: 'GRUPO H', teams: ['ESP', 'URU', 'KSA', 'CPV'] },
          { name: 'GRUPO I', teams: ['FRA', 'SEN', 'NOR', 'IRQ'] },
          { name: 'GRUPO J', teams: ['ARG', 'AUT', 'ALG', 'JOR'] },
          { name: 'GRUPO K', teams: ['POR', 'COL', 'COD', 'UZB'] },
          { name: 'GRUPO L', teams: ['ENG', 'CRO', 'PAN', 'GHA'] }
        ]
        // Build sections
        const sections = []
        // Intro
        const introStickers = ['00']
        for (let i = 1; i <= 8; i++) introStickers.push(`FWC${i}`)
        sections.push({ title: 'FIFA WORLD CUP', flags: [], stickers: introStickers })
        // Groups
        worldCupGroups.forEach(g => {
          const stickers = []
          g.teams.forEach(team => {
            for (let i = 1; i <= 20; i++) stickers.push(`${team}${i}`)
          })
          sections.push({
            title: g.name,
            flags: g.teams.map(t => flagMap[t]),
            stickers
          })
        })
        // FWC 9-19
        const fwcEnd = []
        for (let i = 9; i <= 19; i++) fwcEnd.push(`FWC${i}`)
        sections.push({ title: 'FWC ESPECIALES', flags: [], stickers: fwcEnd })
        // CC
        const ccStickers = []
        for (let i = 1; i <= 14; i++) ccStickers.push(`CC${i}`)
        sections.push({ title: 'COCA-COLA', flags: [], stickers: ccStickers })

        setChecklistData({ type: 'panini', sections, total: 1134 })
      } else {
        const isPokemonTCG = album.editorial === 'The Pokémon Company' || album.name?.toLowerCase().includes('pokémon tcg') || album.name?.toLowerCase().includes('pokemon tcg');

        // Try to load detailed sticker definitions for this album
        const { data: stickers } = await supabase
          .from('album_stickers')
          .select('*')
          .eq('album_id', album.id)
          .order('sticker_number', { ascending: true })
          .limit(2000)

        if (stickers && stickers.length > 0) {
          if (isPokemonTCG) {
            const total = album.total_stickers || stickers.length || 0
            const nums = []
            for (let i = 1; i <= total; i++) nums.push(String(i))
            setChecklistData({ type: 'simple', baseNumbers: nums, specials: {}, total, allStickers: stickers })
          } else {
            const groups = {}
            stickers.forEach(s => {
              const grp = s.group_name || s.team || s.country || 'General'
              if (!groups[grp]) groups[grp] = []
              groups[grp].push(s)
            })
            setChecklistData({ type: 'detailed', groups, total: stickers.length, allStickers: stickers })
          }
        } else {
          // Fallback: generate simple numeric list
          const total = album.total_stickers || 0
          const nums = []
          if (album.special_codes && typeof album.special_codes === 'object' && !Array.isArray(album.special_codes)) {
            for (let i = 1; i <= total; i++) nums.push(String(i))
            const specials = {}
            Object.keys(album.special_codes).forEach(prefix => {
              const cfg = album.special_codes[prefix]
              const seq = typeof cfg === 'object' ? cfg.sequence : ''
              const label = typeof cfg === 'object' ? cfg.label : cfg
              const codes = []
              if (seq) {
                const numR = seq.match(/^(\d+)-(\d+)$/)
                if (numR) {
                  for (let i = parseInt(numR[1]); i <= parseInt(numR[2]); i++) codes.push(`${prefix}${i}`)
                } else {
                  seq.split(',').forEach(x => codes.push(`${prefix}${x.trim()}`))
                }
              }
              specials[label || `Especiales ${prefix}`] = codes
            })
            setChecklistData({ type: 'simple', baseNumbers: nums, specials, total })
          } else {
            for (let i = 1; i <= total; i++) nums.push(String(i))
            setChecklistData({ type: 'simple', baseNumbers: nums, specials: {}, total })
          }
        }
      }
    } catch {
      const total = album.total_stickers || 0
      const nums = []
      for (let i = 1; i <= total; i++) nums.push(String(i))
      setChecklistData({ type: 'simple', baseNumbers: nums, specials: {}, total })
    } finally {
      setChecklistLoading(false)
    }
  }

  /* ── renders ─────────────────────────────────────── */

  if (loading) return <LoadingSkeleton />

  if (error || !album) {
    return (
      <div className="acp-page">
        <div className="acp-wrap" style={{ textAlign: 'center', paddingTop: '10vh' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '4rem', color: '#ff6a00', marginBottom: 16 }}>error</span>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: 12 }}>{error || 'Álbum no encontrado'}</h2>
          <button className="acp-btn-ghost" onClick={() => navigate(-1)}>← Volver</button>
        </div>
      </div>
    )
  }

  const coverUrl = album.cover_url || album.images?.[0] || null
  const description = album.public_description || `Colección activa dentro de FigusUY. Cargá tus repetidas y faltantes, encontrá matches y seguí el movimiento de la comunidad alrededor de este álbum.`
  const lastActLabel = stats.lastActivity ? timeAgo(stats.lastActivity) : 'Sin actividad aún'

  return (
    <div className="acp-page">
      <div className="acp-wrap">

        {/* ══════ HERO ══════ */}
        <div className="acp-hero">
          <div className="acp-cover-wrap">
            {coverUrl ? (
              <img className="acp-cover" src={coverUrl} alt={album.name} />
            ) : (
              <div className="acp-cover-placeholder">
                <span className="material-symbols-outlined">photo_library</span>
              </div>
            )}
          </div>

          <div>
            <div className="acp-eyebrow">// PERFIL DE COLECCIÓN</div>

            <h1 className="acp-title">{album.name}</h1>

            {/* Badges */}
            {album.status && album.status !== 'active' && (
              <span className={`acp-badge acp-badge--${album.status === 'new' ? 'new' : album.status === 'popular' ? 'popular' : 'active'}`}>
                {statusLabels[album.status] || album.status}
              </span>
            )}

            <p className="acp-desc">{description}</p>

            <div className="acp-meta-row">
              {album.editorial && <span className="acp-meta-pill">Editorial: {album.editorial}</span>}
              {album.year && <span className="acp-meta-pill">Año: {album.year}</span>}
              <span className="acp-meta-pill">Tipo: {album.album_type || 'Álbum'}</span>
              <span className="acp-meta-pill">{album.total_stickers} figuritas</span>
              {album.category && <span className="acp-meta-pill" style={{ textTransform: 'capitalize' }}>{album.category}</span>}
              {album.release_date && <span className="acp-meta-pill">Lanzamiento: {new Date(album.release_date).toLocaleDateString('es-UY')}</span>}
            </div>

            <div className="acp-actions">
              <button className="acp-btn-main" onClick={() => handleAction('/album')}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add_circle</span>
                Cargar mis figuritas
              </button>
              <button className="acp-btn-ghost" onClick={() => handleAction('/matches')}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>handshake</span>
                Ver mis matches
              </button>
              <button className="acp-btn-ghost" onClick={openChecklist}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>checklist</span>
                Ver checklist
              </button>
            </div>
          </div>
        </div>

        {/* ══════ STATS GRID ══════ */}
        <div className="acp-stats-grid">
          <StatCard label="Usuarios coleccionando" value={stats.userCount} sub="dato real" />
          <StatCard label="Matches generados" value={stats.chatCount} sub="cruces generados" />
          <StatCard label="Figuritas totales" value={album.total_stickers} sub="en el álbum" />
          <StatCard label="Última actividad" value={lastActLabel} sub="actualizado" isText />
        </div>

        {/* ══════ SECTIONS GRID ══════ */}
        <div className="acp-sections">

          {/* Más buscadas */}
          <section className="acp-panel">
            <h3>
              <span className="material-symbols-outlined">local_fire_department</span>
              Más buscadas
            </h3>
            {mostWanted.length > 0 ? (
              <div className="acp-chip-list">
                {mostWanted.map(s => (
                  <span key={s.value} className="acp-chip" title={`${s.count} usuarios la buscan`}>#{s.value}</span>
                ))}
              </div>
            ) : (
              <div className="acp-empty-safe">
                <span className="material-symbols-outlined">query_stats</span>
                Todavía no hay datos suficientes para mostrar las más buscadas.
              </div>
            )}
          </section>

          {/* Más repetidas */}
          <section className="acp-panel">
            <h3>
              <span className="material-symbols-outlined">content_copy</span>
              Más repetidas
            </h3>
            {mostRepeated.length > 0 ? (
              <div className="acp-chip-list">
                {mostRepeated.map(s => (
                  <span key={s.value} className="acp-chip" title={`${s.count} usuarios la tienen repetida`}>#{s.value}</span>
                ))}
              </div>
            ) : (
              <div className="acp-empty-safe">
                <span className="material-symbols-outlined">query_stats</span>
                Todavía no hay datos suficientes para mostrar las más repetidas.
              </div>
            )}
          </section>

          {/* Actividad reciente */}
          <section className="acp-panel">
            <h3>
              <span className="material-symbols-outlined">update</span>
              Actividad reciente
            </h3>
            {recentActivity.length > 0 ? (
              recentActivity.map((a, i) => (
                <div key={i} className="acp-activity-item">
                  <b>{a.label}</b>
                  <span>{a.time}</span>
                </div>
              ))
            ) : (
              <div className="acp-empty-safe">
                <span className="material-symbols-outlined">schedule</span>
                Nueva actividad próximamente
              </div>
            )}
          </section>

          {/* Validación */}
          <section className="acp-panel">
            <h3>
              <span className="material-symbols-outlined">verified</span>
              Validación
            </h3>
            <div className="acp-empty-safe">
              <span className="material-symbols-outlined">workspace_premium</span>
              Cuando completes el álbum, podés llevarlo a un Collector Hub oficial para validarlo y desbloquear el logro correspondiente.
            </div>
          </section>
        </div>

        {/* ══════ GALLERY ══════ */}
        {gallery.length > 0 && (
          <div className="acp-gallery">
            <h3>
              <span className="material-symbols-outlined" style={{ color: '#ff6a00' }}>photo_library</span>
              Galería
            </h3>
            <div className="acp-gallery-grid">
              {gallery.map((img, i) => (
                <div key={i} className="acp-gallery-item">
                  <img src={img} alt={`${album.name} — imagen ${i + 1}`} loading="lazy" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ══════ CHECKLIST MODAL ══════ */}
      {showChecklist && (
        <ChecklistModal
          album={album}
          data={checklistData}
          loading={checklistLoading}
          onClose={() => setShowChecklist(false)}
        />
      )}
    </div>
  )
}

/* ── sub-components ─────────────────────────────── */

function StatCard({ label, value, sub, isText }) {
  return (
    <div className="acp-stat-card">
      <span>{label}</span>
      <b style={isText ? { fontSize: 22, textTransform: 'capitalize' } : undefined}>
        {typeof value === 'number' ? value.toLocaleString('es-UY') : value}
      </b>
      <small>{sub}</small>
    </div>
  )
}

function ChecklistModal({ album, data, loading, onClose }) {
  const [pokemonTooltip, setPokemonTooltip] = useState(null)

  const stickerMap = useMemo(() => {
    if (!data?.allStickers) return {};
    return data.allStickers.reduce((acc, s) => {
      acc[String(s.sticker_number)] = s;
      return acc;
    }, {});
  }, [data]);

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

  const handlePokemonHover = (e, stickerNum, stickerData = null) => {
    const isTPC = album.editorial === 'The Pokémon Company';
    const isTCG = album.name?.toLowerCase().includes('pokémon tcg') || album.name?.toLowerCase().includes('pokemon tcg');
    if (!isTPC || !isTCG) return;

    const dataObj = stickerData || stickerMap[String(stickerNum)];
    const rect = e.currentTarget.getBoundingClientRect();
    
    setPokemonTooltip({
      name: dataObj?.name || 'Información no disponible',
      rarity: dataObj?.team || 'Información no disponible',
      x: rect.left + rect.width / 2,
      y: rect.top - 10
    });
  };

  const handlePokemonLeave = () => setPokemonTooltip(null);

  const handlePokemonTouch = (e, stickerNum, stickerData = null) => {
    e.stopPropagation();
    if (pokemonTooltip) setPokemonTooltip(null);
    else handlePokemonHover(e, stickerNum, stickerData);
  };

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const flagUrl = (iso) => `https://flagcdn.com/24x18/${iso}.png`

  return (
    <div className="acp-modal-backdrop" onClick={onClose}>
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
      <div className="acp-modal" onClick={(e) => e.stopPropagation()}>
        <div className="acp-modal-header">
          <div>
            <div className="acp-eyebrow" style={{ marginBottom: 4 }}>// CHECKLIST PÚBLICO</div>
            <h2 className="acp-modal-title">{album.name}</h2>
            <span style={{ color: '#aaa', fontSize: 13, fontWeight: 700 }}>
              {data?.total || album.total_stickers} figuritas en total
            </span>
          </div>
          <button className="acp-modal-close" onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="acp-modal-body">
          {loading ? (
            <div className="acp-modal-loading">
              <div className="acp-spinner" />
              <span>Cargando composición del álbum...</span>
            </div>
          ) : data?.type === 'panini' ? (
            /* Panini WC 2026 grouped layout */
            data.sections.map((section, si) => (
              <div key={si} className="acp-cl-group">
                <h4 className="acp-cl-group-header">
                  <span className="acp-cl-group-name">{section.title}</span>
                  {section.flags.length > 0 && (
                    <div className="acp-cl-flags">
                      {section.flags.map(f => (
                        <span key={f.iso} className="acp-cl-flag">
                          <img src={flagUrl(f.iso)} alt={f.name} />
                          {f.name}
                        </span>
                      ))}
                    </div>
                  )}
                  <span className="acp-cl-count">{section.stickers.length}</span>
                </h4>
                <div className="acp-cl-grid acp-cl-grid-numbers">
                  {section.stickers.map(s => (
                    <div 
                      key={s} 
                      className="acp-cl-num"
                      onMouseEnter={(e) => handlePokemonHover(e, s)}
                      onMouseLeave={handlePokemonLeave}
                      onTouchStart={(e) => handlePokemonTouch(e, s)}
                    >
                      {s}
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : data?.type === 'detailed' ? (
            /* Detailed sticker list grouped */
            Object.entries(data.groups).map(([group, stickers]) => (
              <div key={group} className="acp-cl-group">
                <h4 className="acp-cl-group-title">
                  <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#ff6a00' }}>folder</span>
                  {group}
                  <span className="acp-cl-count">{stickers.length}</span>
                </h4>
                <div className="acp-cl-grid">
                  {stickers.map(s => (
                    <div key={s.sticker_number} className="acp-cl-item">
                      <b
                        onMouseEnter={(e) => handlePokemonHover(e, s.sticker_number, s)}
                        onMouseLeave={handlePokemonLeave}
                        onTouchStart={(e) => handlePokemonTouch(e, s.sticker_number, s)}
                      >
                        {s.sticker_number}
                      </b>
                      {s.name && <span>{s.name}</span>}
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : data ? (
            /* Simple number list */
            <>
              <div className="acp-cl-group">
                <h4 className="acp-cl-group-title">
                  <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#ff6a00' }}>grid_view</span>
                  Base
                  <span className="acp-cl-count">{data.baseNumbers.length}</span>
                </h4>
                <div className="acp-cl-grid acp-cl-grid-numbers">
                  {data.baseNumbers.map(n => (
                    <div 
                      key={n} 
                      className="acp-cl-num"
                      onMouseEnter={(e) => handlePokemonHover(e, n)}
                      onMouseLeave={handlePokemonLeave}
                      onTouchStart={(e) => handlePokemonTouch(e, n)}
                    >
                      {n}
                    </div>
                  ))}
                </div>
              </div>
              {Object.entries(data.specials).map(([label, codes]) => (
                codes.length > 0 && (
                  <div key={label} className="acp-cl-group">
                    <h4 className="acp-cl-group-title">
                      <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#ff6a00' }}>star</span>
                      {label}
                      <span className="acp-cl-count">{codes.length}</span>
                    </h4>
                    <div className="acp-cl-grid acp-cl-grid-numbers">
                      {codes.map(c => (
                        <div 
                          key={c} 
                          className="acp-cl-num"
                          onMouseEnter={(e) => handlePokemonHover(e, c)}
                          onMouseLeave={handlePokemonLeave}
                          onTouchStart={(e) => handlePokemonTouch(e, c)}
                        >
                          {c}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              ))}
            </>
          ) : (
            <div className="acp-empty-safe">
              <span className="material-symbols-outlined">info</span>
              No se pudo cargar la composición del álbum.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="acp-page">
      <div className="acp-wrap">
        <div className="acp-skeleton acp-skel-hero" />
        <div className="acp-skel-stats">
          {[1, 2, 3, 4].map(i => <div key={i} className="acp-skeleton acp-skel-stat" />)}
        </div>
        <div className="acp-skel-sections">
          {[1, 2, 3, 4].map(i => <div key={i} className="acp-skeleton acp-skel-panel" />)}
        </div>
      </div>
    </div>
  )
}

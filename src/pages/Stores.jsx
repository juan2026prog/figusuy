import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import whpIcon from '../components/WhpIcon.png'
import { SponsoredPointCard } from '../components/sponsored/SponsoredComponents'
import { getUserLocation } from '../utils/location'
import { useAuthStore } from '../stores/authStore'
import { getBusinessBadges } from '../lib/ranking'
import BusinessApplyModal from '../components/BusinessApplyModal'
import PromoDetailModal, { getPromoStatus, PROMO_STATUS_CONFIG } from '../components/PromoDetailModal'
import { useToast } from '../components/Toast'
import { LiveBadge, LiveFeed } from '../components/LiveMomentum'
import { useLiveMomentum } from '../hooks/useLiveMomentum'
import GamificationIcon from '../components/gamification/icons/GamificationIcon'

export default function Stores() {
  const toast = useToast()
  const [tab, setTab] = useState('all')
  const [search, setSearch] = useState('')
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [selectedLoc, setSelectedLoc] = useState(null)
  const [showMapModal, setShowMapModal] = useState(false)
  const [mapModalMode, setMapModalMode] = useState('info') // 'info' or 'directions'
  const [showApplyModal, setShowApplyModal] = useState(false)
  const [applyType, setApplyType] = useState('store')
  const [promo, setPromo] = useState(null)
  const [locationPromos, setLocationPromos] = useState({})
  const [activePromoModal, setActivePromoModal] = useState(null)
  const [activePromoLocation, setActivePromoLocation] = useState(null)

  // Location filters
  const [selectedDepartment, setSelectedDepartment] = useState('Todos')
  const [selectedRadar, setSelectedRadar] = useState('Todos')
  const { profile } = useAuthStore()
  const [userCoords, setUserCoords] = useState(profile?.lat ? { lat: profile.lat, lng: profile.lng } : null)
  const { summary, feed } = useLiveMomentum()
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    if (profile?.lat && profile?.lng) {
      setUserCoords({ lat: profile.lat, lng: profile.lng })
    }
  }, [profile?.lat, profile?.lng])

  useEffect(() => {
    let active = true

    const loadStoresData = async () => {
      setLoading(true)
      setLoadError('')

      try {
        const [locationsRes, promosRes] = await Promise.all([
          supabase
            .from('vw_point_scores')
            .select(`
              id,
              name,
              address,
              lat,
              lng,
              type,
              metadata,
              score,
              score_label,
              business_plan,
              is_verified,
              description,
              department,
              neighborhood,
              point_badges,
              location_images(id, image_url)
            `)
            .order('score', { ascending: false }),
          supabase
            .from('sponsored_placements')
            .select('*')
            .eq('is_active', true),
        ])

        if (!active) return

        let nextLocations = locationsRes.data || []
        if (locationsRes.error) {
          console.error('Error fetching rich point data:', locationsRes.error)
          const { data: fallbackLocations } = await supabase
            .from('vw_point_scores')
            .select('id, name, address, lat, lng, type, metadata, score, score_label, business_plan, is_verified, description, department, neighborhood, point_badges')
            .order('score', { ascending: false })

          if (!active) return
          nextLocations = fallbackLocations || []
        }

        const activePromos = promosRes.data || []
        const featuredPromo = activePromos
          .filter((item) => item.placement_type === 'points_featured')
          .sort((a, b) => (b.priority || 0) - (a.priority || 0))[0] || null

        const nextLocationPromos = {}
        activePromos.forEach((item) => {
          if (!item.location_id) return
          if (!nextLocationPromos[item.location_id]) nextLocationPromos[item.location_id] = []
          nextLocationPromos[item.location_id].push(item)
        })

        setLocations(nextLocations)
        setPromo(featuredPromo)
        setLocationPromos(nextLocationPromos)
      } catch (error) {
        console.error('Unexpected error in Stores:', error)
        if (active) {
          setLoadError(error.message || 'No pudimos cargar los puntos ahora.')
          setLocations([])
          setPromo(null)
          setLocationPromos({})
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    void loadStoresData()

    return () => {
      active = false
    }
  }, [reloadKey])

  const actualPoints = locations.filter(loc => 
    !['country', 'department', 'city', 'neighborhood', 'zone'].includes(loc.type)
  )

  const departments = [
    'Artigas', 'Canelones', 'Cerro Largo', 'Colonia', 'Durazno', 'Flores',
    'Florida', 'Lavalleja', 'Maldonado', 'Montevideo', 'Paysandú', 'Río Negro',
    'Rivera', 'Rocha', 'Salto', 'San José', 'Soriano', 'Tacuarembó', 'Treinta y Tres'
  ]
  
  const radars = [...new Set(actualPoints.map(p => p.neighborhood || p.metadata?.zone || p.metadata?.neighborhood).filter(Boolean))].sort()

  const permitsExchange = (loc) => {
    if (loc.type === 'safe_point' || loc.type === 'safe_exchange_zone') return true
    if (loc.metadata?.allows_exchange === true) return true
    if (loc.metadata?.type === 'exchange') return true
    return false
  }

  const filteredPoints = actualPoints.filter(loc => {
    const isExchange = permitsExchange(loc)
    if (tab === 'exchange') return isExchange
    if (tab === 'store') return !isExchange
    if (tab === 'featured') return loc.business_plan === 'turbo' || loc.business_plan === 'dominio' || loc.business_plan === 'legend'
    return true
  }).filter(loc => {
    if (!search) return true
    const term = search.toLowerCase()
    return (loc.name || '').toLowerCase().includes(term) ||
           (loc.address || '').toLowerCase().includes(term) ||
           (loc.metadata?.zone || '').toLowerCase().includes(term)
  }).filter(loc => {
    if (selectedDepartment !== 'Todos') {
       const dept = loc.department || loc.metadata?.department;
       if (dept && dept !== selectedDepartment) return false
       if (!dept && loc.address && !loc.address.includes(selectedDepartment)) return false
    }
    if (selectedRadar !== 'Todos') {
       const zone = loc.neighborhood || loc.metadata?.zone || loc.metadata?.neighborhood;
       const hasRadar = (loc.address || '').toLowerCase().includes(selectedRadar.toLowerCase()) || 
                       (zone || '').toLowerCase() === selectedRadar.toLowerCase()
       if (!hasRadar) return false
    }
    return true
  })

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  const calculateScore = (loc, userDist) => {
    let baseScore = Number(loc.score) || 0;
    if (userDist !== Infinity) {
      baseScore -= Math.min(userDist * 2, 20); 
    }
    return baseScore;
  }

  const sortedPoints = [...filteredPoints].sort((a, b) => {
    const distA = userCoords ? calculateDistance(userCoords.lat, userCoords.lng, a.lat, a.lng) : Infinity;
    const distB = userCoords ? calculateDistance(userCoords.lat, userCoords.lng, b.lat, b.lng) : Infinity;
    const scoreA = calculateScore(a, distA);
    const scoreB = calculateScore(b, distB);
    return scoreB - scoreA;
  })

  const getCardInfo = (loc) => {
    const isExchange = permitsExchange(loc)
    const typeMap = { 
      store: 'Tienda', 
      safe_point: 'Punto seguro', 
      safe_exchange_zone: 'Zona sugerida para intercambio',
      cafe: 'Café', 
      kiosk: 'Kiosco', 
      shopping: 'Shopping', 
      plaza: 'Plaza' 
    }
    const typeStr = loc.metadata?.display_type || typeMap[loc.type] || 'Lugar'
    const neighborhood = loc.neighborhood || loc.metadata?.zone || loc.metadata?.neighborhood;
    const department = loc.department || loc.metadata?.city || loc.metadata?.department;
    const locParts = [neighborhood, department].filter(Boolean)
    const locationStr = locParts.length > 0 ? locParts.join(' Â· ') : loc.address
    const defaultDesc = isExchange 
      ? 'Intercambiá figuritas en un lugar seguro.' 
      : 'Comprá figuritas y sobres.'
    const description = loc.description || loc.metadata?.description || (isExchange && loc.type === 'store' ? 'Intercambiá y comprá figuritas.' : defaultDesc)
    const isTurbo = loc.business_plan === 'turbo';
    const isDominio = loc.business_plan === 'dominio';
    const isCollectorHub = loc.business_plan === 'partner_store' || loc.business_plan === 'legend';
    const premiumBadge = isCollectorHub ? 'Punto Oficial' : null;
    const premiumIconKey = isCollectorHub ? (loc.business_plan === 'legend' ? 'LegendaryCollectorHubIcon' : 'CollectorHubIcon') : null;
    const scoreLabel = loc.score_label || 'Punto activo'
    return { typeStr, locationStr, description, premiumBadge, premiumIconKey, isTurbo, isDominio, isCollectorHub, scoreLabel }
  }

  const handleCercaMio = async () => {
    if (profile?.lat && profile?.lng) {
      setUserCoords({ lat: profile.lat, lng: profile.lng })
      return
    }
    try {
      const coords = await getUserLocation(10000);
      setUserCoords(coords);
    } catch (err) {
      toast.error(err?.message || 'No pudimos obtener tu ubicacion.')
    }
  }

  const activePointsCount = actualPoints.length;
  const alliedStoresCount = actualPoints.filter(l => !permitsExchange(l)).length;
  const safePointsCount = actualPoints.filter(l => l.type === 'safe_point' || l.type === 'safe_exchange_zone').length;

  return (
    <div className="stores-final-root">
      <header className="sf-topbar">
        <div>
          <div className="sf-top-kicker">// Comunidad y negocios</div>
          <div className="sf-top-title">Mapa de <i>Lugares</i></div>
          <div className="sf-top-live">
            <LiveBadge tone="orange" pulse>{summary.activeNow} activos ahora</LiveBadge>
            <LiveBadge tone="green">{summary.validationsToday} validaciones hoy</LiveBadge>
            <LiveBadge tone="blue">{summary.activePromos} promos activas</LiveBadge>
          </div>
        </div>
        <div className="sf-top-actions">
          <button className="sf-btn" onClick={() => {
            if (window.innerWidth < 1180) {
               setShowMapModal(true)
            } else {
               window.scrollTo({ top: document.querySelector('.sf-map-side')?.offsetTop - 100, behavior: 'smooth' })
            }
          }}>Explorar mapa</button>
          <button className="sf-btn sf-orange" onClick={() => {
            setApplyType('store')
            setShowApplyModal(true)
          }}>Sumar mi local</button>
        </div>
      </header>

      <main className="sf-wrap">
        {loadError && !loading && (
          <section className="sf-empty" style={{ marginBottom: '1.5rem', textAlign: 'center', padding: '2rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <h3 style={{ fontSize: '1.6rem' }}>No pudimos cargar los lugares</h3>
            <p>{loadError}</p>
            <button className="sf-btn sf-orange" type="button" onClick={() => setReloadKey(value => value + 1)}>
              Reintentar
            </button>
          </section>
        )}

        <section className="sf-hero">
          <div className="sf-hero-card">
            <div>
              <div className="sf-top-kicker">// Motor de decisión</div>
              <h1 className="sf-hero-title">Encontrá el mejor lugar hoy.</h1>
              <p className="sf-hero-sub">No solo mostramos lugares; rankeamos por <b>actividad real</b>, <b>confianza</b> y <b>beneficios</b> para que tu intercambio valga la pena.</p>
            </div>
            <div className="sf-hero-stats">
              <div className="sf-hero-stat"><b>{activePointsCount}</b><span>Lugares activos</span></div>
              <div className="sf-hero-stat"><b>{alliedStoresCount}</b><span>Tiendas oficiales</span></div>
              <div className="sf-hero-stat"><b>{safePointsCount}</b><span>Zonas seguras</span></div>
            </div>
          </div>

          <aside className="sf-hero-map-card">
            <div className="sf-map-head">
              <div>
                <div className="sf-map-title">{selectedDepartment !== 'Todos' ? selectedDepartment : 'Uruguay'}</div>
                <div className="sf-map-mini">Concentración de lugares y actividad</div>
              </div>
              <button className="sf-btn sf-orange" onClick={handleCercaMio}>ðŸ“ Cerca mío</button>
            </div>
            <div className="sf-hero-google-map">
              <iframe 
                loading="lazy" 
                allowFullScreen 
                referrerPolicy="no-referrer-when-downgrade" 
                src={`https://maps.google.com/maps?q=${selectedDepartment !== 'Todos' ? encodeURIComponent(selectedDepartment + ', Uruguay') : 'Montevideo, Uruguay'}&t=&z=12&ie=UTF8&iwloc=&output=embed`}>
              </iframe>
            </div>
          </aside>
        </section>

        <section className="sf-filters-panel">
          <div className="sf-filters-top">
            <div className="sf-field">
              <label>Departamento</label>
              <select value={selectedDepartment} onChange={e => setSelectedDepartment(e.target.value)}>
                <option value="Todos">Todo el país</option>
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="sf-field">
              <label>Barrio / Zona</label>
              <select value={selectedRadar} onChange={e => setSelectedRadar(e.target.value)}>
                <option value="Todos">Todos los barrios</option>
                {radars.map(z => <option key={z} value={z}>{z}</option>)}
              </select>
            </div>
            <div className="sf-field" style={{ gridColumn: 'span 2' }}>
              <label>Buscar por nombre o dirección</label>
              <input 
                placeholder="Ej: Kiosco del centro, Shopping..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="sf-tabs">
            <button className={`sf-tab ${tab === 'all' ? 'sf-active' : ''}`} onClick={() => setTab('all')}>Todos los lugares</button>
            <button className={`sf-tab ${tab === 'exchange' ? 'sf-active' : ''}`} onClick={() => setTab('exchange')}>Solo intercambios</button>
            <button className={`sf-tab ${tab === 'store' ? 'sf-active' : ''}`} onClick={() => setTab('store')}>Solo tiendas</button>
            <button className={`sf-tab ${tab === 'featured' ? 'sf-active' : ''}`} onClick={() => setTab('featured')}>â­ Destacados</button>
          </div>
        </section>

        <section className="sf-layout">
          <div>
            <div className="sf-section-title">
              <div>
                <div className="sf-top-kicker">// PointScore Ranking</div>
                <h2>{tab === 'featured' ? 'Locales recomendados' : 'Resultados inteligentes'}</h2>
                <p>Ordenados por el algoritmo PointScore (Actividad + Confianza + Distancia).</p>
              </div>
              <span className={`sf-count-pill ${loading ? 'animate-pulse' : ''}`}>
                {loading ? 'Sincronizando...' : `${sortedPoints.length} encontrados`}
              </span>
            </div>

            <div className="sf-list">
              {loading ? (
                <div className="sf-list">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="sf-point-card" style={{ opacity: 0.5, pointerEvents: 'none' }}>
                      <div className="sf-point-icon">
                        <div className="sf-icon-box skeleton"></div>
                      </div>
                      <div className="sf-point-body">
                        <div className="skeleton" style={{ height: '24px', width: '60%', marginBottom: '12px' }}></div>
                        <div className="skeleton" style={{ height: '16px', width: '40%', marginBottom: '8px' }}></div>
                        <div className="skeleton" style={{ height: '16px', width: '80%' }}></div>
                      </div>
                      <div className="sf-point-actions">
                        <div className="skeleton" style={{ height: '100%' }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : sortedPoints.length === 0 ? (
                <div className="sf-empty" style={{ textAlign: 'center', padding: '4rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                  <h3 style={{ fontSize: '2rem' }}>No hay resultados</h3>
                  <p>Probá cambiando los filtros o buscá en otra zona.</p>
                  <button className="sf-btn sf-orange" style={{ marginTop: '1.5rem' }} onClick={() => {
                    setTab('all')
                    setSelectedDepartment('Todos')
                    setSelectedRadar('Todos')
                    setSearch('')
                  }}>Limpiar filtros</button>
                </div>
              ) : (
                <>
                  {promo && <SponsoredPointCard placement={promo} page="Stores" />}
                  {sortedPoints.map(loc => {
                    const { typeStr, locationStr, description, premiumBadge, premiumIconKey, isTurbo, isDominio, isCollectorHub, scoreLabel } = getCardInfo(loc)
                    const meta = { ...loc.metadata }
                  
                    if (userCoords && loc.lat && loc.lng) {
                      const dist = calculateDistance(userCoords.lat, userCoords.lng, loc.lat, loc.lng)
                      meta.distance = dist < 1 ? `${Math.round(dist * 1000)} m` : `${dist.toFixed(1)} km`
                    }

                    const isExchange = permitsExchange(loc)
                    const cardTypeClass = isExchange ? 'sf-exchange' : 'sf-store'
                    const cardDominioClass = isDominio ? 'sf-dominio' : ''
                    const cardTurboClass = isTurbo ? 'sf-turbo' : ''
                    const cardHubClass = isCollectorHub ? 'sf-hub' : ''

                    const iconStr = isExchange ? (loc.type === 'cafe' ? 'local_cafe' : 'sync_alt') : 'storefront'

                    const locPromos = (locationPromos[loc.id] || []).filter(p => {
                      const status = getPromoStatus(p)
                      return status === 'activa' || status === 'proximamente'
                    })
                    const topPromo = locPromos[0] || null

                    // Build feature highlights for the card
                    const featureHighlights = []
                    if (topPromo) {
                      const promoStatus = getPromoStatus(topPromo)
                      const statusCfg = PROMO_STATUS_CONFIG[promoStatus]
                      featureHighlights.push({ key: 'promo', icon: 'redeem', title: topPromo.title, subtitle: topPromo.condition_text || '', statusLabel: statusCfg.label, statusColor: statusCfg.color, statusBg: statusCfg.bg, statusBorder: statusCfg.border })
                    }
                    if (isCollectorHub) {
                      featureHighlights.push({ key: 'validation', icon: 'fact_check', title: 'Validación de Ãlbumes', subtitle: 'Validamos tus álbumes al instante.' })
                    }
                    if (premiumBadge) {
                      featureHighlights.push({ key: 'oficial', iconKey: premiumIconKey, icon: 'verified_user', title: premiumBadge, subtitle: 'Sumá puntos y canjeá rewards.' })
                    }

                    return (
                      <article 
                        key={loc.id} 
                        className={`sf-point-card ${cardTypeClass} ${cardDominioClass} ${cardTurboClass} ${cardHubClass}`}
                        onClick={() => {
                          setSelectedLoc(loc)
                          if (window.innerWidth < 1180) {
                            setMapModalMode('info')
                            setShowMapModal(true)
                          } else {
                            window.scrollTo({ top: document.querySelector('.sf-map-side')?.offsetTop - 100, behavior: 'smooth' })
                          }
                        }}
                      >
                        {/* Icon column */}
                        <div className="sf-point-icon">
                          <div className="sf-icon-box">
                            <span className="material-symbols-outlined">{iconStr}</span>
                          </div>
                        </div>

                        {/* Body: info + features + image */}
                        <div className="sf-point-body">
                          <div className="sf-point-content-row">
                          <div className="sf-point-info-col">
                            <div className="sf-badges">
                              {isExchange ? <span className="sf-badge sf-exchange">ðŸ› Punto de intercambio</span> : <span className="sf-badge sf-store">ðŸ› Tienda aliada</span>}
                              <span className="sf-badge">âš¡ {scoreLabel}</span>
                              {loc.is_verified && <span className="sf-badge sf-verified">ðŸ›¡ï¸ Zona Segura</span>}
                              {premiumBadge && (
                                <span className="sf-badge sf-premium-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  {premiumIconKey ? <GamificationIcon icon={premiumIconKey} size="sm" /> : 'â­'} {premiumBadge}
                                </span>
                              )}
                              {meta.distance && <span className="sf-badge">ðŸ“ {meta.distance}</span>}
                            </div>

                            <h3 className="sf-point-name">{loc.name || 'Punto sin nombre'}</h3>
                            <p className="sf-point-loc">{typeStr} Â· {locationStr}</p>
                            <div className="sf-point-address">
                              <span className="material-symbols-outlined">location_on</span> {loc.address || 'Dirección no disponible'}
                            </div>
                            <p className="sf-point-desc">{description}</p>
                          </div>

                          {/* Feature highlights */}
                          {featureHighlights.length > 0 && (
                            <div className="sf-features-row">
                              {featureHighlights.map(fh => (
                                <div key={fh.key} className="sf-feature-highlight" onClick={fh.key === 'promo' ? (e) => { e.stopPropagation(); setActivePromoModal(topPromo); setActivePromoLocation(loc) } : undefined}>
                                  {fh.iconKey 
                                    ? <span className="sf-fh-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><GamificationIcon icon={fh.iconKey} size="md" /></span> 
                                    : <span className="material-symbols-outlined sf-fh-icon">{fh.icon}</span>
                                  }
                                  <strong>{fh.title}</strong>
                                  {fh.statusLabel && <span className="sf-fh-status" style={{ color: fh.statusColor, background: fh.statusBg, borderColor: fh.statusBorder }}>{fh.statusLabel}</span>}
                                  {fh.subtitle && <span className="sf-fh-sub">{fh.subtitle}</span>}
                                </div>
                              ))}
                              {topPromo && (
                                <button className="sf-promo-link-v2" onClick={(e) => { e.stopPropagation(); setActivePromoModal(topPromo); setActivePromoLocation(loc) }}>
                                  Ver promo <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>chevron_right</span>
                                </button>
                              )}
                            </div>
                          )}
                          </div>

                          {/* Business badges */}
                          {loc.point_badges?.length > 0 && (
                            <div className="sf-point-badges-row">
                              {getBusinessBadges(loc.point_badges).map(b => (
                                <span key={b.label} className="sf-badge" style={{ borderColor: b.bg, color: b.color, background: b.bg, opacity: 0.9, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  {b.iconKey ? <GamificationIcon icon={b.iconKey} size="sm" /> : b.emoji} {b.label}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Cover image for premium plans - separate grid column */}
                        {(isDominio || isCollectorHub) && loc.location_images && loc.location_images.length > 0 && (
                          <div className="sf-point-cover">
                            <img src={loc.location_images[0].image_url} alt="Portada del local" />
                          </div>
                        )}

                        {/* Action buttons */}
                        <div className="sf-point-actions">
                          {meta.whatsapp && (
                            <button className="sf-action sf-action-wa" onClick={(e) => {
                              e.stopPropagation();
                              window.open(`https://wa.me/${meta.whatsapp}`, '_blank');
                            }}>
                              <img src={whpIcon} alt="WhatsApp" style={{ width: '20px', height: '20px', verticalAlign: 'middle', marginRight: '6px' }} />
                              WhatsApp
                            </button>
                          )}
                          <button className="sf-action sf-action-llegar" onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLoc(loc);
                            setMapModalMode('directions');
                            setShowMapModal(true);
                          }}>
                            <span className="material-symbols-outlined">location_on</span> Cómo llegar
                          </button>
                          <button className="sf-action sf-action-info" onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLoc(loc);
                            if (window.innerWidth < 1180) {
                              setMapModalMode('info');
                              setShowMapModal(true);
                            } else {
                              window.scrollTo({ top: document.querySelector('.sf-map-side')?.offsetTop - 100, behavior: 'smooth' });
                            }
                          }}>
                            <span className="material-symbols-outlined">map</span> Info / Mapa
                          </button>
                        </div>
                      </article>
                    )
                  })}
                </>
              )}
            </div>
          </div>

          <aside className="sf-map-side">
            <section className="sf-map-card">
              <h3>Mapa Interactivo</h3>
              <div className="sf-map-frame">
                <iframe
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                  src={selectedLoc 
                    ? `https://maps.google.com/maps?q=${selectedLoc.lat && selectedLoc.lng ? `${selectedLoc.lat},${selectedLoc.lng}` : encodeURIComponent((selectedLoc.address || '') + ' ' + (selectedLoc.name || ''))}&t=&z=15&ie=UTF8&iwloc=&output=embed`
                    : `https://maps.google.com/maps?q=${selectedDepartment !== 'Todos' ? encodeURIComponent(selectedDepartment + ', Uruguay') : 'Montevideo, Uruguay'}&t=&z=12&ie=UTF8&iwloc=&output=embed`
                  }
                ></iframe>
              </div>
              {selectedLoc && (
                <div className="sf-map-selected">
                  <b>{selectedLoc.name}</b>
                  <span>
                    {selectedLoc.address} 
                    {` Â· ${permitsExchange(selectedLoc) ? 'Punto de intercambio' : 'Tienda aliada'}`}
                  </span>
                </div>
              )}
            </section>

            {profile?.business_status !== 'approved' && (
              <section className="sf-cta-card">
                <h3>¿Tenés un local?</h3>
                <p>Unite a la red más grande de coleccionistas y atraé más tráfico a tu local.</p>
                <button className="sf-btn sf-block" onClick={() => {
                  setApplyType('store')
                  setShowApplyModal(true)
                }}>{profile?.business_status === 'pending' ? 'Ver mi solicitud' : 'Sumar mi local'}</button>
              </section>
            )}

            <LiveFeed title="Actividad en vivo" items={feed} refreshedAt={summary.refreshedAt} />
            
            <section className="sf-safety">
              ðŸ’¡ <b>Tip de seguridad:</b> Realizá tus intercambios preferentemente en las Tiendas Aliadas o Lugares Seguros verificados.
            </section>
          </aside>
        </section>
      </main>

      {showMapModal && (
        <div className="sf-stores-modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem'
        }} onClick={() => setShowMapModal(false)}>
          <div style={{
            background: 'var(--color-surface)', width: '100%', maxWidth: '900px', height: '70vh', minHeight: '400px', borderRadius: '8px',
            display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)', position: 'relative'
          }} onClick={e => e.stopPropagation()}>
            <div style={{
              padding: '1rem 1.5rem', background: '#111111', borderBottom: '1px solid rgba(255,255,255,0.1)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div>
                <h3 style={{ fontSize: '1.4rem', margin: 0, fontFamily: 'Barlow Condensed', textTransform: 'uppercase', fontWeight: 900 }}>
                  {mapModalMode === 'directions' ? 'Cómo llegar' : (selectedLoc ? selectedLoc.name : 'Mapa')}
                </h3>
                {selectedLoc && <p style={{ margin: 0, fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)' }}>{selectedLoc.address}</p>}
              </div>
              <button style={{
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', width: '36px', height: '36px', borderRadius: '4px',
                color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease'
              }} onClick={() => setShowMapModal(false)} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}>
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>close</span>
              </button>
            </div>
            <div style={{ flex: 1, position: 'relative' }}>
              <iframe
                width="100%" height="100%" style={{ border: 0 }} loading="lazy" allowFullScreen referrerPolicy="no-referrer-when-downgrade"
                src={selectedLoc 
                  ? mapModalMode === 'directions'
                    ? `https://maps.google.com/maps?saddr=${userCoords?.lat && userCoords?.lng ? `${userCoords.lat},${userCoords.lng}` : ''}&daddr=${selectedLoc.lat && selectedLoc.lng ? `${selectedLoc.lat},${selectedLoc.lng}` : encodeURIComponent((selectedLoc.address || '') + ' ' + (selectedLoc.name || ''))}&t=&z=16&ie=UTF8&iwloc=&output=embed`
                    : `https://maps.google.com/maps?q=${selectedLoc.lat && selectedLoc.lng ? `${selectedLoc.lat},${selectedLoc.lng}` : encodeURIComponent((selectedLoc.address || '') + ' ' + (selectedLoc.name || ''))}&t=&z=16&ie=UTF8&iwloc=&output=embed`
                  : "https://maps.google.com/maps?q=Montevideo,Uruguay&t=&z=12&ie=UTF8&iwloc=&output=embed"
                }
              ></iframe>
            </div>
            {selectedLoc && (
              <div style={{ padding: '1rem 1.5rem', background: '#111111', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button className="sf-btn" onClick={() => setShowMapModal(false)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)' }}>
                   Cerrar
                </button>
                <button className="sf-btn sf-orange" onClick={() => {
                   const dest = selectedLoc.address || selectedLoc.name;
                   window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dest)}`, '_blank');
                }}>
                   ðŸ“ Iniciar navegación en Maps
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <BusinessApplyModal isOpen={showApplyModal} onClose={() => setShowApplyModal(false)} initialType={applyType} />

      {activePromoModal && (
        <PromoDetailModal
          promo={activePromoModal}
          location={activePromoLocation}
          onClose={() => { setActivePromoModal(null); setActivePromoLocation(null); }}
          onViewLocal={(loc) => {
            setActivePromoModal(null)
            setActivePromoLocation(null)
            setSelectedLoc(loc)
            if (window.innerWidth < 1180) {
              setShowMapModal(true)
            } else {
              window.scrollTo({ top: document.querySelector('.sf-map-side')?.offsetTop - 100, behavior: 'smooth' })
            }
          }}
        />
      )}
    </div>
  )
}

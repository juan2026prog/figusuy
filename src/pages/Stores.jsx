import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { SponsoredPointCard } from '../components/sponsored/SponsoredComponents'
import { getUserLocation } from '../utils/location'

export default function Stores() {
  const [tab, setTab] = useState('all')
  const [search, setSearch] = useState('')
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedLoc, setSelectedLoc] = useState(null)
  const [showMapModal, setShowMapModal] = useState(false)
  const [promo, setPromo] = useState(null)

  // Location filters
  const [selectedCountry, setSelectedCountry] = useState('Uruguay')
  const [selectedDepartment, setSelectedDepartment] = useState('Todos')
  const [selectedZone, setSelectedZone] = useState('Todos')
  const [userCoords, setUserCoords] = useState(null)

  useEffect(() => {
    const fetchLocations = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('is_active', true)
        .order('name')
      if (!error) setLocations(data || [])
      setLoading(false)
    }
    const fetchPromo = async () => {
      const { data } = await supabase
        .from('sponsored_placements')
        .select('*')
        .eq('placement_type', 'points_featured')
        .eq('is_active', true)
        .order('priority', { ascending: false })
        .limit(1)
        .single();
      if (data) setPromo(data);
    }
    fetchLocations()
    fetchPromo()
  }, [])

  // Identify real points vs regions
  const actualPoints = locations.filter(loc => 
    !['country', 'department', 'city', 'neighborhood', 'zone'].includes(loc.type)
  )

  // Extract unique filter options from actual points to avoid showing empty options
  const countries = [...new Set(actualPoints.map(l => l.metadata?.country || 'Uruguay'))]
  if (!countries.includes('Uruguay')) countries.push('Uruguay')
  
  // Hardcoded departments to always show the full list
  const departments = [
    'Artigas', 'Canelones', 'Cerro Largo', 'Colonia', 'Durazno', 'Flores',
    'Florida', 'Lavalleja', 'Maldonado', 'Montevideo', 'Paysandú', 'Río Negro',
    'Rivera', 'Rocha', 'Salto', 'San José', 'Soriano', 'Tacuarembó', 'Treinta y Tres'
  ]
  
  // Extract only zones that actually have points to prevent empty searches
  const zones = [...new Set(actualPoints.map(p => p.metadata?.zone || p.metadata?.neighborhood).filter(Boolean))].sort()

  const permitsExchange = (loc) => {
    if (loc.type === 'safe_point') return true
    if (loc.metadata?.allows_exchange === true) return true
    if (loc.metadata?.type === 'exchange') return true
    return false
  }

  const filteredPoints = actualPoints.filter(loc => {
    const isExchange = permitsExchange(loc)
    if (tab === 'exchange') return isExchange
    if (tab === 'store') return !isExchange
    return true
  }).filter(loc => {
    if (!search) return true
    const term = search.toLowerCase()
    return loc.name.toLowerCase().includes(term) ||
           (loc.address || '').toLowerCase().includes(term) ||
           (loc.metadata?.zone || '').toLowerCase().includes(term)
  }).filter(loc => {
    // Basic address/metadata matching since parent_id isn't populated
    if (selectedCountry !== 'Todos' && selectedCountry !== 'Uruguay') {
       if (loc.metadata?.country && loc.metadata.country !== selectedCountry) return false
    }
    if (selectedDepartment !== 'Todos') {
       if (loc.metadata?.department && loc.metadata.department !== selectedDepartment) return false
       if (!loc.metadata?.department && loc.address && !loc.address.includes(selectedDepartment)) return false
    }
    if (selectedZone !== 'Todos') {
       const hasZone = (loc.address || '').toLowerCase().includes(selectedZone.toLowerCase()) || 
                       (loc.metadata?.zone || '').toLowerCase() === selectedZone.toLowerCase()
       if (!hasZone) return false
    }
    return true
  })

  // Distance calculation
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
    let score = 100;
    
    // Distance penalty (1 point per km, max 50 points)
    if (userDist !== Infinity) {
      score -= Math.min(userDist, 50);
    }
    
    // Quality & Activity (if we eventually populate these, they add points)
    score += (loc.profile_quality_score || 0) * 0.2;
    score += (loc.response_score || 0) * 0.1;
    score += (loc.activity_score || 0) * 0.1;

    // Plan boost (eligibility_score acts as a tiebreaker/boost)
    // Turbo = 0.05, Dominio = 0.10 -> Multiplied by 20 to give 1 to 2 points of boost
    score += (loc.eligibility_score || 0) * 20;
    
    return score;
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
    const badge = isExchange 
      ? { text: '🔄 Punto de intercambio', className: 'badge-exchange' } 
      : { text: '🛍 Tienda aliada', className: 'badge-store' }

    const typeMap = { store: 'Tienda', safe_point: 'Punto seguro', cafe: 'Café', kiosk: 'Kiosco', shopping: 'Shopping', plaza: 'Plaza' }
    const typeStr = loc.metadata?.display_type || typeMap[loc.type] || 'Lugar'
    
    const locParts = [loc.metadata?.zone || loc.metadata?.neighborhood, loc.metadata?.city || loc.metadata?.department].filter(Boolean)
    const locationStr = locParts.length > 0 ? locParts.join(' · ') : loc.address
    
    const defaultDesc = isExchange 
      ? 'Intercambiá figuritas en un lugar seguro.' 
      : 'Comprá figuritas y sobres.'
    const description = loc.metadata?.description || (isExchange && loc.type === 'store' ? 'Intercambiá y comprá figuritas.' : defaultDesc)

    const isTurbo = loc.business_plan === 'turbo';
    const isDominio = loc.business_plan === 'dominio';
    const premiumBadge = isDominio ? '🌟 Patrocinador de la Zona' : (isTurbo ? '⭐ Destacado' : null);

    return { badge, typeStr, locationStr, description, premiumBadge, isTurbo, isDominio }
  }

  const handleCercaMio = async () => {
    try {
      const coords = await getUserLocation(10000);
      setUserCoords(coords);
    } catch (err) {
      alert(err);
    }
  }

  return (
    <>
      <style>{`
        .puntos-page {
          max-width: 64rem;
          margin: 0 auto;
          padding: 1rem 1rem 5.5rem;
        }
        @media (min-width: 768px) {
          .puntos-page { padding: 2rem 1.5rem 2rem; }
        }

        .puntos-header {
          margin-bottom: 1.5rem;
        }
        .puntos-title {
          font-size: 1.75rem;
          font-weight: 900;
          letter-spacing: -0.03em;
          margin-bottom: 0.25rem;
        }
        .puntos-subtitle {
          font-size: 0.875rem;
          color: var(--color-text-muted);
          line-height: 1.4;
        }

        /* Top Filters */
        .location-filters {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.5rem;
          margin-bottom: 1rem;
        }
        .filter-select {
          width: 100%;
          padding: 0.625rem;
          border-radius: var(--radius-xl);
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          color: var(--color-text);
          font-size: 0.8125rem;
          font-weight: 600;
          outline: none;
          appearance: none;
          cursor: pointer;
        }
        .filter-select:focus {
          border-color: var(--color-brand-600);
        }
        
        @media (max-width: 640px) {
          .location-filters {
            grid-template-columns: 1fr;
          }
        }

        /* Search Bar */
        .search-bar-container {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1.25rem;
        }
        .search-input-wrapper {
          flex: 1;
          position: relative;
        }
        .search-input {
          width: 100%;
          padding: 0.75rem 1rem 0.75rem 2.5rem;
          border-radius: var(--radius-xl);
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          color: var(--color-text);
          font-size: 0.875rem;
          font-weight: 600;
        }
        .search-icon {
          position: absolute;
          left: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          color: var(--color-text-muted);
          font-size: 1.25rem;
        }
        .btn-cerca {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0 1rem;
          border-radius: var(--radius-xl);
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          color: var(--color-text);
          font-weight: 700;
          font-size: 0.8125rem;
          cursor: pointer;
          white-space: nowrap;
        }
        .btn-cerca:hover {
          background: var(--color-surface-hover);
        }

        /* Tabs */
        .puntos-tabs {
          display: flex;
          gap: 0.5rem;
          overflow-x: auto;
          padding-bottom: 0.5rem;
          margin-bottom: 1rem;
          scrollbar-width: none;
        }
        .puntos-tabs::-webkit-scrollbar { display: none; }
        
        .puntos-tab {
          padding: 0.5rem 1rem;
          border-radius: var(--radius-full);
          font-size: 0.8125rem;
          font-weight: 800;
          border: 1px solid var(--color-border-light);
          background: var(--color-surface);
          color: var(--color-text-secondary);
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s;
        }
        .puntos-tab.active {
          background: var(--color-brand-600);
          color: white;
          border-color: var(--color-brand-600);
        }

        /* Grid */
        .puntos-layout {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.5rem;
        }
        @media (min-width: 1024px) {
          .puntos-layout {
            grid-template-columns: 1fr 380px;
          }
        }

        .puntos-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        /* Card */
        .punto-card {
          background: var(--color-surface);
          border: 1px solid var(--color-border-light);
          border-radius: var(--radius-2xl);
          padding: 1.25rem;
          box-shadow: var(--shadow-sm);
          position: relative;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .punto-card.is-turbo {
          border-color: var(--color-brand-300);
          box-shadow: var(--shadow-md);
        }
        .dark .punto-card.is-turbo {
          border-color: var(--color-brand-700);
        }
        .punto-card.is-dominio {
          border: 2px solid var(--color-brand-500);
          box-shadow: 0 4px 20px rgba(249, 115, 22, 0.15);
        }
        
        .badge-premium {
          position: absolute;
          top: -10px;
          right: 1.25rem;
          background: var(--color-brand-500);
          color: white;
          padding: 0.25rem 0.75rem;
          border-radius: var(--radius-full);
          font-size: 0.6875rem;
          font-weight: 800;
          box-shadow: 0 2px 8px rgba(249, 115, 22, 0.3);
        }
        
        /* Line 1: Badge */
        .badge-exchange {
          display: inline-block;
          background: rgba(14, 165, 233, 0.15);
          color: #0ea5e9;
          padding: 0.25rem 0.5rem;
          border-radius: var(--radius-md);
          font-size: 0.6875rem;
          font-weight: 800;
          margin-bottom: 0.5rem;
        }
        .badge-store {
          display: inline-block;
          background: rgba(16, 185, 129, 0.15);
          color: #10b981;
          padding: 0.25rem 0.5rem;
          border-radius: var(--radius-md);
          font-size: 0.6875rem;
          font-weight: 800;
          margin-bottom: 0.5rem;
        }

        /* Line 2: Name */
        .punto-name {
          font-size: 1.125rem;
          font-weight: 900;
          line-height: 1.2;
          margin-bottom: 0.125rem;
        }
        
        /* Line 3: Type + Loc */
        .punto-loc {
          font-size: 0.8125rem;
          color: var(--color-text-muted);
          font-weight: 500;
          margin-bottom: 0.5rem;
        }
        
        /* Line 4: Desc */
        .punto-desc {
          font-size: 0.875rem;
          color: var(--color-text-secondary);
          margin-bottom: 0.75rem;
          line-height: 1.4;
        }

        /* Line 5: Meta */
        .punto-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }
        .meta-pill {
          background: var(--color-surface-alt);
          padding: 0.25rem 0.5rem;
          border-radius: var(--radius-sm);
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--color-text-secondary);
        }

        /* Line 6: Actions */
        .punto-actions {
          display: flex;
          gap: 0.5rem;
        }
        .action-btn {
          flex: 1;
          text-align: center;
          padding: 0.5rem;
          border-radius: var(--radius-lg);
          font-size: 0.8125rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }
        .action-btn-primary {
          background: var(--color-brand-600);
          color: white;
          border: none;
        }
        .action-btn-primary:hover {
          background: var(--color-brand-700);
        }
        .action-btn-secondary {
          background: var(--color-surface-hover);
          color: var(--color-text);
          border: 1px solid var(--color-border);
        }

        /* Map Container */
        .map-sticky-container {
          position: sticky;
          top: 6rem;
          background: var(--color-surface);
          border: 1px solid var(--color-border-light);
          border-radius: var(--radius-2xl);
          padding: 1rem;
          height: calc(100vh - 8rem);
          display: none;
          flex-direction: column;
        }
        @media (min-width: 1024px) {
          .map-sticky-container {
            display: flex;
          }
        }
        .map-iframe-wrapper {
          flex: 1;
          border-radius: var(--radius-xl);
          overflow: hidden;
          background: var(--color-surface-alt);
        }

        /* Mobile Map Button */
        .mobile-map-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          width: 100%;
          padding: 0.75rem;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-xl);
          font-weight: 800;
          color: var(--color-text);
          margin-bottom: 1rem;
          cursor: pointer;
        }
        @media (min-width: 1024px) {
          .mobile-map-btn {
            display: none;
          }
        }

        /* Bottom Blocks */
        .bottom-blocks {
          margin-top: 2rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .cta-card {
          background: #0f172a;
          color: white;
          border-radius: var(--radius-2xl);
          padding: 1.5rem;
          text-align: center;
        }
        .dark .cta-card {
          background: var(--color-surface);
          border: 1px solid var(--color-brand-600);
        }
        .cta-card h3 {
          font-size: 1.25rem;
          font-weight: 900;
          margin-bottom: 0.5rem;
        }
        .cta-card p {
          font-size: 0.875rem;
          opacity: 0.9;
          margin-bottom: 1rem;
          line-height: 1.4;
        }
        .safety-card {
          background: rgba(245, 158, 11, 0.1);
          border: 1px solid rgba(245, 158, 11, 0.25);
          border-radius: var(--radius-2xl);
          padding: 1rem 1.25rem;
          text-align: center;
        }
        .safety-card p {
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--color-warning);
          line-height: 1.4;
        }

        /* Modal for mobile map */
        .map-modal {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: var(--color-bg);
          z-index: 1000;
          display: flex;
          flex-direction: column;
        }
        .map-modal-header {
          padding: 1rem;
          background: var(--color-surface);
          border-bottom: 1px solid var(--color-border);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .map-modal-close {
          background: none;
          border: none;
          font-size: 1.5rem;
          color: var(--color-text);
          cursor: pointer;
        }
      `}</style>

      <div className="puntos-page">
        {/* Header */}
        <header className="puntos-header">
          <h1 className="puntos-title">Puntos</h1>
          <p className="puntos-subtitle">Encontrá lugares para intercambiar o comprar figuritas cerca tuyo.</p>
        </header>

        {/* Filters */}
        <div className="location-filters">
          <select className="filter-select" value={selectedCountry} onChange={e => setSelectedCountry(e.target.value)}>
            <option value="Todos">País</option>
            {countries.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className="filter-select" value={selectedDepartment} onChange={e => setSelectedDepartment(e.target.value)}>
            <option value="Todos">Departamento</option>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <select className="filter-select" value={selectedZone} onChange={e => setSelectedZone(e.target.value)}>
            <option value="Todos">Barrio / Zona</option>
            {zones.map(z => <option key={z} value={z}>{z}</option>)}
          </select>
        </div>

        {/* Search */}
        <div className="search-bar-container">
          <div className="search-input-wrapper">
            <span className="search-icon material-symbols-outlined">search</span>
            <input 
              type="text" 
              className="search-input" 
              placeholder="Buscar punto, tienda o zona..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button className="btn-cerca" onClick={handleCercaMio}>
            <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>my_location</span>
            Cerca mío
          </button>
        </div>

        {/* Tabs */}
        <div className="puntos-tabs">
          <button className={`puntos-tab ${tab === 'all' ? 'active' : ''}`} onClick={() => setTab('all')}>Todos</button>
          <button className={`puntos-tab ${tab === 'exchange' ? 'active' : ''}`} onClick={() => setTab('exchange')}>Puntos de intercambio</button>
          <button className={`puntos-tab ${tab === 'store' ? 'active' : ''}`} onClick={() => setTab('store')}>Tiendas aliadas</button>
        </div>

        <button className="mobile-map-btn" onClick={() => setShowMapModal(true)}>
          <span className="material-symbols-outlined">map</span>
          Ver mapa
        </button>

        {/* Layout Grid */}
        <div className="puntos-layout">
          {/* List */}
          <div className="puntos-list">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>Cargando puntos...</div>
            ) : sortedPoints.length === 0 ? (
              <div className="empty-state" style={{ padding: '3rem 1rem' }}>
                <span className="empty-state-icon">📍</span>
                <p className="empty-state-title">No hay resultados</p>
                <p className="empty-state-desc">No encontramos puntos para esta búsqueda o filtro.</p>
              </div>
            ) : (
              <>
                {promo && <SponsoredPointCard placement={promo} page="Stores" />}
                {sortedPoints.map(loc => {
                  const { badge, typeStr, locationStr, description, premiumBadge, isTurbo, isDominio } = getCardInfo(loc)
                  const meta = { ...loc.metadata }
                
                if (userCoords && loc.lat && loc.lng) {
                  const dist = calculateDistance(userCoords.lat, userCoords.lng, loc.lat, loc.lng)
                  meta.distance = dist < 1 ? `${Math.round(dist * 1000)} m` : `${dist.toFixed(1)} km`
                }

                return (
                  <article key={loc.id} className={`punto-card ${isTurbo ? 'is-turbo' : ''} ${isDominio ? 'is-dominio' : ''}`}>
                    {premiumBadge && <div className="badge-premium">{premiumBadge}</div>}
                    <span className={badge.className}>{badge.text}</span>
                    <h3 className="punto-name">{loc.name}</h3>
                    <p className="punto-loc">{typeStr} · {locationStr}</p>
                    <p className="punto-desc">{description}</p>
                    
                    <div className="punto-meta">
                      {meta.hours && <span className="meta-pill">🕒 {meta.hours}</span>}
                      {meta.whatsapp && <span className="meta-pill">📱 {meta.whatsapp}</span>}
                      {meta.distance && <span className="meta-pill">📍 {meta.distance}</span>}
                    </div>

                    <div className="punto-actions">
                      {meta.whatsapp && (
                        <button 
                          className="action-btn action-btn-primary"
                          onClick={() => window.open(`https://wa.me/${meta.whatsapp}`, '_blank')}
                        >
                          WhatsApp
                        </button>
                      )}
                      <button 
                        className="action-btn action-btn-secondary"
                        onClick={() => {
                          const dest = loc.address || loc.name;
                          window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dest)}`, '_blank')
                        }}
                      >
                        Cómo llegar
                      </button>
                      <button 
                        className="action-btn action-btn-secondary"
                        onClick={() => {
                          setSelectedLoc(loc)
                          if (window.innerWidth < 1024) {
                            setShowMapModal(true)
                          }
                        }}
                      >
                        Ver detalle
                      </button>
                    </div>
                  </article>
                )
              })}
              </>
            )}
          </div>

          {/* Sticky Map (Desktop) */}
          <div className="map-sticky-container">
            <h3 style={{ fontSize: '1.125rem', fontWeight: 900, marginBottom: '0.75rem' }}>
              {selectedLoc ? selectedLoc.name : 'Mapa'}
            </h3>
            <div className="map-iframe-wrapper">
              <iframe
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                src={selectedLoc 
                  ? `https://maps.google.com/maps?q=${encodeURIComponent(selectedLoc.address || selectedLoc.name)}&t=&z=15&ie=UTF8&iwloc=&output=embed`
                  : "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d104705.51677322987!2d-56.24131498668903!3d-34.82136054817173!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x959f80ffc63bf7d3%3A0x6b321b2e355cecb5!2sMontevideo%2C%20Departamento%20de%20Montevideo!5e0!3m2!1ses-419!2suy!4v1700000000000!5m2!1ses-419!2suy"
                }
              ></iframe>
            </div>
          </div>
        </div>

        {/* Bottom Commercial & Safety Blocks */}
        <div className="bottom-blocks">
          <div className="cta-card">
            <h3>¿Tenés un local?</h3>
            <p>Sumate como punto aliado y aparecé cuando alguien busque dónde cambiar o comprar figuritas.</p>
            <button className="btn btn-primary">Quiero aparecer</button>
          </div>
          
          <div className="safety-card">
            <p>Recomendamos realizar intercambios en lugares públicos.<br/>Si sos menor, andá acompañado por un adulto responsable.</p>
          </div>
        </div>
      </div>

      {/* Mobile Map Modal */}
      {showMapModal && (
        <div className="map-modal">
          <div className="map-modal-header">
            <h3 style={{ fontSize: '1.125rem', fontWeight: 900 }}>{selectedLoc ? selectedLoc.name : 'Mapa'}</h3>
            <button className="map-modal-close" onClick={() => setShowMapModal(false)}>×</button>
          </div>
          <div style={{ flex: 1 }}>
            <iframe
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              src={selectedLoc 
                ? `https://maps.google.com/maps?q=${encodeURIComponent(selectedLoc.address || selectedLoc.name)}&t=&z=15&ie=UTF8&iwloc=&output=embed`
                : "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d104705.51677322987!2d-56.24131498668903!3d-34.82136054817173!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x959f80ffc63bf7d3%3A0x6b321b2e355cecb5!2sMontevideo%2C%20Departamento%20de%20Montevideo!5e0!3m2!1ses-419!2suy!4v1700000000000!5m2!1ses-419!2suy"
              }
            ></iframe>
          </div>
        </div>
      )}
    </>
  )
}

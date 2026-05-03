import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { SponsoredPointCard } from '../components/sponsored/SponsoredComponents'
import { getUserLocation } from '../utils/location'
import { useAuthStore } from '../stores/authStore'
import { getBusinessBadges } from '../lib/ranking'
import BusinessApplyModal from '../components/BusinessApplyModal'
import PromoDetailModal, { getPromoStatus, PROMO_STATUS_CONFIG } from '../components/PromoDetailModal'

export default function Stores() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('all')
  const [search, setSearch] = useState('')
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedLoc, setSelectedLoc] = useState(null)
  const [showMapModal, setShowMapModal] = useState(false)
  const [showApplyModal, setShowApplyModal] = useState(false)
  const [applyType, setApplyType] = useState('store')
  const [promo, setPromo] = useState(null)
  const [bizBadges, setBizBadges] = useState({})
  const [locationPromos, setLocationPromos] = useState({})
  const [activePromoModal, setActivePromoModal] = useState(null)
  const [activePromoLocation, setActivePromoLocation] = useState(null)

  // Location filters
  const [selectedCountry, setSelectedCountry] = useState('Uruguay')
  const [selectedDepartment, setSelectedDepartment] = useState('Todos')
  const [selectedZone, setSelectedZone] = useState('Todos')
  const { profile } = useAuthStore()
  const [userCoords, setUserCoords] = useState(profile?.lat ? { lat: profile.lat, lng: profile.lng } : null)

  // Sync with profile if it changes (e.g. from GPS watch)
  useEffect(() => {
    if (profile?.lat && profile?.lng) {
      setUserCoords({ lat: profile.lat, lng: profile.lng })
    }
  }, [profile?.lat, profile?.lng])

  useEffect(() => {
    const fetchLocations = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('locations')
        .select('*, location_images(*)')
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
    // Fetch business ranking badges
    const fetchBizBadges = async () => {
      const { data } = await supabase.from('business_rankings').select('location_id, badges')
      if (data) {
        const map = {}
        data.forEach(r => { map[r.location_id] = r.badges || [] })
        setBizBadges(map)
      }
    }
    fetchBizBadges()
    // Fetch promos for all locations (MVP)
    const fetchLocationPromos = async () => {
      const { data } = await supabase
        .from('sponsored_placements')
        .select('*')
        .eq('is_active', true)
        .not('location_id', 'is', null)
      if (data) {
        const map = {}
        data.forEach(p => {
          if (!map[p.location_id]) map[p.location_id] = []
          map[p.location_id].push(p)
        })
        setLocationPromos(map)
      }
    }
    fetchLocationPromos()
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
  const zones = [...new Set(actualPoints.map(p => p.neighborhood || p.metadata?.zone || p.metadata?.neighborhood).filter(Boolean))].sort()

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
    if (tab === 'featured') return loc.business_plan === 'turbo' || loc.business_plan === 'dominio'
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
       const country = loc.country || loc.metadata?.country;
       if (country && country !== selectedCountry) return false
    }
    if (selectedDepartment !== 'Todos') {
       const dept = loc.department || loc.metadata?.department;
       if (dept && dept !== selectedDepartment) return false
       if (!dept && loc.address && !loc.address.includes(selectedDepartment)) return false
    }
    if (selectedZone !== 'Todos') {
       const zone = loc.neighborhood || loc.metadata?.zone || loc.metadata?.neighborhood;
       const hasZone = (loc.address || '').toLowerCase().includes(selectedZone.toLowerCase()) || 
                       (zone || '').toLowerCase() === selectedZone.toLowerCase()
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
    const locationStr = locParts.length > 0 ? locParts.join(' · ') : loc.address
    
    const defaultDesc = isExchange 
      ? 'Intercambiá figuritas en un lugar seguro.' 
      : 'Comprá figuritas y sobres.'
    const description = loc.description || loc.metadata?.description || (isExchange && loc.type === 'store' ? 'Intercambiá y comprá figuritas.' : defaultDesc)

    const isTurbo = loc.business_plan === 'turbo';
    const isDominio = loc.business_plan === 'dominio';
    const premiumBadge = isDominio ? 'Patrocinador de la Zona' : (isTurbo ? 'Destacado' : null);

    return { badge, typeStr, locationStr, description, premiumBadge, isTurbo, isDominio }
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
      alert(err);
    }
  }

  const activePointsCount = actualPoints.length;
  const alliedStoresCount = actualPoints.filter(l => !permitsExchange(l)).length;
  const safePointsCount = actualPoints.filter(l => l.type === 'safe_point' || l.type === 'safe_exchange_zone').length;

  return (
    <div className="stores-final-root">
      <style>{`
        .stores-final-root {
          --bg: #0b0b0b;
          --panel: #121212;
          --panel2: #181818;
          --panel3: #202020;
          --line: rgba(255,255,255,.08);
          --line2: rgba(255,255,255,.14);
          --text: #f5f5f5;
          --muted: rgba(245,245,245,.54);
          --muted2: rgba(245,245,245,.34);
          --orange: #ff5a00;
          --orange2: #cc4800;
          --green: #22c55e;
          --blue: #38bdf8;
          --yellow: #facc15;
          --red: #ef4444;
          
          font-family: Barlow, sans-serif;
          background: var(--bg);
          color: var(--text);
          min-height: 100vh;
        }

        .stores-final-root button,
        .stores-final-root input,
        .stores-final-root select {
          font-family: inherit;
        }

        .sf-topbar{
          min-height:82px;
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:18px;
          padding:14px 22px;
          border-bottom:1px solid var(--line);
          background:#0b0b0b;
          position:sticky;
          top:0;
          z-index:30;
        }
        .sf-top-kicker{font:900 .72rem 'Barlow Condensed';letter-spacing:.16em;text-transform:uppercase;color:var(--orange)}
        .sf-top-title{font:italic 900 2.45rem 'Barlow Condensed';text-transform:uppercase;line-height:.9;margin-top:3px}
        .sf-top-actions{display:flex;gap:10px;align-items:center}
        .sf-btn{border:1px solid var(--line2);background:transparent;color:#fff;padding:.85rem 1.15rem;font:900 .88rem 'Barlow Condensed';letter-spacing:.08em;text-transform:uppercase;cursor:pointer}
        .sf-btn:hover{border-color:var(--orange);color:var(--orange)}
        .sf-btn.sf-orange{background:var(--orange);border-color:var(--orange);color:#fff}
        .sf-btn.sf-orange:hover{background:var(--orange2);border-color:var(--orange2)}
        .sf-btn.sf-block{width:100%}

        .sf-wrap{max-width:1480px;margin:0 auto;padding:28px 22px 72px}

        .sf-hero{
          display:grid;
          grid-template-columns:1.1fr .9fr;
          gap:22px;
          margin-bottom:22px;
        }
        .sf-hero-card{
          background:linear-gradient(135deg,#181818 0%,#101010 52%,rgba(255,90,0,.18) 100%);
          border:1px solid var(--line);
          padding:30px;
          position:relative;
          overflow:hidden;
          min-height:270px;
          display:flex;
          flex-direction:column;
          justify-content:space-between;
        }
        .sf-hero-card:before{content:'PUNTOS';position:absolute;right:20px;top:-18px;font:italic 900 8rem 'Barlow Condensed';color:rgba(255,255,255,.035);line-height:1}
        .sf-kicker{font:900 .72rem 'Barlow Condensed';letter-spacing:.16em;text-transform:uppercase;color:var(--orange)}
        .sf-hero-title{font:italic 900 clamp(3rem,6vw,5.5rem) 'Barlow Condensed';line-height:.88;text-transform:uppercase;max-width:720px;position:relative;z-index:1;margin-top:8px}
        .sf-hero-title span{color:var(--orange)}
        .sf-hero-sub{color:var(--muted);font-size:1rem;line-height:1.6;max-width:560px;margin-top:14px;position:relative;z-index:1}
        .sf-hero-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:var(--line);margin-top:28px;position:relative;z-index:1}
        .sf-hero-stat{background:rgba(18,18,18,.9);padding:18px}
        .sf-hero-stat b{display:block;font:italic 900 2.4rem 'Barlow Condensed';line-height:.9}
        .sf-hero-stat span{font:900 .72rem 'Barlow Condensed';letter-spacing:.08em;text-transform:uppercase;color:var(--muted2)}
        .sf-hero-stat.sf-orange b{color:var(--orange)}
        .sf-hero-stat.sf-green b{color:var(--green)}
        .sf-hero-stat.sf-blue b{color:var(--blue)}

        .sf-hero-map-card{background:var(--panel);border:1px solid var(--line);padding:16px;display:grid;grid-template-rows:auto 1fr;min-height:270px}
        .sf-map-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;gap:14px}
        .sf-map-title{font:italic 900 1.8rem 'Barlow Condensed';text-transform:uppercase;line-height:.9}
        .sf-map-mini{font-size:.82rem;color:var(--muted)}
        
        .sf-filters-panel{background:var(--panel);border:1px solid var(--line);margin-bottom:22px;overflow:hidden}
        .sf-filters-top{display:grid;grid-template-columns:repeat(3,1fr) 1.4fr auto;gap:1px;background:var(--line);border-bottom:1px solid var(--line)}
        .sf-field{background:var(--panel2);padding:13px}
        .sf-field label{display:block;font:900 .62rem 'Barlow Condensed';letter-spacing:.14em;text-transform:uppercase;color:var(--muted2);margin-bottom:6px}
        .sf-field select,.sf-field input{width:100%;height:38px;background:#0b0b0b;border:1px solid var(--line2);color:#fff;padding:0 10px;font-weight:700;outline:none}
        .sf-field input:focus,.sf-field select:focus{border-color:var(--orange)}
        .sf-near-field{display:flex;align-items:end;background:var(--panel2);padding:13px}
        .sf-near-field .sf-btn{height:38px;padding:.55rem 1rem;white-space:nowrap}
        .sf-tabs{display:flex;gap:1px;background:var(--line);overflow:auto;scrollbar-width:none}
        .sf-tabs::-webkit-scrollbar{display:none}
        .sf-tab{border:0;background:var(--panel);color:var(--muted);padding:13px 18px;font:900 .82rem 'Barlow Condensed';letter-spacing:.08em;text-transform:uppercase;white-space:nowrap;cursor:pointer}
        .sf-tab.sf-active{background:var(--orange);color:#fff}
        .sf-tab:hover{color:#fff}

        .sf-layout{display:grid;grid-template-columns:1fr 420px;gap:22px;align-items:start}
        .sf-list{display:grid;gap:14px}
        .sf-section-title{display:flex;justify-content:space-between;align-items:end;gap:14px;margin-bottom:10px}
        .sf-section-title h2{font:italic 900 2.35rem 'Barlow Condensed';text-transform:uppercase;line-height:.9}
        .sf-section-title p{color:var(--muted);font-size:.92rem;margin-top:5px}
        .sf-count-pill{border:1px solid var(--line2);padding:7px 10px;font:900 .75rem 'Barlow Condensed';letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}

        .sf-point-card{background:var(--panel);border:1px solid var(--line);display:grid;grid-template-columns:96px 1fr auto;gap:0;position:relative;overflow:hidden;transition:.18s;cursor:pointer}
        .sf-point-card:hover{border-color:rgba(255,90,0,.5);transform:translateY(-2px)}
        .sf-point-card.sf-dominio{border:2px solid var(--orange);box-shadow:0 18px 44px rgba(255,90,0,.14)}
        .sf-point-card.sf-turbo{border-color:rgba(255,90,0,.45)}
        .sf-premium-ribbon{position:absolute;top:0;right:0;background:var(--orange);padding:5px 10px;font:900 .64rem 'Barlow Condensed';letter-spacing:.1em;text-transform:uppercase;z-index:3}
        .sf-point-icon{background:#0d0d0d;border-right:1px solid var(--line);display:grid;place-items:center;text-align:center;padding:10px}
        .sf-icon-box{width:58px;height:58px;display:grid;place-items:center;background:rgba(255,90,0,.12);border:1px solid rgba(255,90,0,.28);font-size:1.5rem}
        .sf-point-card.sf-exchange .sf-icon-box{background:rgba(56,189,248,.1);border-color:rgba(56,189,248,.28)}
        .sf-point-card.sf-store .sf-icon-box{background:rgba(34,197,94,.1);border-color:rgba(34,197,94,.28)}
        .sf-point-body{padding:16px 18px}
        .sf-badges{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px}
        .sf-badge{border:1px solid var(--line2);background:#0b0b0b;padding:4px 7px;font:900 .62rem 'Barlow Condensed';letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}
        .sf-badge.sf-exchange{color:var(--blue);border-color:rgba(56,189,248,.3);background:rgba(56,189,248,.08)}
        .sf-badge.sf-store{color:var(--green);border-color:rgba(34,197,94,.3);background:rgba(34,197,94,.08)}
        .sf-badge.sf-orange{color:var(--orange);border-color:rgba(255,90,0,.35);background:rgba(255,90,0,.09)}
        .sf-point-name{font:italic 900 1.85rem 'Barlow Condensed';text-transform:uppercase;line-height:.9;margin-bottom:6px}
        .sf-point-loc{font-size:.86rem;color:var(--muted);font-weight:600;margin-bottom:6px}
        .sf-point-address{display:flex;gap:7px;align-items:flex-start;color:rgba(245,245,245,.72);font-size:.84rem;font-weight:700;margin-bottom:8px;line-height:1.35}
        .sf-point-address span{color:var(--orange);font-size:.9rem}
        .sf-promo-box{margin-top:12px;border:1px solid rgba(255,90,0,.28);background:rgba(255,90,0,.08);padding:10px 12px;display:flex;justify-content:space-between;gap:12px;align-items:center}
        .sf-promo-box b{font:900 .78rem 'Barlow Condensed';letter-spacing:.08em;text-transform:uppercase;color:var(--orange)}
        .sf-promo-box p{font-size:.78rem;color:var(--muted);margin-top:2px}
        .sf-promo-link{border:1px solid rgba(255,90,0,.45);background:#0b0b0b;color:#fff;padding:7px 10px;font:900 .68rem 'Barlow Condensed';letter-spacing:.08em;text-transform:uppercase;white-space:nowrap;cursor:pointer}
        .sf-promo-link:hover{background:var(--orange);border-color:var(--orange)}
        .sf-point-desc{font-size:.9rem;color:var(--muted);line-height:1.45;max-width:680px}
        .sf-meta-row{display:flex;gap:7px;flex-wrap:wrap;margin-top:12px}
        .sf-meta{background:#0b0b0b;border:1px solid var(--line);padding:5px 8px;font-size:.76rem;color:var(--muted);font-weight:700}
        .sf-meta.sf-distance{color:var(--orange)}
        .sf-point-actions{display:grid;gap:1px;background:var(--line);min-width:150px}
        .sf-action{border:0;background:var(--panel2);color:#fff;padding:0 16px;font:900 .78rem 'Barlow Condensed';letter-spacing:.08em;text-transform:uppercase;cursor:pointer; display:flex; align-items:center; justify-content:center; text-align:center;}
        .sf-action.sf-primary{background:var(--orange)}
        .sf-action:hover{filter:brightness(1.12)}
        .sf-point-gallery{display:flex;gap:6px;margin-top:12px;overflow-x:auto;padding-bottom:4px;scrollbar-width:none}
        .sf-point-gallery::-webkit-scrollbar{display:none}
        .sf-gallery-img{width:80px;height:60px;object-fit:cover;border:1px solid var(--line);border-radius:2px;background:#0d0d0d}

        .sf-map-side{position:sticky;top:104px;display:grid;gap:14px}
        .sf-map-card{background:var(--panel);border:1px solid var(--line);padding:16px}
        .sf-map-card h3{font:italic 900 1.9rem 'Barlow Condensed';text-transform:uppercase;line-height:.9;margin-bottom:12px}
        .sf-map-frame{height:360px;background:#0f0f0f;border:1px solid var(--line);position:relative;overflow:hidden}
        .sf-map-frame iframe,.sf-hero-google-map iframe{width:100%;height:100%;border:0;display:block}
        .sf-hero-google-map{height:190px;border:1px solid var(--line);overflow:hidden;background:#0f0f0f}
        .sf-map-selected{padding:14px;background:#0b0b0b;border:1px solid var(--line);margin-top:12px}
        .sf-map-selected b{display:block;font:italic 900 1.4rem 'Barlow Condensed';text-transform:uppercase}
        .sf-map-selected span{display:block;color:var(--muted);font-size:.82rem;margin-top:4px}
        .sf-cta-card{background:linear-gradient(135deg,var(--orange),#c2410c);border:1px solid var(--orange2);padding:22px;color:#fff}
        .sf-cta-card h3{font:italic 900 2.2rem 'Barlow Condensed';line-height:.9;text-transform:uppercase}
        .sf-cta-card p{color:rgba(255,255,255,.82);line-height:1.5;margin:9px 0 16px}
        .sf-cta-card .sf-btn{background:#0b0b0b;border-color:#0b0b0b;color:#fff}
        .sf-safety{background:rgba(250,204,21,.08);border:1px solid rgba(250,204,21,.22);padding:16px;color:#facc15;font-size:.86rem;line-height:1.5}

        .sf-empty{background:var(--panel);border:1px solid var(--line);padding:42px;text-align:center}
        .sf-empty h3{font:italic 900 2rem 'Barlow Condensed';text-transform:uppercase}
        .sf-empty p{color:var(--muted);margin:8px 0 18px}

        @media(max-width:1180px){.sf-hero,.sf-layout{grid-template-columns:1fr}.sf-map-side{position:static}.sf-filters-top{grid-template-columns:1fr 1fr}.sf-near-field{grid-column:1/-1}.sf-point-card{grid-template-columns:80px 1fr}.sf-point-actions{grid-column:1/-1;grid-template-columns:repeat(3,1fr);min-height:44px}.sf-hero-map-card{display:none}}
        @media(max-width:720px){.sf-wrap{padding:16px 12px 64px}.sf-topbar{align-items:flex-start}.sf-top-actions{display:none}.sf-top-title{font-size:2rem}.sf-hero-card{padding:22px}.sf-hero-stats{grid-template-columns:1fr}.sf-filters-top{grid-template-columns:1fr}.sf-tabs{width:100%}.sf-point-card{grid-template-columns:1fr}.sf-point-icon{display:none}.sf-point-actions{grid-template-columns:1fr}.sf-section-title{display:block}.sf-count-pill{display:inline-block;margin-top:10px}.sf-map-side{display:none}}
      `}</style>

      <header className="sf-topbar">
        <div>
          <div className="sf-top-kicker">Puntos y negocios</div>
          <div className="sf-top-title">Tiendas / Puntos</div>
        </div>
        <div className="sf-top-actions">
          <button className="sf-btn" onClick={() => {
            if (window.innerWidth < 1180) {
               setShowMapModal(true)
            } else {
               window.scrollTo({ top: document.querySelector('.sf-map-side')?.offsetTop, behavior: 'smooth' })
            }
          }}>Ver mapa</button>
          <button className="sf-btn sf-orange" onClick={() => {
            setApplyType('store')
            setShowApplyModal(true)
          }}>Sumar mi local</button>
        </div>
      </header>

      <main className="sf-wrap">
        <section className="sf-hero">
          <div className="sf-hero-card">
            <div>
              <div className="sf-kicker">// Mapa de intercambios</div>
              <h1 className="sf-hero-title">Encontrá dónde <span>intercambiar</span> o comprar cerca.</h1>
              <p className="sf-hero-sub">Tiendas aliadas, puntos seguros y zonas recomendadas para hacer tus cruces de figuritas con más confianza.</p>
            </div>
            <div className="sf-hero-stats">
              <div className="sf-hero-stat sf-orange"><b>{activePointsCount}</b><span>Puntos activos</span></div>
              <div className="sf-hero-stat sf-green"><b>{alliedStoresCount}</b><span>Tiendas aliadas</span></div>
              <div className="sf-hero-stat sf-blue"><b>{safePointsCount}</b><span>Puntos seguros</span></div>
            </div>
          </div>

          <aside className="sf-hero-map-card">
            <div className="sf-map-head">
              <div>
                <div className="sf-map-title">Montevideo</div>
                <div className="sf-map-mini">Puntos cercanos y zonas sugeridas</div>
              </div>
              <button className="sf-btn sf-orange" onClick={handleCercaMio}>Cerca mío</button>
            </div>
            <div className="sf-hero-google-map">
              <iframe 
                loading="lazy" 
                allowFullScreen 
                referrerPolicy="no-referrer-when-downgrade" 
                src="https://maps.google.com/maps?q=Montevideo%2C%20Uruguay&t=&z=12&ie=UTF8&iwloc=&output=embed">
              </iframe>
            </div>
          </aside>
        </section>

        <section className="sf-filters-panel">
          <div className="sf-filters-top">
            <div className="sf-field">
              <label>País</label>
              <select value={selectedCountry} onChange={e => setSelectedCountry(e.target.value)}>
                <option value="Todos">País</option>
                {countries.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="sf-field">
              <label>Departamento</label>
              <select value={selectedDepartment} onChange={e => setSelectedDepartment(e.target.value)}>
                <option value="Todos">Departamento</option>
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="sf-field">
              <label>Barrio / Zona</label>
              <select value={selectedZone} onChange={e => setSelectedZone(e.target.value)}>
                <option value="Todos">Barrio / Zona</option>
                {zones.map(z => <option key={z} value={z}>{z}</option>)}
              </select>
            </div>
            <div className="sf-field">
              <label>Buscar</label>
              <input 
                placeholder="Buscar tienda, punto o zona..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="sf-near-field">
              <button className="sf-btn sf-orange" onClick={handleCercaMio}>📍 Cerca mío</button>
            </div>
          </div>
          <div className="sf-tabs">
            <button className={`sf-tab ${tab === 'all' ? 'sf-active' : ''}`} onClick={() => setTab('all')}>Todos</button>
            <button className={`sf-tab ${tab === 'exchange' ? 'sf-active' : ''}`} onClick={() => setTab('exchange')}>Puntos de intercambio</button>
            <button className={`sf-tab ${tab === 'store' ? 'sf-active' : ''}`} onClick={() => setTab('store')}>Tiendas aliadas</button>
            <button className={`sf-tab ${tab === 'featured' ? 'sf-active' : ''}`} onClick={() => setTab('featured')}>Destacados</button>
          </div>
        </section>

        <section className="sf-layout">
          <div>
            <div className="sf-section-title">
              <div>
                <div className="sf-kicker">Resultados ordenados</div>
                <h2>Lugares útiles para tus cruces</h2>
                <p>Priorizamos cercanía, calidad, plan del negocio y utilidad real.</p>
              </div>
              <span className="sf-count-pill">{sortedPoints.length} resultados</span>
            </div>

            <div className="sf-list">
              {loading ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)' }}>Cargando puntos...</div>
              ) : sortedPoints.length === 0 ? (
                <div className="sf-empty">
                  <h3>No hay resultados</h3>
                  <p>No encontramos puntos para esta búsqueda o filtro.</p>
                  
                  {(!profile || profile.business_status !== 'approved') && (
                    <div style={{ marginTop: '20px' }}>
                      <button className="sf-btn sf-orange" onClick={() => {
                        setApplyType('suggested')
                        setShowApplyModal(true)
                      }}>
                        Proponer un lugar
                      </button>
                    </div>
                  )}
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

                    const isExchange = permitsExchange(loc)
                    const cardTypeClass = isExchange ? 'sf-exchange' : 'sf-store'
                    const cardDominioClass = isDominio ? 'sf-dominio' : ''
                    const cardTurboClass = isTurbo ? 'sf-turbo' : ''

                    const iconStr = isExchange ? (loc.type === 'cafe' ? 'local_cafe' : 'sync_alt') : 'storefront'

                    // MVP promos from sponsored_placements
                    const locPromos = (locationPromos[loc.id] || []).filter(p => {
                      const status = getPromoStatus(p)
                      return status === 'activa' || status === 'proximamente'
                    })
                    const topPromo = locPromos[0] || null

                    // Fallback to legacy metadata promos
                    const legacyPromoTitle = !topPromo ? (meta.promo_title || (meta.promo ? 'Promo activa' : null)) : null;
                    const legacyPromoDesc = !topPromo ? (meta.promo_text || meta.promo) : null;

                    return (
                      <article 
                        key={loc.id} 
                        className={`sf-point-card ${cardTypeClass} ${cardDominioClass} ${cardTurboClass}`}
                        onClick={() => {
                          setSelectedLoc(loc)
                          if (window.innerWidth < 1180) {
                            setShowMapModal(true)
                          } else {
                            window.scrollTo({ top: document.querySelector('.sf-map-side')?.offsetTop, behavior: 'smooth' })
                          }
                        }}
                      >
                        {premiumBadge && <div className="sf-premium-ribbon">{premiumBadge}</div>}
                        
                        <div className="sf-point-icon">
                          <div className="sf-icon-box">
                            <span className="material-symbols-outlined">{iconStr}</span>
                          </div>
                        </div>

                        <div className="sf-point-body">
                          <div className="sf-badges">
                            {isExchange ? <span className="sf-badge sf-exchange">Punto de intercambio</span> : <span className="sf-badge sf-store">Tienda aliada</span>}
                            {isDominio && <span className="sf-badge sf-orange">Dominio</span>}
                            {isTurbo && !isDominio && <span className="sf-badge sf-orange">Turbo</span>}
                            {loc.is_active && <span className="sf-badge">Abierto</span>}
                          </div>
                          
                          <h3 className="sf-point-name">{loc.name || 'Punto sin nombre'}</h3>
                          <p className="sf-point-loc">{typeStr} · {locationStr}</p>
                          <div className="sf-point-address">
                            <span className="material-symbols-outlined" style={{fontSize: '1.2rem', marginTop: '-2px', color: 'var(--red)'}}>location_on</span> {loc.address || 'Dirección no disponible'}
                          </div>
                          <p className="sf-point-desc">{description}</p>
                          
                          <div className="sf-meta-row">
                            {meta.hours && <span className="sf-meta" style={{display: 'flex', alignItems: 'center', gap: '4px'}}><span className="material-symbols-outlined" style={{fontSize: '1rem'}}>schedule</span>{meta.hours}</span>}
                            {meta.whatsapp && <span className="sf-meta" style={{display: 'flex', alignItems: 'center', gap: '4px'}}><span className="material-symbols-outlined" style={{fontSize: '1rem'}}>chat</span>WhatsApp</span>}
                            {meta.distance && <span className="sf-meta sf-distance" style={{display: 'flex', alignItems: 'center', gap: '4px'}}><span className="material-symbols-outlined" style={{fontSize: '1rem'}}>near_me</span>{meta.distance}</span>}
                          </div>

                          {/* MVP Promo Card */}
                          {topPromo && (() => {
                            const promoStatus = getPromoStatus(topPromo)
                            const statusCfg = PROMO_STATUS_CONFIG[promoStatus]
                            return (
                              <div className="sf-promo-box" style={{ cursor: 'pointer' }} onClick={(e) => {
                                e.stopPropagation()
                                setActivePromoModal(topPromo)
                                setActivePromoLocation(loc)
                              }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                                    <b>{topPromo.title}</b>
                                    <span style={{
                                      display: 'inline-flex', alignItems: 'center', gap: '3px',
                                      padding: '2px 6px', fontSize: '.62rem',
                                      fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900,
                                      letterSpacing: '.08em', textTransform: 'uppercase',
                                      color: statusCfg.color, background: statusCfg.bg,
                                      border: `1px solid ${statusCfg.border}`
                                    }}>
                                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: statusCfg.color }} />
                                      {statusCfg.label}
                                    </span>
                                  </div>
                                  {topPromo.condition_text && <p style={{ color: 'rgba(245,245,245,.7)', fontSize: '.78rem', margin: 0 }}>{topPromo.condition_text}</p>}
                                </div>
                                <button className="sf-promo-link" onClick={(e) => {
                                  e.stopPropagation()
                                  setActivePromoModal(topPromo)
                                  setActivePromoLocation(loc)
                                }}>Ver promo</button>
                              </div>
                            )
                          })()}

                          {/* Legacy metadata promos (fallback) */}
                          {!topPromo && (legacyPromoTitle || legacyPromoDesc) && (
                            <div className="sf-promo-box">
                              <div>
                                <b>{legacyPromoTitle}</b>
                                {legacyPromoDesc && <p>{legacyPromoDesc}</p>}
                              </div>
                              <button className="sf-promo-link" onClick={(e) => {
                                e.stopPropagation();
                                if (meta.whatsapp) {
                                  window.open(`https://wa.me/${meta.whatsapp}?text=Hola,%20vi%20la%20promo%20en%20FigusUY!`, '_blank')
                                } else {
                                  setSelectedLoc(loc)
                                  if (window.innerWidth < 1180) setShowMapModal(true)
                                }
                              }}>Ver promo</button>
                            </div>
                          )}

                          {loc.business_plan === 'legend' && (
                            <div style={{ marginTop: '12px', background: 'linear-gradient(135deg, rgba(255,90,0,.15), rgba(250,204,21,.1))', border: '1px solid rgba(255,90,0,.3)', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '1.2rem' }}>🎁</span>
                              <div>
                                <div style={{ font: "900 .78rem 'Barlow Condensed'", letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--orange)' }}>Beneficio PartnerStore</div>
                                <div style={{ fontSize: '.85rem', fontWeight: 600 }}>{meta.partner_benefit_title || '10% OFF en sobres'}</div>
                                <div style={{ fontSize: '.78rem', color: 'var(--muted)', marginTop: '2px' }}>{meta.partner_benefit_desc || 'Válido al validar tu álbum completado.'}</div>
                              </div>
                            </div>
                          )}
                          
                          {bizBadges[loc.id]?.length > 0 && (
                            <div style={{ display: 'flex', gap: '6px', marginTop: '12px', flexWrap: 'wrap' }}>
                              {getBusinessBadges(bizBadges[loc.id]).map(b => (
                                <span key={b.label} className="sf-badge" style={{ borderColor: b.bg, color: b.color }}>
                                  {b.emoji} {b.label}
                                </span>
                              ))}
                            </div>
                          )}

                          {loc.location_images && loc.location_images.length > 0 && (
                            <div className="sf-point-gallery">
                              {loc.location_images.map(img => (
                                <img key={img.id} src={img.image_url} alt="Foto del local" className="sf-gallery-img" />
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="sf-point-actions">
                          {meta.whatsapp ? (
                            <button className="sf-action sf-primary" onClick={(e) => {
                              e.stopPropagation();
                              window.open(`https://wa.me/${meta.whatsapp}`, '_blank');
                            }}>
                              WhatsApp
                            </button>
                          ) : (
                            <button className="sf-action sf-primary" onClick={(e) => {
                              e.stopPropagation();
                              setSelectedLoc(loc);
                              if (window.innerWidth < 1180) setShowMapModal(true);
                            }}>
                              Ver mapa
                            </button>
                          )}
                          <button className="sf-action" onClick={(e) => {
                            e.stopPropagation();
                            const dest = loc.address || loc.name;
                            window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dest)}`, '_blank');
                          }}>
                            Cómo llegar
                          </button>
                          <button className="sf-action" onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLoc(loc);
                            if (window.innerWidth < 1180) {
                              setShowMapModal(true);
                            } else {
                              window.scrollTo({ top: document.querySelector('.sf-map-side')?.offsetTop, behavior: 'smooth' });
                            }
                          }}>
                            Detalle
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
              <h3>Mapa</h3>
              <div className="sf-map-frame">
                <iframe
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                  src={selectedLoc 
                    ? `https://maps.google.com/maps?q=${selectedLoc.lat && selectedLoc.lng ? `${selectedLoc.lat},${selectedLoc.lng}` : encodeURIComponent((selectedLoc.address || '') + ' ' + (selectedLoc.name || ''))}&t=&z=15&ie=UTF8&iwloc=&output=embed`
                    : "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d104705.51677322987!2d-56.24131498668903!3d-34.82136054817173!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x959f80ffc63bf7d3%3A0x6b321b2e355cecb5!2sMontevideo%2C%20Departamento%20de%20Montevideo!5e0!3m2!1ses-419!2suy!4v1700000000000!5m2!1ses-419!2suy"
                  }
                ></iframe>
              </div>
              {selectedLoc && (() => {
                let distStr = null;
                if (userCoords && selectedLoc.lat && selectedLoc.lng) {
                  const d = calculateDistance(userCoords.lat, userCoords.lng, selectedLoc.lat, selectedLoc.lng);
                  distStr = d < 1 ? `${Math.round(d * 1000)} m` : `${d.toFixed(1)} km`;
                }
                const isExch = permitsExchange(selectedLoc);
                return (
                  <div className="sf-map-selected">
                    <b>{selectedLoc.name}</b>
                    <span>
                      {selectedLoc.address} 
                      {distStr && ` · ${distStr}`}
                      {` · ${isExch ? 'Punto de intercambio' : 'Tienda aliada'}`}
                    </span>
                  </div>
                )
              })()}
            </section>

            {profile?.business_status === 'approved' ? null : profile?.business_status === 'pending' ? (
              <section className="sf-cta-card">
                <h3>Tu solicitud está en revisión</h3>
                <p>Estamos validando los datos de tu local. Te avisaremos pronto.</p>
                <button className="sf-btn sf-block" onClick={() => navigate('/business/pending')}>Ver estado</button>
              </section>
            ) : (
              <section className="sf-cta-card">
                <h3>¿Tenés un local?</h3>
                <p>Aparecé en FigusUY y hacé que más coleccionistas encuentren tu espacio.</p>
                <button className="sf-btn sf-block" onClick={() => {
                  setApplyType('store')
                  setShowApplyModal(true)
                }}>Sumar mi local</button>
              </section>
            )}

            <section className="sf-safety">
              Recomendamos hacer intercambios en lugares públicos. Si sos menor, andá acompañado por un adulto responsable.
            </section>
          </aside>
        </section>
      </main>

      {/* Mobile Map Modal */}
      {showMapModal && (
        <div className="sf-stores-modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'var(--bg)', zIndex: 1000, display: 'flex', flexDirection: 'column'
        }}>
          <div style={{
            padding: '1rem', background: 'var(--panel)', borderBottom: '1px solid var(--line)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 900, fontFamily: "'Barlow Condensed', sans-serif", textTransform: 'uppercase', margin: 0 }}>
              {selectedLoc ? selectedLoc.name : 'Mapa'}
            </h3>
            <button style={{
              background: 'none', border: 'none', fontSize: '2.5rem', color: 'var(--text)', cursor: 'pointer', lineHeight: 0.5, padding: '0 0.5rem'
            }} onClick={() => setShowMapModal(false)}>×</button>
          </div>
          <div style={{ flex: 1, position: 'relative' }}>
            <iframe
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              src={selectedLoc 
                ? `https://maps.google.com/maps?q=${selectedLoc.lat && selectedLoc.lng ? `${selectedLoc.lat},${selectedLoc.lng}` : encodeURIComponent((selectedLoc.address || '') + ' ' + (selectedLoc.name || ''))}&t=&z=15&ie=UTF8&iwloc=&output=embed`
                : "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d104705.51677322987!2d-56.24131498668903!3d-34.82136054817173!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x959f80ffc63bf7d3%3A0x6b321b2e355cecb5!2sMontevideo%2C%20Departamento%20de%20Montevideo!5e0!3m2!1ses-419!2suy!4v1700000000000!5m2!1ses-419!2suy"
              }
            ></iframe>
          </div>
        </div>
      )}

      <BusinessApplyModal 
        isOpen={showApplyModal} 
        onClose={() => setShowApplyModal(false)} 
        initialType={applyType}
      />

      {/* MVP Promo Detail Modal */}
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
              window.scrollTo({ top: document.querySelector('.sf-map-side')?.offsetTop, behavior: 'smooth' })
            }
          }}
        />
      )}
    </div>
  )
}


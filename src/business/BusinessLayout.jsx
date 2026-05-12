"use client"

import React, { useEffect, useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'

export const dynamic = "force-dynamic"
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import { getBusinessPlanLabel } from '../lib/businessPlans'

export default function BusinessLayout() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [location, setLocation] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.id) {
      fetchLocation()
    }
  }, [user?.id])

  const fetchLocation = async () => {
    // Only show loading shell on initial load, not on background refreshes
    if (!location) setLoading(true)
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .eq('owner_user_id', user.id)
      .maybeSingle()

    if (error) {
      console.warn('No location found for user', error)
    } else {
      setLocation(data)
    }
    setLoading(false)
  }

  const navItems = [
    { path: '/business', label: 'Resumen', icon: 'dashboard', end: true },
    { path: '/business/profile', label: 'Mi perfil', icon: 'storefront' },
    { path: '/business/photos', label: 'Fotos', icon: 'photo_library' },
    { path: '/business/promo', label: 'Promo activa', icon: 'campaign' },
    { path: '/business/metrics', label: 'Metricas', icon: 'insights' },
    { path: '/business/billing', label: 'Plan y facturacion', icon: 'payments' },
    ...((location?.business_plan === 'partner_store' || location?.business_plan === 'legend') ? [{ path: '/business/legend', label: 'Validaciónes Collector Hub', icon: 'workspace_premium' }] : []),
    { path: '/business/help', label: 'Ayuda', icon: 'help' }
  ]

  if (loading) {
    return (
      <div className="biz-loading-shell">
        <p>Cargando panel...</p>
      </div>
    )
  }

  return (
    <div className="business-layout">

      <aside className="biz-sidebar">
        <div className="biz-sidebar-header">
          <div className="biz-sidebar-kicker">/ panel negocios</div>
          <h2>FigusUY Negocios</h2>
          <p>Gestiona tu local, mejora tu visibilidad y mantene activo tu punto dentro del ecosistema.</p>
          <div className="biz-plan-chip">
            {getBusinessPlanLabel(location?.business_plan)}
          </div>
        </div>

        <nav className="biz-nav">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) => `biz-nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="biz-main">
        <header className="biz-header">
          <div className="biz-header-copy">
            <div className="biz-page-kicker">/ local activo</div>
            <h1>{location ? location.name : 'Configurando local...'}</h1>
            <p>{getBusinessPlanLabel(location?.business_plan)} · Panel comercial</p>
          </div>
          <button className="biz-exit-btn" onClick={() => navigate('/profile')}>
            <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>logout</span>
            Volver a FigusUY
          </button>
        </header>

        <div className="biz-content">
          <Outlet context={{ location, setLocation, fetchLocation }} />
        </div>
      </main>
    </div>
  )
}

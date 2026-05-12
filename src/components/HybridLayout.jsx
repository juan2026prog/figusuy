import React from 'react'
import { Outlet } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'
import GlobalFooter from './GlobalFooter'
import LandingLayout from './landing/LandingLayout'

export default function HybridLayout() {
  const { user, loading } = useAuthStore()
  
  if (loading) return null;

  if (!user) {
    return <LandingLayout />
  }

  return (
    <div className="app-layout" style={{ height: '100vh', overflow: 'hidden' }}>
      <div className="app-sidebar-wrapper">
        <Sidebar />
      </div>
      <main className="app-main" style={{ height: '100%', overflowY: 'auto' }}>
        <div className="page-transition-enter">
          <Outlet />
        </div>
        <GlobalFooter />
      </main>
      <BottomNav />
    </div>
  )
}

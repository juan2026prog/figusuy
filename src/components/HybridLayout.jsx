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
    <div className="app-layout">
      <div className="app-sidebar-wrapper">
        <Sidebar />
      </div>
      <main className="app-main">
        <div className="page-transition-enter">
          <Outlet />
        </div>
        <GlobalFooter />
      </main>
      <BottomNav />
    </div>
  )
}

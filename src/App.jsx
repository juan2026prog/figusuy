import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import BottomNav from './components/BottomNav'
import { useAnalytics } from './hooks/useAnalytics'

// Public
import Landing from './pages/Landing'
import Login from './pages/Login'

// App pages
import Album from './pages/Album'
import Matches from './pages/Matches'
import ChatsList from './pages/ChatsList'
import Chat from './pages/Chat'
import Profile from './pages/Profile'
import Premium from './pages/Premium'
import Stores from './pages/Stores'
import Favorites from './pages/Favorites'
import PartnerPlans from './pages/PartnerPlans'

// Business Dashboard
import BusinessLayout from './business/BusinessLayout'
import BusinessDashboard from './business/BusinessDashboard'
import BusinessProfile from './business/BusinessProfile'
import BusinessPhotos from './business/BusinessPhotos'
import BusinessPromo from './business/BusinessPromo'
import BusinessMetrics from './business/BusinessMetrics'
import BusinessBilling from './business/BusinessBilling'
import BusinessHelp from './business/BusinessHelp'
import BusinessAccessGuard from './components/BusinessAccessGuard'
import BusinessApply from './pages/BusinessApply'
import BusinessPending from './pages/BusinessPending'

// Admin
import AdminLayout from './admin/AdminLayout'
import AdminDashboard from './admin/Dashboard'
import AdminAlbums from './admin/AdminAlbums'
import AdminUsers from './admin/AdminUsers'
import AdminReports from './admin/AdminReports'
import AdminSettings from './admin/AdminSettings'
import AdminAlgorithm from './admin/AdminAlgorithm'
import AdminPlans from './admin/AdminPlans'
import AdminAudit from './admin/AdminAudit'
import AdminPage from './admin/AdminPage'
import AdminLocations from './admin/AdminLocations'
import AdminLocationRequests from './admin/AdminLocationRequests'
import AdminPromos from './admin/AdminPromos'
import AdminChats from './admin/AdminChats'
import AdminFavorites from './admin/AdminFavorites'
import AdminCMS from './admin/AdminCMS'
import AdminNotifications from './admin/AdminNotifications'
import AdminSEO from './admin/AdminSEO'
import AdminRoles from './admin/AdminRoles'
import AdminLogs from './admin/AdminLogs'
import AdminConfig from './admin/AdminConfig'
import AdminPayments from './admin/AdminPayments'
import AdminAnalytics from './admin/AdminAnalytics'
import AdminBlocks from './admin/AdminBlocks'
import AdminSecurity from './admin/AdminSecurity'
import AdminSubscriptions from './admin/AdminSubscriptions'
import AdminBusinessPlans from './admin/AdminBusinessPlans'
import AdminSponsored from './admin/AdminSponsored'
import AdminFeatureFlags from './admin/AdminFeatureFlags'

function LoadingScreen() {
  return (
    <div className="flex-center flex-col gap-lg" style={{ minHeight: '100vh' }}>
      <div className="logo-icon-lg animate-celebrate">F</div>
      <p className="text-sm text-muted font-medium">Cargando...</p>
    </div>
  )
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuthStore()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  return children
}

function PublicRoute({ children }) {
  const { user, loading } = useAuthStore()
  if (loading) return <LoadingScreen />
  if (user) return <Navigate to="/profile" replace />
  return children
}

function PageTransitionWrapper({ children }) {
  const location = useLocation()
  return (
    <div key={location.pathname} className="page-transition-enter">
      {children}
    </div>
  )
}

function GlobalHooks() {
  useAnalytics()
  return null
}

import Sidebar from './components/Sidebar'
import AlphaWelcomeModal from './components/AlphaWelcomeModal'

function AppLayout({ children }) {
  return (
    <div className="app-layout">
      <style>{`
        .app-layout {
          height: 100vh;
          display: flex;
          overflow: hidden;
          background-color: #020617; /* Matches body bg */
        }

        .app-sidebar-wrapper {
          display: none;
          flex-shrink: 0;
        }

        .app-main {
          flex: 1;
          position: relative;
          min-width: 0;
          overflow-y: auto;
          overflow-x: hidden;
          height: 100vh;
        }

        @media (min-width: 768px) {
          .app-sidebar-wrapper {
            display: block;
            width: 208px; /* w-52 */
          }
          .app-layout {
            flex-direction: row;
          }
        }
      `}</style>
      <div className="app-sidebar-wrapper">
        <Sidebar />
      </div>
      <main className="app-main">
        <PageTransitionWrapper>{children}</PageTransitionWrapper>
      </main>
      <BottomNav />
    </div>
  )
}

export default function App() {
  const { initialize } = useAuthStore()
  useEffect(() => {
    initialize()
    if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [])

  return (
    <BrowserRouter>
      <GlobalHooks />
      <Routes>
        {/* Public */}
        <Route path="/" element={<PublicRoute><Landing /></PublicRoute>} />
        <Route path="/login" element={<PublicRoute><PageTransitionWrapper><Login /></PageTransitionWrapper></PublicRoute>} />

        {/* App */}
        <Route path="/home" element={<Navigate to="/profile" replace />} />
        <Route path="/album" element={<ProtectedRoute><AppLayout><Album /></AppLayout></ProtectedRoute>} />
        <Route path="/matches" element={<ProtectedRoute><AppLayout><Matches /></AppLayout></ProtectedRoute>} />
        <Route path="/chats" element={<ProtectedRoute><AppLayout><ChatsList /></AppLayout></ProtectedRoute>} />
        <Route path="/chat/:chatId" element={<ProtectedRoute><AppLayout><Chat /></AppLayout></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><AppLayout><Profile /></AppLayout></ProtectedRoute>} />
        <Route path="/premium" element={<ProtectedRoute><AppLayout><Premium /></AppLayout></ProtectedRoute>} />
        <Route path="/stores" element={<ProtectedRoute><AppLayout><Stores /></AppLayout></ProtectedRoute>} />
        <Route path="/favorites" element={<ProtectedRoute><AppLayout><Favorites /></AppLayout></ProtectedRoute>} />
        <Route path="/partners" element={<AppLayout><PartnerPlans /></AppLayout>} />

        {/* Business Dashboard */}
        <Route path="/business/apply" element={<ProtectedRoute><BusinessApply /></ProtectedRoute>} />
        <Route path="/business/pending" element={<ProtectedRoute><BusinessPending /></ProtectedRoute>} />
        <Route path="/business" element={<ProtectedRoute><BusinessAccessGuard><BusinessLayout /></BusinessAccessGuard></ProtectedRoute>}>
          <Route index element={<BusinessDashboard />} />
          <Route path="profile" element={<BusinessProfile />} />
          <Route path="photos" element={<BusinessPhotos />} />
          <Route path="promo" element={<BusinessPromo />} />
          <Route path="metrics" element={<BusinessMetrics />} />
          <Route path="billing" element={<BusinessBilling />} />
          <Route path="help" element={<BusinessHelp />} />
        </Route>

        {/* Admin Panel */}
        <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
          <Route index element={<AdminDashboard />} />
          <Route path="albums" element={<AdminAlbums />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="algorithm" element={<AdminAlgorithm />} />
          <Route path="plans" element={<AdminPlans />} />
          <Route path="audit" element={<AdminAudit />} />
          <Route path="matches" element={<AdminPage section="matches" />} />
          <Route path="chats" element={<AdminChats />} />
          <Route path="favorites" element={<AdminFavorites />} />
          <Route path="locations" element={<AdminLocations />} />
          <Route path="location-requests" element={<AdminLocationRequests />} />
          <Route path="business-plans" element={<AdminBusinessPlans />} />
          <Route path="promos" element={<AdminSponsored />} />
          <Route path="blocks" element={<AdminBlocks />} />
          <Route path="security" element={<AdminSecurity />} />
          <Route path="subscriptions" element={<AdminSubscriptions />} />
          <Route path="payments" element={<AdminPayments />} />
          <Route path="metrics" element={<AdminAnalytics />} />
          <Route path="cms" element={<AdminCMS />} />
          <Route path="notifications" element={<AdminNotifications />} />
          <Route path="seo" element={<AdminSEO />} />
          <Route path="roles" element={<AdminRoles />} />
          <Route path="logs" element={<AdminLogs />} />
          <Route path="config" element={<AdminConfig />} />
          <Route path="sponsored" element={<AdminSponsored />} />
          <Route path="feature-flags" element={<AdminFeatureFlags />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <AlphaWelcomeModal />
    </BrowserRouter>
  )
}

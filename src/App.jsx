import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import { useFeatureFlagStore } from './stores/featureFlagStore'
import { useBrandingStore } from './stores/brandingStore'
import BottomNav from './components/BottomNav'
import GlobalFooter from './components/GlobalFooter'
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
import Achievements from './pages/Achievements'

// Business Dashboard
import BusinessLayout from './business/BusinessLayout'
import BusinessDashboard from './business/BusinessDashboard'
import BusinessProfile from './business/BusinessProfile'
import BusinessPhotos from './business/BusinessPhotos'
import BusinessPromo from './business/BusinessPromo'
import BusinessMetrics from './business/BusinessMetrics'
import BusinessBilling from './business/BusinessBilling'
import BusinessPartnerStoreValidations from './business/BusinessPartnerStoreValidations'
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
import AdminGamification from './admin/AdminGamification'
import AdminAffiliates from './admin/AdminAffiliates'
import AdminAffiliateCampaigns from './admin/AdminAffiliateCampaigns'
import AdminAffiliateBenefits from './admin/AdminAffiliateBenefits'
import AdminAffiliateCommissions from './admin/AdminAffiliateCommissions'
import AdminAffiliatePayments from './admin/AdminAffiliatePayments'
import AdminBranding from './admin/AdminBranding'
import AdminStaticPages from './admin/AdminStaticPages'
import AffiliateJoin from './pages/AffiliateJoin'
import StaticPage from './pages/StaticPage'

// Growth Engine Admin
import AdminSmartNotifications from './admin/AdminSmartNotifications'
import AdminOnboarding from './admin/AdminOnboarding'
import AdminReferrals from './admin/AdminReferrals'
import AdminGrowthAchievements from './admin/AdminGrowthAchievements'
import AdminRewardsEngine from './admin/AdminRewardsEngine'

// Referral
import ReferralLanding from './pages/ReferralLanding'

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

function AuthRedirector() {
  const { profile } = useAuthStore()
  const adminRoles = ['god_admin', 'admin', 'moderator', 'support', 'comercial', 'analista']
  
  if (adminRoles.includes(profile?.role)) {
    return <Navigate to="/admin" replace />
  }
  if (profile?.account_type === 'business') {
    return <Navigate to="/business" replace />
  }
  return <Navigate to="/profile" replace />
}

function PublicRoute({ children }) {
  const { user, loading } = useAuthStore()
  if (loading) return <LoadingScreen />
  if (user) {
    return <AuthRedirector />
  }
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

function FeatureGuard({ featureKey, children }) {
  const isEnabled = useFeatureFlagStore(state => state.isFeatureEnabled(featureKey))
  
  if (!isEnabled) {
    return (
      <div className="flex-center flex-col gap-lg" style={{ minHeight: '100vh', padding: '2rem', textAlign: 'center' }}>
        <span className="material-symbols-outlined" style={{ fontSize: '4rem', color: 'var(--color-text-muted)' }}>construction</span>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--color-surface)' }}>Función Desactivada</h2>
        <p style={{ color: 'var(--color-text-muted)', maxWidth: '400px' }}>Esta sección se encuentra temporalmente desactivada o en mantenimiento.</p>
        <Navigate to="/profile" replace />
      </div>
    )
  }
  return children
}

function GlobalHooks() {
  useAnalytics()
  return null
}

import Sidebar from './components/Sidebar'
import AlphaWelcomeModal from './components/AlphaWelcomeModal'
import GamificationToast from './components/GamificationToast'
import OnboardingGuide from './components/OnboardingGuide'
import ShareModal from './components/ShareModal'
import SmartNotifications from './components/SmartNotifications'
import { useGrowthStore } from './stores/growthStore'

function AppLayout({ children }) {
  return (
    <div className="app-layout">
      <style>{`
        .app-layout {
          height: 100vh;
          display: flex;
          overflow: hidden;
          background-color: var(--color-bg); /* Matches body bg */
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
      <main className="app-main" style={{ display: 'flex', flexDirection: 'column' }}>
        <PageTransitionWrapper>{children}</PageTransitionWrapper>
        <GlobalFooter />
      </main>
      <BottomNav />
    </div>
  )
}

export default function App() {
  const { initialize, user, profile } = useAuthStore()
  const { initializeFlags } = useFeatureFlagStore()
  const { fetchSettings, settings } = useBrandingStore()
  const initGrowth = useGrowthStore(s => s.initialize)
  
  useEffect(() => {
    initialize()
    fetchSettings()
    if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [])

  useEffect(() => {
    initializeFlags(user?.id)
  }, [user?.id])

  useEffect(() => {
    if (user?.id && profile) {
      initGrowth(user.id, profile, {})
    }
  }, [user?.id, profile?.id])

  useEffect(() => {
    if (settings.header_primary_color) {
      document.documentElement.style.setProperty('--color-primary', settings.header_primary_color)
    }
  }, [settings])

  return (
    <BrowserRouter>
      <GlobalHooks />
      <Routes>
        {/* Public */}
        <Route path="/" element={<PublicRoute><Landing /></PublicRoute>} />
        <Route path="/login" element={<PublicRoute><PageTransitionWrapper><Login /></PageTransitionWrapper></PublicRoute>} />
        <Route path="/r/:code" element={<ReferralLanding />} />
        <Route path="/affiliate-join/:code" element={<AffiliateJoin />} />
        <Route path="/p/:slug" element={<StaticPage />} />

        {/* App */}
        <Route path="/home" element={
          <ProtectedRoute>
            <AuthRedirector />
          </ProtectedRoute>
        } />
        <Route path="/album" element={<ProtectedRoute><FeatureGuard featureKey="album"><AppLayout><Album /></AppLayout></FeatureGuard></ProtectedRoute>} />
        <Route path="/matches" element={<ProtectedRoute><AppLayout><Matches /></AppLayout></ProtectedRoute>} />
        <Route path="/chats" element={<ProtectedRoute><FeatureGuard featureKey="chats"><AppLayout><ChatsList /></AppLayout></FeatureGuard></ProtectedRoute>} />
        <Route path="/chat/:chatId" element={<ProtectedRoute><FeatureGuard featureKey="chats"><AppLayout><Chat /></AppLayout></FeatureGuard></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><AppLayout><Profile /></AppLayout></ProtectedRoute>} />
        <Route path="/premium" element={<ProtectedRoute><AppLayout><Premium /></AppLayout></ProtectedRoute>} />
        <Route path="/stores" element={<ProtectedRoute><AppLayout><Stores /></AppLayout></ProtectedRoute>} />
        <Route path="/favorites" element={<ProtectedRoute><AppLayout><Favorites /></AppLayout></ProtectedRoute>} />
        <Route path="/achievements" element={<ProtectedRoute><AppLayout><Achievements /></AppLayout></ProtectedRoute>} />
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
          <Route path="legend" element={<BusinessPartnerStoreValidations />} />
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
          <Route path="branding" element={<AdminBranding />} />
          <Route path="pages" element={<AdminStaticPages />} />
          <Route path="notifications" element={<AdminNotifications />} />
          <Route path="seo" element={<AdminSEO />} />
          <Route path="roles" element={<AdminRoles />} />
          <Route path="logs" element={<AdminLogs />} />
          <Route path="config" element={<AdminConfig />} />
          <Route path="sponsored" element={<AdminSponsored />} />
          <Route path="feature-flags" element={<AdminFeatureFlags />} />
          <Route path="gamification" element={<AdminGamification />} />
          <Route path="affiliates" element={<AdminAffiliates />} />
          <Route path="affiliate-campaigns" element={<AdminAffiliateCampaigns />} />
          <Route path="affiliate-benefits" element={<AdminAffiliateBenefits />} />
          <Route path="affiliate-commissions" element={<AdminAffiliateCommissions />} />
          <Route path="affiliate-payments" element={<AdminAffiliatePayments />} />
          <Route path="smart-notifications" element={<AdminSmartNotifications />} />
          <Route path="onboarding" element={<AdminOnboarding />} />
          <Route path="referrals" element={<AdminReferrals />} />
          <Route path="growth-achievements" element={<AdminGrowthAchievements />} />
          <Route path="rewards-engine" element={<AdminRewardsEngine />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <AlphaWelcomeModal />
      <GamificationToast />
      <OnboardingGuide />
      <ShareModal />
      <SmartNotifications />
    </BrowserRouter>
  )
}

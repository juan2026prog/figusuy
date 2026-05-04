import React, { Suspense, lazy, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import { useFeatureFlagStore } from './stores/featureFlagStore'
import { useBrandingStore } from './stores/brandingStore'
import BottomNav from './components/BottomNav'
import GlobalFooter from './components/GlobalFooter'
import Sidebar from './components/Sidebar'
import { useAnalytics } from './hooks/useAnalytics'
import { useGrowthStore } from './stores/growthStore'

import BusinessAccessGuard from './components/BusinessAccessGuard'

const Landing = lazy(() => import('./pages/Landing'))
const Login = lazy(() => import('./pages/Login'))
const ReferralLanding = lazy(() => import('./pages/ReferralLanding'))
const AffiliateJoin = lazy(() => import('./pages/AffiliateJoin'))
const StaticPage = lazy(() => import('./pages/StaticPage'))

const Album = lazy(() => import('./pages/Album'))
const Matches = lazy(() => import('./pages/Matches'))
const ChatsList = lazy(() => import('./pages/ChatsList'))
const Chat = lazy(() => import('./pages/Chat'))
const Profile = lazy(() => import('./pages/Profile'))
const Premium = lazy(() => import('./pages/Premium'))
const Stores = lazy(() => import('./pages/Stores'))
const Favorites = lazy(() => import('./pages/Favorites'))
const PartnerPlans = lazy(() => import('./pages/PartnerPlans'))
const Achievements = lazy(() => import('./pages/Achievements'))

const BusinessLayout = lazy(() => import('./business/BusinessLayout'))
const BusinessDashboard = lazy(() => import('./business/BusinessDashboard'))
const BusinessProfile = lazy(() => import('./business/BusinessProfile'))
const BusinessPhotos = lazy(() => import('./business/BusinessPhotos'))
const BusinessPromo = lazy(() => import('./business/BusinessPromo'))
const BusinessMetrics = lazy(() => import('./business/BusinessMetrics'))
const BusinessBilling = lazy(() => import('./business/BusinessBilling'))
const BusinessPartnerStoreValidations = lazy(() => import('./business/BusinessPartnerStoreValidations'))
const BusinessHelp = lazy(() => import('./business/BusinessHelp'))
const BusinessApply = lazy(() => import('./pages/BusinessApply'))
const BusinessPending = lazy(() => import('./pages/BusinessPending'))

const AdminLayout = lazy(() => import('./admin/AdminLayout'))
const AdminDashboard = lazy(() => import('./admin/Dashboard'))
const AdminAlbums = lazy(() => import('./admin/AdminAlbums'))
const AdminUsers = lazy(() => import('./admin/AdminUsers'))
const AdminReports = lazy(() => import('./admin/AdminReports'))
const AdminSettings = lazy(() => import('./admin/AdminSettings'))
const AdminAlgorithm = lazy(() => import('./admin/AdminAlgorithm'))
const AdminPlans = lazy(() => import('./admin/AdminPlans'))
const AdminAudit = lazy(() => import('./admin/AdminAudit'))
const AdminPage = lazy(() => import('./admin/AdminPage'))
const AdminLocations = lazy(() => import('./admin/AdminLocations'))
const AdminLocationRequests = lazy(() => import('./admin/AdminLocationRequests'))
const AdminChats = lazy(() => import('./admin/AdminChats'))
const AdminFavorites = lazy(() => import('./admin/AdminFavorites'))
const AdminCMS = lazy(() => import('./admin/AdminCMS'))
const AdminNotifications = lazy(() => import('./admin/AdminNotifications'))
const AdminSEO = lazy(() => import('./admin/AdminSEO'))
const AdminRoles = lazy(() => import('./admin/AdminRoles'))
const AdminLogs = lazy(() => import('./admin/AdminLogs'))
const AdminConfig = lazy(() => import('./admin/AdminConfig'))
const AdminPayments = lazy(() => import('./admin/AdminPayments'))
const AdminAnalytics = lazy(() => import('./admin/AdminAnalytics'))
const AdminBlocks = lazy(() => import('./admin/AdminBlocks'))
const AdminSecurity = lazy(() => import('./admin/AdminSecurity'))
const AdminSubscriptions = lazy(() => import('./admin/AdminSubscriptions'))
const AdminBusinessPlans = lazy(() => import('./admin/AdminBusinessPlans'))
const AdminSponsored = lazy(() => import('./admin/AdminSponsored'))
const AdminFeatureFlags = lazy(() => import('./admin/AdminFeatureFlags'))
const AdminGamification = lazy(() => import('./admin/AdminGamification'))
const AdminAffiliates = lazy(() => import('./admin/AdminAffiliates'))
const AdminAffiliateCampaigns = lazy(() => import('./admin/AdminAffiliateCampaigns'))
const AdminAffiliateBenefits = lazy(() => import('./admin/AdminAffiliateBenefits'))
const AdminAffiliateCommissions = lazy(() => import('./admin/AdminAffiliateCommissions'))
const AdminAffiliatePayments = lazy(() => import('./admin/AdminAffiliatePayments'))
const AdminBranding = lazy(() => import('./admin/AdminBranding'))
const AdminStaticPages = lazy(() => import('./admin/AdminStaticPages'))
const AdminSmartNotifications = lazy(() => import('./admin/AdminSmartNotifications'))
const AdminOnboarding = lazy(() => import('./admin/AdminOnboarding'))
const AdminReferrals = lazy(() => import('./admin/AdminReferrals'))
const AdminGrowthAchievements = lazy(() => import('./admin/AdminGrowthAchievements'))
const AdminRewardsEngine = lazy(() => import('./admin/AdminRewardsEngine'))

const AlphaWelcomeModal = lazy(() => import('./components/AlphaWelcomeModal'))
const GamificationToast = lazy(() => import('./components/GamificationToast'))
const OnboardingGuide = lazy(() => import('./components/OnboardingGuide'))
const ShareModal = lazy(() => import('./components/ShareModal'))
const SmartNotifications = lazy(() => import('./components/SmartNotifications'))

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
      <Suspense fallback={<LoadingScreen />}>
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
      </Suspense>
    </BrowserRouter>
  )
}

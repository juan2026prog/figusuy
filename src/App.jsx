import React, { Suspense, lazy, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
// FigusUY - PayPal Integration Final Sync
import { useFeatureFlagStore } from './stores/featureFlagStore'
import { useBrandingStore } from './stores/brandingStore'
import BottomNav from './components/BottomNav'
import GlobalFooter from './components/GlobalFooter'
import Sidebar from './components/Sidebar'
import { useAnalytics } from './hooks/useAnalytics'
import { useGrowthStore } from './stores/growthStore'

import BusinessAccessGuard from './components/BusinessAccessGuard'
import InfluencerAccessGuard from './components/InfluencerAccessGuard'
import AdminRoleGuard from './components/AdminRoleGuard'
import { useInfluencerStore } from './stores/influencerStore'

import Landing from './pages/Landing'
import Login from './pages/Login'
import Points from './pages/Points'
import InfluencersPage from './pages/InfluencersPage'
import FAQ from './pages/FAQ'
import AccountSuspended from './pages/AccountSuspended'

const ReferralLanding = lazy(() => import('./pages/ReferralLanding'))
const UserReferrals = lazy(() => import('./pages/UserReferrals'))
const InfluencerJoin = lazy(() => import('./pages/InfluencerJoin'))
const StaticPage = lazy(() => import('./pages/StaticPage'))
const ContactHub = lazy(() => import('./pages/ContactHub'))

const Album = lazy(() => import('./pages/Album'))
const Matches = lazy(() => import('./pages/Matches'))
const ChatsList = lazy(() => import('./pages/ChatsList'))
const Chat = lazy(() => import('./pages/Chat'))
const Profile = lazy(() => import('./pages/Profile'))
const AuthCallback = lazy(() => import('./pages/AuthCallback'))
const Premium = lazy(() => import('./pages/Premium'))
const Stores = lazy(() => import('./pages/Stores'))
const Favorites = lazy(() => import('./pages/Favorites'))
const PartnerPlans = lazy(() => import('./pages/PartnerPlans'))
const Achievements = lazy(() => import('./pages/Achievements'))
const PublicProfile = lazy(() => import('./pages/PublicProfile'))
const PublicAlbum = lazy(() => import('./pages/PublicAlbum'))
const AlbumProfile = lazy(() => import('./pages/AlbumProfile'))
const HybridLayout = lazy(() => import('./components/HybridLayout'))

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
const BusinessSuspended = lazy(() => import('./pages/BusinessSuspended'))
const InfluencerLayout = lazy(() => import('./influencer/InfluencerLayout'))
const InfluencerDashboardHome = lazy(() => import('./influencer/InfluencerDashboardHome'))
const InfluencerAssets = lazy(() => import('./influencer/InfluencerAssets'))
const InfluencerPerformance = lazy(() => import('./influencer/InfluencerPerformance'))
const InfluencerPayouts = lazy(() => import('./influencer/InfluencerPayouts'))

const AdminLayout = lazy(() => import('./admin/AdminLayout'))
const AdminDashboard = lazy(() => import('./admin/Dashboard'))
const AdminAlbums = lazy(() => import('./admin/AdminAlbums'))
const AdminUsers = lazy(() => import('./admin/AdminUsers'))
const AdminReports = lazy(() => import('./admin/AdminReports'))
const AdminContactRequests = lazy(() => import('./admin/AdminContactRequests'))
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
const AdminInfluencers = lazy(() => import('./admin/AdminInfluencers'))
const AdminInfluencerCampaigns = lazy(() => import('./admin/AdminInfluencerCampaigns'))
const AdminInfluencerBenefits = lazy(() => import('./admin/AdminInfluencerBenefits'))
const AdminInfluencerCommissions = lazy(() => import('./admin/AdminInfluencerCommissions'))
const AdminInfluencerPayments = lazy(() => import('./admin/AdminInfluencerPayments'))
const AdminBranding = lazy(() => import('./admin/AdminBranding'))
const AdminStaticPages = lazy(() => import('./admin/AdminStaticPages'))
const AdminSmartNotifications = lazy(() => import('./admin/AdminSmartNotifications'))
const AdminOnboarding = lazy(() => import('./admin/AdminOnboarding'))
const AdminReferrals = lazy(() => import('./admin/AdminReferrals'))
const AdminGrowthAchievements = lazy(() => import('./admin/AdminGrowthAchievements'))
const AdminRewardsEngine = lazy(() => import('./admin/AdminRewardsEngine'))
const AdminExchangeCompletion = lazy(() => import('./admin/AdminExchangeCompletion'))
const AdminInfluencerApplications = lazy(() => import('./admin/AdminInfluencerApplications'))
const AdminEmailLifecycle = lazy(() => import('./admin/AdminEmailLifecycle'))

import LandingLayout from './components/landing/LandingLayout'

const AlphaWelcomeModal = lazy(() => import('./components/AlphaWelcomeModal'))
const GamificationToast = lazy(() => import('./components/GamificationToast'))
const OnboardingGuide = lazy(() => import('./components/OnboardingGuide'))
const ShareModal = lazy(() => import('./components/ShareModal'))
const SmartNotifications = lazy(() => import('./components/SmartNotifications'))
const GlobalLogoutDialog = lazy(() => import('./components/GlobalLogoutDialog'))

import { SystemEventEngine } from './components/system/SystemEventEngine'
import './components/gamification/icons/GamificationIcons.css'
import { GamificationIconDefs } from './components/gamification/icons/GamificationIconDefs'

function LoadingScreen({ text = "Cargando FigusUY..." }) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'grid',
      placeItems: 'center',
      padding: '2rem',
      background: 'var(--color-bg, #080808)',
      color: 'var(--color-text, #f5f5f5)',
    }}>
      <div style={{ textAlign: 'center', display: 'grid', gap: '0.75rem' }}>
        <span className="material-symbols-outlined" style={{ fontSize: '2.5rem', color: 'var(--color-primary, #ff5a00)' }}>hourglass_top</span>
        <strong style={{ fontSize: '1rem', letterSpacing: '0.04em' }}>{text}</strong>
      </div>
    </div>
  )
}

function ProtectedRoute({ children }) {
  const { user, loading, initialized } = useAuthStore()
  const [timedOut, setTimedOut] = React.useState(false)

  // Detectar si hay un token almacenado (indica que el usuario SÍ  estaba logueado)
  const hasStoredSession = React.useMemo(() => {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && (key.includes('supabase.auth.token') || key.includes('sb-') && key.includes('-auth-token'))) {
          return true
        }
      }
    } catch { /* ignore */ }
    return false
  }, [])

  React.useEffect(() => {
    // Solo activar timeout si NO hay token guardado (sesión genuinamente inexistente)
    // Si hay token, darle más tiempo — la sesión existe, solo está cargando del servidor
    const delay = hasStoredSession ? 20000 : 6000
    const timer = setTimeout(() => {
      if (!user) setTimedOut(true)
    }, delay)
    return () => clearTimeout(timer)
  }, [user, hasStoredSession])

  // Si ya tenemos usuario, permitir acceso inmediato
  const { isPendingDeletion } = useAuthStore()
  if (user) {
    if (isPendingDeletion && window.location.pathname !== '/account-suspended') {
      return <Navigate to="/account-suspended" replace />
    }
    return children
  }

  // Si todavía estamos cargando y no ha pasado el timeout, mostrar loading
  if ((loading || !initialized) && !timedOut) return <LoadingScreen text="Verificando sesión..." />

  // Si hay un token guardado pero aún no tenemos usuario y se agotó el tiempo,
  // forzar un re-intento antes de redirigir
  if (hasStoredSession && timedOut && !user) {
    // Último intento: re-inicializar auth
    const { initialize } = useAuthStore.getState()
    void initialize()
  }

  // Auth resolvió sin usuario y no hay token guardado → login
  return <Navigate to="/login" replace />
}

function AuthRedirector() {
  const { profile } = useAuthStore()
  const adminRoles = ['god_admin', 'admin', 'moderator', 'support', 'comercial', 'analista']
  
  if (adminRoles.includes(profile?.role)) {
    return <Navigate to="/admin" replace />
  }
  if (profile?.role === 'influencer') {
    return <Navigate to="/influencer/dashboard" replace />
  }
  if (profile?.account_type === 'business') {
    return <Navigate to="/business" replace />
  }
  const { isPendingDeletion } = useAuthStore()
  if (isPendingDeletion) {
    return <Navigate to="/account-suspended" replace />
  }
  return <Navigate to="/profile" replace />
}

function PublicRoute({ children }) {
  const { user, loading, initialized } = useAuthStore()

  // Mientras la autenticación no se haya inicializado, mostrar loading breve
  // Pero NO bloquear indefinidamente — si initialized es true, decidir ya
  if (!initialized && loading) {
    return <LoadingScreen text="Preparando ingreso..." />
  }

  // Si hay usuario autenticado, redirigir al dashboard correspondiente
  if (user) {
    return <AuthRedirector />
  }

  // No hay usuario → mostrar la página pública (login)
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
  const { user } = useAuthStore()
  const checkAndProcessReferral = useInfluencerStore(state => state.checkAndProcessReferral)

  useAnalytics()

  useEffect(() => {
    if (user?.id) {
      void checkAndProcessReferral(user.id)
    }
  }, [user?.id, checkAndProcessReferral])

  return null
}

function AppChrome() {
  const location = useLocation()
  const isLandingRoute = ['/', '/puntos', '/influencers', '/faq', '/login'].includes(location.pathname) || 
                         location.pathname.startsWith('/p/') || 
                         location.pathname.startsWith('/r/')
  
  if (isLandingRoute) return null

  return (
    <>
      <GlobalHooks />
      <AlphaWelcomeModal />
      <GamificationToast />
      <OnboardingGuide />
      <ShareModal />
      <SmartNotifications />
      <GlobalLogoutDialog />
      <GamificationIconDefs />
    </>
  )
}

function AppLayout({ children }) {
  return (
    <div className="app-layout" style={{ height: '100vh', overflow: 'hidden' }}>
      <div className="app-sidebar-wrapper">
        <Sidebar />
      </div>
      <main className="app-main" style={{ height: '100%', overflowY: 'auto' }}>
        <PageTransitionWrapper>
          {children || <Outlet />}
        </PageTransitionWrapper>
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
    void initialize()
    void fetchSettings()
    
    if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [])

  useEffect(() => {
    void initializeFlags(user?.id)
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
      <Suspense fallback={<LoadingScreen text="Iniciando interfaz..." />}>
        <Routes>
        {/* Public Landing Suite */}
        <Route element={<LandingLayout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/puntos" element={<Points />} />
          <Route path="/influencers" element={<InfluencersPage />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/p/contacto" element={<ContactHub />} />
          <Route path="/p/:slug" element={<StaticPage />} />
        </Route>

        <Route path="/login" element={<PublicRoute><PageTransitionWrapper><Login /></PageTransitionWrapper></PublicRoute>} />
        <Route path="/account-suspended" element={<ProtectedRoute><AccountSuspended /></ProtectedRoute>} />
        <Route path="/auth/callback" element={<PageTransitionWrapper><AuthCallback /></PageTransitionWrapper>} />
        <Route path="/r/:code" element={<ReferralLanding />} />
        <Route path="/influencer-join/:code" element={<InfluencerJoin />} />

        {/* Public Profiles & Album Hubs */}
        <Route element={<HybridLayout />}>
          <Route path="/u/:username" element={<PageTransitionWrapper><PublicProfile /></PageTransitionWrapper>} />
          <Route path="/u/:username/album/:albumId" element={<PageTransitionWrapper><PublicAlbum /></PageTransitionWrapper>} />
          <Route path="/albums/:albumId" element={<PageTransitionWrapper><AlbumProfile /></PageTransitionWrapper>} />
        </Route>

        {/* App */}
        <Route path="/home" element={
          <ProtectedRoute>
            <AuthRedirector />
          </ProtectedRoute>
        } />
        {/* App Routes with persistent Layout */}
        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route path="/album" element={<FeatureGuard featureKey="album"><Album /></FeatureGuard>} />
          <Route path="/matches" element={<Matches />} />
          <Route path="/chats" element={<FeatureGuard featureKey="chats"><ChatsList /></FeatureGuard>} />
          <Route path="/chat/:chatId" element={<FeatureGuard featureKey="chats"><Chat /></FeatureGuard>} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/premium" element={<Premium />} />
          <Route path="/stores" element={<Stores />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/achievements" element={<Achievements />} />
          <Route path="/referidos" element={<UserReferrals />} />
          <Route path="/partners" element={<PartnerPlans />} />
        </Route>

        {/* Business Dashboard */}
        <Route path="/business/apply" element={<ProtectedRoute><BusinessApply /></ProtectedRoute>} />
        <Route path="/business/pending" element={<ProtectedRoute><BusinessPending /></ProtectedRoute>} />
        <Route path="/business/suspended" element={<ProtectedRoute><BusinessSuspended /></ProtectedRoute>} />
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

        <Route path="/influencer" element={<ProtectedRoute><InfluencerAccessGuard><AppLayout><InfluencerLayout /></AppLayout></InfluencerAccessGuard></ProtectedRoute>}>
          <Route index element={<Navigate to="/influencer/dashboard" replace />} />
          <Route path="dashboard" element={<InfluencerDashboardHome />} />
          <Route path="assets" element={<InfluencerAssets />} />
          <Route path="performance" element={<InfluencerPerformance />} />
          <Route path="payouts" element={<InfluencerPayouts />} />
        </Route>

        {/* Admin Panel */}
        <Route path="/admin" element={<ProtectedRoute><AdminRoleGuard><AdminLayout /></AdminRoleGuard></ProtectedRoute>}>
          <Route index element={<AdminDashboard />} />
          <Route path="albums" element={<AdminAlbums />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="contact-requests" element={<AdminContactRequests />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="algorithm" element={<AdminAlgorithm />} />
          <Route path="plans" element={<AdminPlans />} />
          <Route path="audit" element={<AdminAudit />} />
          <Route path="matches" element={<AdminPage section="matches" />} />
          <Route path="exchange-completion" element={<AdminExchangeCompletion />} />
          <Route path="chats" element={<AdminChats />} />
          <Route path="favorites" element={<AdminFavorites />} />
          <Route path="locations" element={<AdminLocations />} />
          <Route path="location-requests" element={<AdminLocationRequests />} />
          <Route path="business-plans" element={<AdminBusinessPlans />} />
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
          <Route path="affiliates" element={<AdminInfluencers />} />
          <Route path="influencer-applications" element={<AdminInfluencerApplications />} />
          <Route path="affiliate-campaigns" element={<AdminInfluencerCampaigns />} />
          <Route path="affiliate-benefits" element={<AdminInfluencerBenefits />} />
          <Route path="affiliate-commissions" element={<AdminInfluencerCommissions />} />
          <Route path="affiliate-payments" element={<AdminInfluencerPayments />} />
          <Route path="smart-notifications" element={<AdminSmartNotifications />} />
          <Route path="onboarding" element={<AdminOnboarding />} />
          <Route path="referrals" element={<AdminReferrals />} />
          <Route path="growth-achievements" element={<AdminGrowthAchievements />} />
          <Route path="rewards-engine" element={<AdminRewardsEngine />} />
          <Route path="email-lifecycle" element={<AdminEmailLifecycle />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <AppChrome />
        <SystemEventEngine />
      </Suspense>
    </BrowserRouter>
  )
}

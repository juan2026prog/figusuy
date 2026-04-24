import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import BottomNav from './components/BottomNav'

// Public
import Landing from './pages/Landing'
import Login from './pages/Login'

// App pages
import Home from './pages/Home'
import Album from './pages/Album'
import Matches from './pages/Matches'
import ChatsList from './pages/ChatsList'
import Chat from './pages/Chat'
import Profile from './pages/Profile'
import Premium from './pages/Premium'

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

function ProtectedRoute({ children }) {
  const { user, loading } = useAuthStore()
  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ width: '3rem', height: '3rem', borderRadius: '0.75rem', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 900, color: 'white', animation: 'pulse-soft 1.5s infinite' }}>F</div>
      <p style={{ fontSize: '0.875rem', color: '#94a3b8', fontWeight: 500 }}>Cargando...</p>
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  return children
}

function AppLayout({ children }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <main style={{ flex: 1 }}>{children}</main>
      <BottomNav />
    </div>
  )
}

function PublicRoute({ children }) {
  const { user, loading } = useAuthStore()
  if (loading) return null
  if (user) return <Navigate to="/home" replace />
  return children
}

export default function App() {
  const { initialize } = useAuthStore()
  useEffect(() => { initialize() }, [])

  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<PublicRoute><Landing /></PublicRoute>} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />

        {/* App */}
        <Route path="/home" element={<ProtectedRoute><AppLayout><Home /></AppLayout></ProtectedRoute>} />
        <Route path="/album" element={<ProtectedRoute><AppLayout><Album /></AppLayout></ProtectedRoute>} />
        <Route path="/matches" element={<ProtectedRoute><AppLayout><Matches /></AppLayout></ProtectedRoute>} />
        <Route path="/chats" element={<ProtectedRoute><AppLayout><ChatsList /></AppLayout></ProtectedRoute>} />
        <Route path="/chats/:chatId" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><AppLayout><Profile /></AppLayout></ProtectedRoute>} />
        <Route path="/premium" element={<ProtectedRoute><Premium /></ProtectedRoute>} />

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
          <Route path="trades" element={<AdminPage section="trades" />} />
          <Route path="moderation" element={<AdminPage section="moderation" />} />
          <Route path="locations" element={<AdminPage section="locations" />} />
          <Route path="events" element={<AdminPage section="events" />} />
          <Route path="cms" element={<AdminPage section="cms" />} />
          <Route path="notifications" element={<AdminPage section="notifications" />} />
          <Route path="payments" element={<AdminPage section="payments" />} />
          <Route path="roles" element={<AdminPage section="roles" />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

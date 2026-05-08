import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

const ADMIN_ROLES = ['god_admin', 'admin', 'moderator', 'support', 'comercial', 'analista']

/**
 * Guard que verifica que el usuario tenga un rol administrativo.
 * Si el perfil está marcado como _degraded (timeout de auth), NO se otorga acceso.
 */
export default function AdminRoleGuard({ children }) {
  const { user, profile, loading, initialized } = useAuthStore()

  // Mientras carga, no mostrar nada (ProtectedRoute ya maneja el loading screen)
  if (loading || !initialized) return null

  // Sin usuario -> login (ProtectedRoute ya maneja esto, pero por seguridad)
  if (!user) return <Navigate to="/login" replace />

  // Función auxiliar para redirigir al lugar correcto
  const redirectHome = () => {
    if (profile?.role === 'influencer') return <Navigate to="/influencer/dashboard" replace />
    if (profile?.account_type === 'business') return <Navigate to="/business" replace />
    return <Navigate to="/profile" replace />
  }

  // Sin perfil o perfil degradado -> no tiene acceso admin
  if (!profile || profile._degraded) {
    return redirectHome()
  }

  // Verificar rol
  if (!ADMIN_ROLES.includes(profile.role)) {
    return redirectHome()
  }

  return children
}

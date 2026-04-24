import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useAppStore } from '../stores/appStore'
import Header from '../components/Header'

export default function ProfilePage() {
  const navigate = useNavigate()
  const { profile, signOut, updateProfile, updateLocation } = useAuthStore()
  const { userAlbums, fetchUserAlbums } = useAppStore()
  const [locationLoading, setLocationLoading] = useState(false)
  const [savingSettings, setSavingSettings] = useState(false)
  const [settingsForm, setSettingsForm] = useState({
    city: '',
    min_match_stickers: 1
  })

  // Load initial values
  useEffect(() => {
    if (profile) {
      setSettingsForm({
        city: profile.city || '',
        min_match_stickers: profile.min_match_stickers || 1
      })
    }
  }, [profile])

  useEffect(() => {
    if (profile?.id) fetchUserAlbums(profile.id)
    
    // Check for payment success
    const params = new URLSearchParams(window.location.search)
    if (params.get('payment') === 'success') {
      // Clear params without refreshing
      window.history.replaceState({}, document.title, "/profile")
      alert('¡Bienvenido a FigusUy Premium! Tu suscripción se ha activado correctamente.')
    }
  }, [profile?.id])

  const handleGetLocation = () => {
    setLocationLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        updateLocation(pos.coords.latitude, pos.coords.longitude)
        setLocationLoading(false)
      },
      () => setLocationLoading(false),
      { enableHighAccuracy: true }
    )
  }

  const handleSaveSettings = async () => {
    setSavingSettings(true)
    try {
      await updateProfile({
        city: settingsForm.city,
        min_match_stickers: parseInt(settingsForm.min_match_stickers)
      })
      alert('Configuración guardada exitosamente')
    } catch (error) {
      console.error(error)
      alert('Error al guardar configuración')
    } finally {
      setSavingSettings(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  if (!profile) return null

  return (
    <div className="page">
      <Header title="Mi Perfil" />

      {/* Profile Card */}
      <div className="animate-fade-in-up" style={{
        background: 'var(--color-surface)', borderRadius: 'var(--radius-2xl)',
        padding: '1.5rem', textAlign: 'center', marginBottom: '1.25rem',
        boxShadow: 'var(--shadow-md)', border: '1px solid var(--color-border-light)',
      }}>
        <div style={{
          width: '4.5rem', height: '4.5rem', borderRadius: 'var(--radius-full)',
          background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 0.75rem', fontSize: '1.75rem', fontWeight: 800, color: 'white',
        }}>
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', borderRadius: 'var(--radius-full)', objectFit: 'cover' }} />
          ) : (profile.name || '?')[0].toUpperCase()}
        </div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.25rem' }}>{profile.name || 'Usuario'}</h2>
        <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>{profile.email}</p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem' }}>
          <div>
            <p style={{ fontSize: '1.25rem', fontWeight: 700 }}>⭐ {profile.rating?.toFixed?.(1) || '5.0'}</p>
            <p style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Rating</p>
          </div>
          <div>
            <p style={{ fontSize: '1.25rem', fontWeight: 700 }}>{profile.total_trades || 0}</p>
            <p style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Intercambios</p>
          </div>
          <div>
            <p style={{ fontSize: '1.25rem', fontWeight: 700 }}>{userAlbums.length}</p>
            <p style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Álbumes</p>
          </div>
        </div>

        {profile.is_premium && (
          <span className="badge badge-premium" style={{ marginTop: '0.75rem' }}>👑 Premium</span>
        )}
      </div>

      {/* Location */}
      <div className="animate-fade-in-up" style={{
        background: 'var(--color-surface)', borderRadius: 'var(--radius-xl)',
        padding: '1rem', marginBottom: '0.75rem',
        border: '1px solid var(--color-border-light)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontWeight: 600, fontSize: '0.9375rem' }}>📍 GPS Ubicación</p>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
              {profile.lat ? `${profile.lat.toFixed(2)}, ${profile.lng.toFixed(2)}` : 'No configurada'}
            </p>
          </div>
          <button className="btn btn-sm btn-secondary" onClick={handleGetLocation} disabled={locationLoading}>
            {locationLoading ? '...' : 'Actualizar'}
          </button>
        </div>
      </div>

      {/* Settings Form */}
      <div className="animate-fade-in-up" style={{
        background: 'var(--color-surface)', borderRadius: 'var(--radius-xl)',
        padding: '1rem', marginBottom: '0.75rem',
        border: '1px solid var(--color-border-light)',
      }}>
        <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '1rem' }}>⚙️ Configuración de Matches</h3>
        
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '0.375rem' }}>
            Barrio / Zona
          </label>
          <input 
            type="text" 
            value={settingsForm.city} 
            onChange={e => setSettingsForm({...settingsForm, city: e.target.value})}
            placeholder="Ej: Pocitos, Centro..."
            style={{ width: '100%', padding: '0.625rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)', outline: 'none' }}
          />
        </div>

        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '0.375rem' }}>
            Mostrar matches con al menos X figuritas faltantes
          </label>
          <input 
            type="number" 
            min="1"
            value={settingsForm.min_match_stickers} 
            onChange={e => setSettingsForm({...settingsForm, min_match_stickers: e.target.value})}
            style={{ width: '100%', padding: '0.625rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)', outline: 'none' }}
          />
        </div>

        <button 
          className="btn btn-primary" 
          onClick={handleSaveSettings} 
          disabled={savingSettings}
          style={{ width: '100%' }}
        >
          {savingSettings ? 'Guardando...' : '💾 Guardar configuración'}
        </button>
      </div>

      {/* Premium CTA */}
      {!profile.is_premium && (
        <button onClick={() => navigate('/premium')} style={{
          display: 'block', width: '100%', background: 'linear-gradient(135deg, #1e1b4b, #312e81)',
          borderRadius: 'var(--radius-xl)', padding: '1rem', color: 'white', border: 'none',
          cursor: 'pointer', marginBottom: '0.75rem', textAlign: 'left',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.5rem' }}>👑</span>
            <div>
              <p style={{ fontWeight: 700, fontSize: '0.9375rem' }}>Upgrade a Premium</p>
              <p style={{ fontSize: '0.8125rem', opacity: 0.8 }}>Matches ilimitados y más</p>
            </div>
          </div>
        </button>
      )}

      {/* God Admin */}
      {profile.email === 'admin@figusuy.com' && (
        <button onClick={() => navigate('/admin')} style={{
          display: 'block', width: '100%', background: 'linear-gradient(135deg, #0f172a, #1e293b)',
          borderRadius: 'var(--radius-xl)', padding: '1rem', color: 'white', border: 'none',
          cursor: 'pointer', marginBottom: '0.75rem', textAlign: 'left',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.5rem' }}>🔮</span>
            <div>
              <p style={{ fontWeight: 700, fontSize: '0.9375rem' }}>God Admin Panel</p>
              <p style={{ fontSize: '0.8125rem', opacity: 0.7 }}>Gestionar toda la plataforma</p>
            </div>
          </div>
        </button>
      )}

      {/* Sign out */}
      <button className="btn btn-secondary" onClick={handleSignOut} style={{ width: '100%', color: 'var(--color-danger)' }}>
        Cerrar sesión
      </button>
    </div>
  )
}

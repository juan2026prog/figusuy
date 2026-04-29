import React, { useEffect, useState } from 'react'
import { useAdminStore } from '../stores/adminStore'
import { supabase } from '../lib/supabase'

const card = { background: '#ffffff', borderRadius: '1rem', padding: '1.25rem', border: '1px solid #e7e5e4', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }

export default function AdminRoles() {
  const { users, fetchUsers, setUserRole, loading } = useAdminStore()
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchUsers()
  }, [])

  const roles = [
    { value: 'user', label: 'Usuario Estándar', color: '#64748b' },
    { value: 'moderator', label: 'Moderador', color: '#10b981' },
    { value: 'support', label: 'Soporte', color: '#3b82f6' },
    { value: 'comercial', label: 'Comercial', color: '#8b5cf6' },
    { value: 'analista', label: 'Analista', color: '#06b6d4' },
    { value: 'admin', label: 'Administrador', color: '#ea580c' },
    { value: 'god_admin', label: 'God Admin', color: '#7f1d1d' },
  ]

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 20)

  const handleRoleChange = async (userId, newRole) => {
    if (window.confirm(`¿Seguro que quieres cambiar el rol a ${newRole}?`)) {
      await setUserRole(userId, newRole)
    }
  }

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 900, color: '#020617', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span className="material-symbols-outlined" style={{ color: '#ea580c', fontSize: '2rem' }}>admin_panel_settings</span>
          Roles y Permisos
        </h1>
        <p style={{ fontSize: '0.9375rem', color: '#64748b', marginTop: '0.25rem' }}>
          Control de acceso granular para el equipo de FigusUY.
        </p>
      </div>

      <div style={{ ...card, marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <span className="material-symbols-outlined" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>search</span>
            <input 
              type="text" 
              placeholder="Buscar usuario por nombre o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', fontSize: '0.875rem' }}
            />
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '2px solid #f1f5f9' }}>
                <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Usuario</th>
                <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Rol Actual</th>
                <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => {
                const currentRole = user.user_roles?.[0]?.role || 'user'
                return (
                  <tr key={user.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '1rem' }}>
                      <p style={{ fontWeight: 700, margin: 0, fontSize: '0.875rem' }}>{user.name}</p>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>{user.email}</p>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ 
                        padding: '0.25rem 0.625rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 700,
                        background: roles.find(r => r.value === currentRole)?.color + '15',
                        color: roles.find(r => r.value === currentRole)?.color,
                        textTransform: 'uppercase'
                      }}>
                        {roles.find(r => r.value === currentRole)?.label}
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <select 
                        value={currentRole}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        style={{ padding: '0.375rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', fontSize: '0.8125rem', background: 'white' }}
                      >
                        {roles.map(r => (
                          <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

import React, { useEffect, useState } from 'react'
import { useAdminStore } from '../stores/adminStore'
import ConfirmDialog from '../components/ConfirmDialog'

const card = { background: 'var(--admin-panel)', borderRadius: '0.5rem', padding: '1.25rem', border: '1px solid var(--admin-line)' }

export default function AdminRoles() {
  const { users, fetchUsers, setUserRole } = useAdminStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [pendingRoleChange, setPendingRoleChange] = useState(null)

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const roles = [
    { value: 'user', label: 'Usuario Estandar', color: 'var(--admin-muted2)' },
    { value: 'moderator', label: 'Moderador', color: '#10b981' },
    { value: 'support', label: 'Soporte', color: '#3b82f6' },
    { value: 'comercial', label: 'Comercial', color: '#8b5cf6' },
    { value: 'analista', label: 'Analista', color: '#06b6d4' },
    { value: 'admin', label: 'Administrador', color: 'var(--color-primary)' },
    { value: 'god_admin', label: 'God Admin', color: '#7f1d1d' },
  ]

  const filteredUsers = users.filter((u) =>
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 20)

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 900, color: '#f5f5f5', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)', fontSize: '2rem' }}>admin_panel_settings</span>
          Roles y Permisos
        </h1>
        <p style={{ fontSize: '0.9375rem', color: 'var(--admin-muted2)', marginTop: '0.25rem' }}>
          Control de acceso granular para el equipo de FigusUY.
        </p>
      </div>

      <div style={{ ...card, marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <span className="material-symbols-outlined" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--admin-muted)' }}>search</span>
            <input
              type="text"
              placeholder="Buscar usuario por nombre o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: '0.75rem', border: '1px solid var(--admin-line)', fontSize: '0.875rem' }}
            />
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '2px solid #f1f5f9' }}>
                <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--admin-muted2)', textTransform: 'uppercase' }}>Usuario</th>
                <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--admin-muted2)', textTransform: 'uppercase' }}>Rol Actual</th>
                <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--admin-muted2)', textTransform: 'uppercase' }}>Accion</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => {
                const currentRole = user.user_roles?.[0]?.role || 'user'
                return (
                  <tr key={user.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '1rem' }}>
                      <p style={{ fontWeight: 700, margin: 0, fontSize: '0.875rem' }}>{user.name}</p>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--admin-muted2)' }}>{user.email}</p>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{
                        padding: '0.25rem 0.625rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 700,
                        background: roles.find((r) => r.value === currentRole)?.color + '15',
                        color: roles.find((r) => r.value === currentRole)?.color,
                        textTransform: 'uppercase'
                      }}>
                        {roles.find((r) => r.value === currentRole)?.label}
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <select
                        value={currentRole}
                        onChange={(e) => setPendingRoleChange({ userId: user.id, newRole: e.target.value })}
                        style={{ padding: '0.375rem 0.75rem', borderRadius: '0.5rem', border: '1px solid var(--admin-line)', fontSize: '0.8125rem', background: 'var(--admin-panel2)' }}
                      >
                        {roles.map((r) => (
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

      <ConfirmDialog
        isOpen={!!pendingRoleChange}
        title="Cambiar rol"
        message={pendingRoleChange ? `Se actualizara el rol a ${pendingRoleChange.newRole}.` : ''}
        confirmText="Confirmar"
        cancelText="Cancelar"
        variant="info"
        onConfirm={async () => {
          await setUserRole(pendingRoleChange.userId, pendingRoleChange.newRole)
          setPendingRoleChange(null)
        }}
        onCancel={() => setPendingRoleChange(null)}
      />
    </div>
  )
}

import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useLogoutStore } from '../stores/logoutStore'
import { useAuthStore } from '../stores/authStore'
import ConfirmDialog from './ConfirmDialog'

export default function GlobalLogoutDialog() {
  const { isConfirmOpen, closeConfirm } = useLogoutStore()
  const signOut = useAuthStore(state => state.signOut)
  const navigate = useNavigate()

  const handleConfirm = async () => {
    try {
      await signOut()
      closeConfirm()
      navigate('/', { replace: true })
    } catch (err) {
      console.error(err)
      closeConfirm()
      navigate('/', { replace: true })
    }
  }

  return (
    <ConfirmDialog
      isOpen={isConfirmOpen}
      title="¿Cerrar Sesión?"
      message="¿Estás seguro que quieres salir de tu cuenta?"
      confirmText="Salir"
      cancelText="Volver"
      onConfirm={handleConfirm}
      onCancel={closeConfirm}
    />
  )
}

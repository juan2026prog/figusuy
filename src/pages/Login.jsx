"use client"

import React, { Suspense } from 'react'
import { useSearchParams } from 'react-router-dom'
import AuthPanel from '../components/AuthPanel'

export const dynamic = "force-dynamic"

function LoginContent() {
  const [searchParams] = useSearchParams()
  const loginType = searchParams.get('type')

  return (
    <div style={{ minHeight: '100vh', background: '#0b0b0b', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: '1080px', margin: '0 auto' }}>
        <AuthPanel initialType={loginType} mode="page" />
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ color: '#fff', textAlign: 'center', marginTop: '20vh' }}>Cargando...</div>}>
      <LoginContent />
    </Suspense>
  )
}

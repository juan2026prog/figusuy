import React from 'react'
import { useSearchParams } from 'react-router-dom'
import AuthPanel from '../components/AuthPanel'

export default function LoginPage() {
  const [searchParams] = useSearchParams()
  const loginType = searchParams.get('type')

  return (
    <div style={{ minHeight: '100vh', background: '#0b0b0b', padding: '1.5rem' }}>
      <div style={{ width: '100%', maxWidth: '1080px', margin: '0 auto' }}>
        <AuthPanel initialType={loginType} mode="page" />
      </div>
    </div>
  )
}

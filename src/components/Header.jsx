import React from 'react'

export default function Header({ title, subtitle, rightAction }) {
  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '1.5rem',
    }}>
      <div>
        {subtitle && (
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', fontWeight: 500, marginBottom: '0.125rem' }}>
            {subtitle}
          </p>
        )}
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
          {title}
        </h1>
      </div>
      {rightAction && <div>{rightAction}</div>}
    </header>
  )
}

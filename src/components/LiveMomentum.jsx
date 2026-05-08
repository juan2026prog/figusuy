import React from 'react'
import { formatRelativeTime } from '../lib/liveMomentum'

export function LiveBadge({ children, tone = 'orange', pulse = false }) {
  return (
    <span className={`lm-badge ${tone} ${pulse ? 'pulse' : ''}`}>
      {children}
    </span>
  )
}

export function LiveStat({ value, label, tone = 'orange', detail }) {
  return (
    <div className={`lm-stat ${tone}`}>
      <b>{value}</b>
      <span>{label}</span>
      {detail ? <small>{detail}</small> : null}
    </div>
  )
}

export function LiveFeed({ title = 'Ahora en FigusUY', items = [], refreshedAt }) {
  if (!items.length) return null

  return (
    <section className="lm-feed">
      <div className="lm-feed-head">
        <div>
          <div className="lm-kicker">Pulso en vivo</div>
          <h3>{title}</h3>
        </div>
        {refreshedAt ? <span className="lm-refresh">Actualizado {formatRelativeTime(refreshedAt)}</span> : null}
      </div>
      <div className="lm-feed-list">
        {items.map((item) => (
          <article key={item.id} className={`lm-feed-item ${item.tone || 'orange'}`}>
            <div className="lm-dot" />
            <div>
              <strong>{item.label}</strong>
              <p>{item.message}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

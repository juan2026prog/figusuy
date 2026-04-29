import React from 'react'

export function SkeletonLine({ width = '100%', height = '0.875rem', style }) {
  return (
    <div className="skeleton-pulse" style={{ width, height, borderRadius: 'var(--radius-md)', ...style }} />
  )
}

export function SkeletonCircle({ size = '2.75rem', style }) {
  return (
    <div className="skeleton-pulse" style={{ width: size, height: size, borderRadius: 'var(--radius-full)', flexShrink: 0, ...style }} />
  )
}

export function SkeletonCard({ lines = 3, avatar = false, style }) {
  return (
    <div className="card" style={{ ...style }}>
      <div className="flex-center gap-md" style={{ justifyContent: 'flex-start' }}>
        {avatar && <SkeletonCircle />}
        <div className="flex-1 flex-col gap-sm">
          <SkeletonLine width="60%" height="1rem" />
          {Array.from({ length: lines - 1 }).map((_, i) => (
            <SkeletonLine key={i} width={`${80 - i * 15}%`} />
          ))}
        </div>
      </div>
    </div>
  )
}

export function SkeletonGrid({ count = 6 }) {
  return (
    <div className="stat-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="stat-card">
          <SkeletonLine width="2rem" height="2rem" style={{ margin: '0 auto 0.5rem', borderRadius: 'var(--radius-md)' }} />
          <SkeletonLine width="60%" height="1.25rem" style={{ margin: '0 auto 0.25rem' }} />
          <SkeletonLine width="80%" height="0.625rem" style={{ margin: '0 auto' }} />
        </div>
      ))}
    </div>
  )
}

export function ChatListSkeleton({ count = 4 }) {
  return (
    <div className="flex-col gap-sm">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card flex-center gap-md" style={{ opacity: 1 - i * 0.15 }}>
          <SkeletonCircle />
          <div className="flex-1 flex-col gap-xs">
            <div className="flex-between">
              <SkeletonLine width="40%" height="0.9375rem" />
              <SkeletonLine width="2rem" height="0.625rem" />
            </div>
            <SkeletonLine width="70%" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function MatchCardSkeleton({ count = 3 }) {
  return (
    <div className="flex-col gap-md">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card" style={{ opacity: 1 - i * 0.2 }}>
          <div className="flex-between mb-md">
            <div className="flex-center gap-md">
              <SkeletonCircle />
              <div className="flex-col gap-xs">
                <SkeletonLine width="7rem" height="1rem" />
                <SkeletonLine width="5rem" height="0.625rem" />
              </div>
            </div>
            <SkeletonLine width="3rem" height="2.5rem" style={{ borderRadius: 'var(--radius-lg)' }} />
          </div>
          <SkeletonLine width="100%" height="2.5rem" style={{ borderRadius: 'var(--radius-xl)' }} />
        </div>
      ))}
    </div>
  )
}

export function AlbumCardSkeleton({ count = 2 }) {
  return (
    <div className="flex-col gap-md">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card flex-center gap-md" style={{ opacity: 1 - i * 0.2 }}>
          <SkeletonLine width="3.5rem" height="3.5rem" style={{ borderRadius: 'var(--radius-xl)', flexShrink: 0 }} />
          <div className="flex-1 flex-col gap-xs">
            <SkeletonLine width="60%" height="1rem" />
            <SkeletonLine width="40%" />
            <SkeletonLine width="100%" height="0.375rem" style={{ borderRadius: 'var(--radius-full)', marginTop: '0.25rem' }} />
          </div>
        </div>
      ))}
    </div>
  )
}

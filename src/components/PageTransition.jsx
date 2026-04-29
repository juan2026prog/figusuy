import React from 'react'
import { useLocation, useOutlet } from 'react-router-dom'
import { useRef, useEffect, useState } from 'react'

/**
 * Wraps route outlet with a subtle fade transition on route change.
 */
export default function PageTransition() {
  const location = useLocation()
  const outlet = useOutlet()
  const [displayedOutlet, setDisplayedOutlet] = useState(outlet)
  const [transitioning, setTransitioning] = useState(false)
  const prevKey = useRef(location.key)

  useEffect(() => {
    if (location.key !== prevKey.current) {
      prevKey.current = location.key
      setTransitioning(true)
      const timer = setTimeout(() => {
        setDisplayedOutlet(outlet)
        setTransitioning(false)
      }, 150)
      return () => clearTimeout(timer)
    } else {
      setDisplayedOutlet(outlet)
    }
  }, [location.key, outlet])

  return (
    <div
      className={transitioning ? 'page-transition-exit' : 'page-transition-enter'}
      style={{ willChange: 'opacity, transform' }}
    >
      {displayedOutlet}
    </div>
  )
}

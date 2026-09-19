import React, { useEffect, useRef } from 'react'
import 'leaflet/dist/leaflet.css'
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet'
import L from 'leaflet'

// Fix standard marker icons in Webpack/Vite
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// Custom Store / Hub Icon
const storeIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

// Custom Safe Point Icon
const safePointIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

// Custom User / Person Icon
const personIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

function MapViewController({ center, zoom = 13 }) {
  const map = useMap()
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, zoom, { animate: true })
    }
  }, [center, zoom, map])
  return null
}

/**
 * Reusable Map Component for FigusUY
 * Supports STORES (exact pins), SAFE_POINTS (exact pins) and PEOPLE/MATCHES (approximate areas)
 */
export default function FigusMap({
  center = [-34.9011, -56.1645], // Default Montevideo
  zoom = 13,
  items = [], // Array of points { id, lat, lng, title, subtitle, type: 'store' | 'safe_point' | 'person', raw: any }
  selectedItemId = null,
  onItemSelect,
  height = '400px',
  className = '',
  showAttribution = true
}) {
  const mapCenter = (center && center[0] && center[1]) ? center : [-34.9011, -56.1645]

  return (
    <div
      className={`figus-map-container ${className}`}
      style={{
        height,
        width: '100%',
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1px solid var(--color-border, #334155)',
        position: 'relative'
      }}
    >
      <MapContainer
        center={mapCenter}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution={showAttribution ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' : ''}
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapViewController center={mapCenter} zoom={zoom} />

        {items.map((item) => {
          if (!item.lat || !item.lng) return null
          const isSelected = selectedItemId && selectedItemId === item.id
          const isPerson = item.type === 'person'
          const isSafePoint = item.type === 'safe_point' || item.type === 'safe_exchange_zone'

          let markerIcon = storeIcon
          if (isPerson) markerIcon = personIcon
          else if (isSafePoint) markerIcon = safePointIcon

          return (
            <React.Fragment key={item.id}>
              {isPerson && (
                <Circle
                  center={[item.lat, item.lng]}
                  radius={800} // Approximate 800m neighborhood radius
                  pathOptions={{
                    color: '#3b82f6',
                    fillColor: '#3b82f6',
                    fillOpacity: 0.15,
                    weight: 1,
                    dashArray: '4, 4'
                  }}
                />
              )}

              <Marker
                position={[item.lat, item.lng]}
                icon={markerIcon}
                eventHandlers={{
                  click: () => {
                    if (onItemSelect) onItemSelect(item)
                  }
                }}
              >
                <Popup>
                  <div style={{ minWidth: '160px', color: '#0f172a' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '4px' }}>
                      {item.title}
                    </div>
                    {item.subtitle && (
                      <div style={{ fontSize: '0.75rem', color: '#475569', marginBottom: '6px' }}>
                        {item.subtitle}
                      </div>
                    )}
                    {item.details && (
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {item.details}
                      </div>
                    )}
                    {item.actionLabel && (
                      <button
                        onClick={() => onItemSelect && onItemSelect(item)}
                        style={{
                          marginTop: '8px',
                          width: '100%',
                          padding: '4px 8px',
                          background: '#f97316',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          cursor: 'pointer'
                        }}
                      >
                        {item.actionLabel}
                      </button>
                    )}
                  </div>
                </Popup>
              </Marker>
            </React.Fragment>
          )
        })}
      </MapContainer>
    </div>
  )
}

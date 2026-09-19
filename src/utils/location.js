/**
 * Helper to securely and gracefully handle geolocation on explicit user action.
 * Resolves to { lat, lng, accuracy } or throws a user-friendly string error.
 * NOTE: Continuous watchPosition is intentionally omitted for privacy and battery preservation.
 */
export async function getUserLocation(timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      return reject('Tu navegador no soporta ubicación. Podés cargar tu zona manualmente.');
    }

    const options = {
      enableHighAccuracy: true,
      timeout: timeoutMs,
      maximumAge: 0
    };

    const onSuccess = (position) => {
      resolve({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy || null
      });
    };

    const onError = (error) => {
      switch (error.code) {
        case error.PERMISSION_DENIED:
          reject('No diste permiso de ubicación. Podés cargar tu zona manualmente.');
          break;
        case error.POSITION_UNAVAILABLE:
          reject('No pudimos detectar tu ubicación exacta. Elegí tu zona manualmente.');
          break;
        case error.TIMEOUT:
          reject('La ubicación tardó demasiado. Probá de nuevo o elegí tu zona.');
          break;
        default:
          reject('Ocurrió un error al intentar obtener tu ubicación.');
          break;
      }
    };

    navigator.geolocation.getCurrentPosition(onSuccess, onError, options);
  });
}

export const URUGUAY_DEPARTMENTS = [
  'Artigas', 'Canelones', 'Cerro Largo', 'Colonia', 'Durazno', 'Flores', 
  'Florida', 'Lavalleja', 'Maldonado', 'Montevideo', 'Paysandú', 'Río Negro', 
  'Rivera', 'Rocha', 'Salto', 'San José', 'Soriano', 'Tacuarembó', 'Treinta y Tres'
];

/**
 * Calculates Haversine distance in kilometers between two coordinates.
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Formats a distance in km to user-friendly text
 */
export function formatDistance(km) {
  if (km === null || km === undefined || km === Infinity) return 'Distancia no disponible';
  if (km < 1) return `~${Math.round(km * 1000)} m`;
  if (km < 10) return `~${km.toFixed(1)} km`;
  return `~${Math.round(km)} km`;
}

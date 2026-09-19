/**
 * Helper to securely and gracefully handle geolocation on explicit user action.
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
 * Validates with null / undefined / finite check (including 0 degree coordinates).
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const isValid = [lat1, lon1, lat2, lon2].every(
    (v) => v !== null && v !== undefined && Number.isFinite(Number(v))
  );
  if (!isValid) return Infinity;

  const l1 = Number(lat1);
  const g1 = Number(lon1);
  const l2 = Number(lat2);
  const g2 = Number(lon2);

  const R = 6371; // km
  const dLat = (l2 - l1) * Math.PI / 180;
  const dLon = (g2 - g1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(l1 * Math.PI / 180) * Math.cos(l2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Formats a distance in km to user-friendly text
 */
export function formatDistance(km) {
  if (km === null || km === undefined || !Number.isFinite(Number(km)) || km === Infinity) {
    return 'Distancia no disponible';
  }
  const n = Number(km);
  if (n < 1) return `~${Math.round(n * 1000)} m`;
  if (n < 10) return `~${n.toFixed(1)} km`;
  return `~${Math.round(n)} km`;
}

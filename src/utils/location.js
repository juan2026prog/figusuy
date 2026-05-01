/**
 * Helper to securely and gracefully handle geolocation.
 * Resolves to { lat, lng } or throws a user-friendly string error.
 */
export async function getUserLocation(timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
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
        lng: position.coords.longitude
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

/**
 * Watches user location and calls a callback on change.
 * Returns the watchId to allow clearing.
 */
export function watchUserLocation(onSuccess, onError, options = {}) {
  if (!navigator.geolocation) {
    onError('No soportado');
    return null;
  }
  
  const defaultOptions = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 0,
    ...options
  };

  return navigator.geolocation.watchPosition(
    (pos) => onSuccess({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
    (err) => onError(err),
    defaultOptions
  );
}

/**
 * Reverse geocoding using Nominatim (OpenStreetMap).
 * Respects usage policy for low volume.
 */
export async function getAddressFromCoords(lat, lng) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: {
          'Accept-Language': 'es',
          'User-Agent': 'FigusUY-App'
        }
      }
    );
    const data = await response.json();
    
    const addr = data.address || {};
    return {
      neighborhood: addr.neighbourhood || addr.suburb || addr.residential || addr.village || '',
      city: addr.city || addr.town || addr.municipality || '',
      department: addr.state || addr.province || '',
      display_name: data.display_name
    };
  } catch (err) {
    console.error('Reverse Geocoding Error:', err);
    return null;
  }
}

export const URUGUAY_DEPARTMENTS = [
  'Artigas', 'Canelones', 'Cerro Largo', 'Colonia', 'Durazno', 'Flores', 
  'Florida', 'Lavalleja', 'Maldonado', 'Montevideo', 'Paysandú', 'Río Negro', 
  'Rivera', 'Rocha', 'Salto', 'San José', 'Soriano', 'Tacuarembó', 'Treinta y Tres'
];

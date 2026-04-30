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

export const URUGUAY_DEPARTMENTS = [
  'Artigas', 'Canelones', 'Cerro Largo', 'Colonia', 'Durazno', 'Flores', 
  'Florida', 'Lavalleja', 'Maldonado', 'Montevideo', 'Paysandú', 'Río Negro', 
  'Rivera', 'Rocha', 'Salto', 'San José', 'Soriano', 'Tacuarembó', 'Treinta y Tres'
];

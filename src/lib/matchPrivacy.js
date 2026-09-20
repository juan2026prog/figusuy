/**
 * Shared mathematical & privacy calculation module for Match Engine & Frontend
 */

export function haversineDistance(lat1, lng1, lat2, lng2) {
  const isValid = [lat1, lng1, lat2, lng2].every(
    (v) => v !== null && v !== undefined && Number.isFinite(Number(v))
  );
  if (!isValid) return Infinity;

  const l1 = Number(lat1);
  const g1 = Number(lng1);
  const l2 = Number(lat2);
  const g2 = Number(lng2);

  const R = 6371;
  const dLat = (l2 - l1) * (Math.PI / 180);
  const dLng = (g2 - g1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(l1 * (Math.PI / 180)) *
      Math.cos(l2 * (Math.PI / 180)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function distanceLabel(km) {
  if (km === Infinity || !Number.isFinite(km)) return "Desconocida";
  if (km < 1) return `~${Math.round(km * 1000)} m`;
  if (km < 10) return `~${km.toFixed(1)} km`;
  return `~${Math.round(km)} km`;
}

export const URUGUAY_DEPARTMENT_CENTROIDS = {
  'Montevideo': { lat: -34.9011, lng: -56.1645 },
  'Canelones': { lat: -34.5228, lng: -56.2778 },
  'Maldonado': { lat: -34.9000, lng: -54.9500 },
  'Rocha': { lat: -34.4833, lng: -54.3333 },
  'Treinta y Tres': { lat: -33.2333, lng: -54.3833 },
  'Cerro Largo': { lat: -32.3667, lng: -54.1833 },
  'Rivera': { lat: -30.9025, lng: -55.5506 },
  'Artigas': { lat: -30.4000, lng: -56.4667 },
  'Salto': { lat: -31.3833, lng: -57.9667 },
  'Paysandú': { lat: -32.3214, lng: -58.0756 },
  'Río Negro': { lat: -32.7500, lng: -57.3000 },
  'Soriano': { lat: -33.5333, lng: -58.3000 },
  'Colonia': { lat: -34.4626, lng: -57.8398 },
  'San José': { lat: -34.3375, lng: -56.7136 },
  'Flores': { lat: -33.5167, lng: -56.9000 },
  'Florida': { lat: -34.1000, lng: -56.2167 },
  'Lavalleja': { lat: -34.3759, lng: -55.2378 },
  'Durazno': { lat: -33.3833, lng: -56.5333 },
  'Tacuarembó': { lat: -31.7333, lng: -55.9833 }
};

export function getDepartmentCentroid(department) {
  if (!department || typeof department !== 'string') return null;
  const clean = department.trim().toLowerCase();
  for (const [dept, coords] of Object.entries(URUGUAY_DEPARTMENT_CENTROIDS)) {
    if (dept.toLowerCase() === clean) {
      return coords;
    }
  }
  return null;
}

export function getApproximatePoint(lat, lng, userId) {
  if (
    lat === null ||
    lat === undefined ||
    lng === null ||
    lng === undefined ||
    !Number.isFinite(Number(lat)) ||
    !Number.isFinite(Number(lng))
  ) {
    return null;
  }

  const gridLat = Math.round(Number(lat) * 100) / 100;
  const gridLng = Math.round(Number(lng) * 100) / 100;

  let hash = 0;
  const idStr = String(userId || '');
  for (let i = 0; i < idStr.length; i++) {
    hash = (hash << 5) - hash + idStr.charCodeAt(i);
    hash |= 0;
  }
  const jitterLat = ((hash % 50) / 100 - 0.25) * 0.005;
  const jitterLng = (((hash >> 3) % 50) / 100 - 0.25) * 0.005;

  return {
    lat: Math.round((gridLat + jitterLat) * 1000) / 1000,
    lng: Math.round((gridLng + jitterLng) * 1000) / 1000,
  };
}


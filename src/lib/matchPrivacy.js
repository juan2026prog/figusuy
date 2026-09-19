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

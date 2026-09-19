/**
 * Geocoding Service Adapter for FigusUY
 * Provides cached, debounced, normalized geocoding and reverse geocoding
 * Supports area mode (for collectors/privacy) and address mode (for stores/hubs).
 */

const geocodeCache = new Map();
const reverseCache = new Map();

export const URUGUAY_DEPARTMENTS = [
  'Artigas', 'Canelones', 'Cerro Largo', 'Colonia', 'Durazno', 'Flores',
  'Florida', 'Lavalleja', 'Maldonado', 'Montevideo', 'Paysandú', 'Río Negro',
  'Rivera', 'Rocha', 'Salto', 'San José', 'Soriano', 'Tacuarembó', 'Treinta y Tres'
];

/**
 * Normalizes department string from various formats
 */
export function normalizeDepartment(dept) {
  if (!dept) return '';
  let clean = String(dept)
    .replace(/Department of /i, '')
    .replace(/Departamento de /i, '')
    .replace(/ Department/i, '')
    .trim();
  
  const match = URUGUAY_DEPARTMENTS.find(d => d.toLowerCase() === clean.toLowerCase());
  return match || clean;
}

/**
 * Normalizes neighborhood and city names
 */
export function normalizeLocationParts(addressObj = {}) {
  const neighborhood = addressObj.neighbourhood || addressObj.suburb || addressObj.residential || addressObj.village || addressObj.quarter || '';
  const city = addressObj.city || addressObj.town || addressObj.municipality || addressObj.county || '';
  const department = normalizeDepartment(addressObj.state || addressObj.province || '');

  return {
    neighborhood: neighborhood.trim(),
    city: city.trim(),
    department: department.trim(),
    display_name: [neighborhood, city, department].filter(Boolean).join(', ')
  };
}

/**
 * Geocode a query string with caching and area/address mode filtering
 * @param {string} query 
 * @param {Object} options { mode: 'area' | 'address', countryCode: 'uy', limit: number }
 */
export async function geocode(query, options = {}) {
  const { mode = 'area', countryCode = 'uy', limit = 5 } = options;
  const cleanQuery = query.trim().toLowerCase();
  const cacheKey = `${mode}:${countryCode}:${cleanQuery}`;

  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey);
  }

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=${limit}&countrycodes=${countryCode}&q=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      headers: {
        'Accept-Language': 'es',
        'User-Agent': 'FigusUY-App/2.0'
      }
    });

    if (!res.ok) throw new Error('Geocoding service unavailable');
    const data = await res.json();

    const normalizedResults = data.map(item => {
      const parts = normalizeLocationParts(item.address || {});
      const lat = parseFloat(item.lat);
      const lng = parseFloat(item.lon);

      return {
        lat,
        lng,
        name: item.name || parts.neighborhood || parts.city || item.display_name,
        display_name: item.display_name,
        neighborhood: parts.neighborhood,
        city: parts.city,
        department: parts.department,
        type: item.type,
        category: item.category,
        isArea: ['administrative', 'city', 'suburb', 'neighbourhood', 'residential'].includes(item.type) || item.category === 'boundary'
      };
    });

    // In area mode, prioritize or filter to administrative/neighborhood boundaries
    let filtered = normalizedResults;
    if (mode === 'area') {
      filtered = normalizedResults.filter(item => item.isArea || item.neighborhood || item.department);
      if (filtered.length === 0) filtered = normalizedResults; // fallback
    }

    geocodeCache.set(cacheKey, filtered);
    return filtered;
  } catch (error) {
    console.warn('Geocode error:', error);
    return [];
  }
}

/**
 * Reverse geocode coordinates to obtain administrative area details
 * @param {number} lat 
 * @param {number} lng 
 */
export async function reverseGeocode(lat, lng) {
  if (!lat || !lng) return null;
  const roundedLat = Number(lat).toFixed(4);
  const roundedLng = Number(lng).toFixed(4);
  const cacheKey = `${roundedLat},${roundedLng}`;

  if (reverseCache.has(cacheKey)) {
    return reverseCache.get(cacheKey);
  }

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
    const res = await fetch(url, {
      headers: {
        'Accept-Language': 'es',
        'User-Agent': 'FigusUY-App/2.0'
      }
    });

    if (!res.ok) throw new Error('Reverse geocoding error');
    const data = await res.json();
    const parts = normalizeLocationParts(data.address || {});

    const result = {
      neighborhood: parts.neighborhood,
      city: parts.city,
      department: parts.department,
      display_name: data.display_name || parts.display_name
    };

    reverseCache.set(cacheKey, result);
    return result;
  } catch (err) {
    console.warn('Reverse Geocoding Error:', err);
    return null;
  }
}

/**
 * Clear geocoding in-memory caches
 */
export function clearGeocodeCache() {
  geocodeCache.clear();
  reverseCache.clear();
}

import { supabase } from './supabase'

/**
 * Geocoding Service Adapter for FigusUY
 * Proxies geocoding requests through Supabase Edge Functions with local caching & fallback
 */

const geocodeCache = new Map();
const reverseCache = new Map();

export const URUGUAY_DEPARTMENTS = [
  'Artigas', 'Canelones', 'Cerro Largo', 'Colonia', 'Durazno', 'Flores',
  'Florida', 'Lavalleja', 'Maldonado', 'Montevideo', 'Paysandú', 'Río Negro',
  'Rivera', 'Rocha', 'Salto', 'San José', 'Soriano', 'Tacuarembó', 'Treinta y Tres'
];

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
 */
export async function geocode(query, options = {}) {
  const { mode = 'area', countryCode = 'uy', limit = 5 } = options;
  if (!query || typeof query !== 'string' || query.trim().length < 2) return [];

  const cleanQuery = query.trim().toLowerCase();
  const cacheKey = `${mode}:${countryCode}:${cleanQuery}`;

  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey);
  }

  try {
    // 1. Try secure Supabase Edge Function first
    const { data, error } = await supabase.functions.invoke('geocode-location', {
      body: { query: cleanQuery, mode, countryCode, limit }
    });

    if (!error && data?.results && Array.isArray(data.results)) {
      geocodeCache.set(cacheKey, data.results);
      return data.results;
    }
  } catch (err) {
    console.warn('Edge function geocode error, falling back:', err);
  }

  // 2. Client-side fallback if edge function is unreachable
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

    geocodeCache.set(cacheKey, normalizedResults);
    return normalizedResults;
  } catch (fallbackError) {
    console.warn('Geocode fallback error:', fallbackError);
    return [];
  }
}

/**
 * Reverse geocode coordinates to obtain administrative area details
 */
export async function reverseGeocode(lat, lng) {
  const numLat = Number(lat);
  const numLng = Number(lng);
  if (!Number.isFinite(numLat) || !Number.isFinite(numLng)) return null;

  const roundedLat = numLat.toFixed(4);
  const roundedLng = numLng.toFixed(4);
  const cacheKey = `${roundedLat},${roundedLng}`;

  if (reverseCache.has(cacheKey)) {
    return reverseCache.get(cacheKey);
  }

  try {
    // 1. Try secure Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('reverse-geocode-location', {
      body: { lat: numLat, lng: numLng }
    });

    if (!error && data?.data) {
      reverseCache.set(cacheKey, data.data);
      return data.data;
    }
  } catch (err) {
    console.warn('Edge function reverse geocode error, falling back:', err);
  }

  // 2. Client fallback
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${numLat}&lon=${numLng}&zoom=18&addressdetails=1`;
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
    console.warn('Reverse Geocoding Fallback Error:', err);
    return null;
  }
}

export function clearGeocodeCache() {
  geocodeCache.clear();
  reverseCache.clear();
}

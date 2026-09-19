import { supabase } from './supabase'

/**
 * Geocoding Service Adapter for FigusUY
 * Proxies geocoding requests exclusively through Supabase Edge Functions with local caching.
 * CRITICAL PRIVACY RULE: Reverse geocode of precise GPS is FAIL-CLOSED (never falls back to client third-party requests).
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
 * Geocode a query string with caching and area/address mode filtering.
 * Centralized via Edge Function with local fallback only for non-GPS public text strings if needed.
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
    const { data, error } = await supabase.functions.invoke('geocode-location', {
      body: { query: cleanQuery, mode, countryCode, limit }
    });

    if (!error && data?.results && Array.isArray(data.results)) {
      geocodeCache.set(cacheKey, data.results);
      return data.results;
    }
  } catch (err) {
    console.warn('Edge function geocode unavailable:', err);
  }

  return [];
}

/**
 * Reverse geocode coordinates to obtain administrative area details.
 * FAIL-CLOSED: Precise user GPS is NEVER sent from the browser directly to external providers.
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
    const { data, error } = await supabase.functions.invoke('reverse-geocode-location', {
      body: { lat: numLat, lng: numLng }
    });

    if (!error && data?.data) {
      reverseCache.set(cacheKey, data.data);
      return data.data;
    }
  } catch (err) {
    console.warn('Edge function reverse geocode unavailable:', err);
  }

  // Fail-closed: do NOT send precise GPS from browser to Nominatim
  return null;
}

export function clearGeocodeCache() {
  geocodeCache.clear();
  reverseCache.clear();
}

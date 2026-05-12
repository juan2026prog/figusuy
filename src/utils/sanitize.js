/**
 * sanitize.js
 * Global helper for Unicode/UTF-8 normalization.
 * Prevents broken characters and Mojibake (e.g. "Ã¡" instead of "á").
 */

export function sanitizeText(text = "") {
  if (typeof text !== 'string') return text;
  return text.normalize("NFC");
}

function isPlainObject(obj) {
  return obj !== null && typeof obj === 'object' && Object.getPrototypeOf(obj) === Object.prototype;
}

export function sanitizeObject(obj) {
  if (!obj) return obj;
  if (typeof obj === 'string') return sanitizeText(obj);
  if (Array.isArray(obj)) return obj.map(item => sanitizeObject(item));
  if (isPlainObject(obj)) {
    const newObj = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        newObj[key] = sanitizeObject(obj[key]);
      }
    }
    return newObj;
  }
  // Return Dates, Files, Blob, etc as-is
  return obj;
}

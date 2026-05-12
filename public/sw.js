// ============================================================
// FigusUY — Service Worker
// Purpose: Cache static assets, provide offline fallback.
// NEVER caches: /api, /auth, /admin, /checkout, /account,
//               /profile, Supabase endpoints, payment data.
// ============================================================

const CACHE_NAME = 'figusuy-v3';
const OFFLINE_URL = '/offline.html';

// Static assets to pre-cache on install
const PRECACHE_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/icons/icon-192x192.svg',
  '/icons/icon-512x512.svg',
];

// ── Patterns that must NEVER be cached ──────────────────────
const NEVER_CACHE_PATTERNS = [
  /^\/api\//,
  /^\/auth\//,
  /^\/admin/,
  /^\/checkout/,
  /^\/account/,
  /^\/profile/,
  /^\/business/,
  /^\/influencer/,
  /^\/premium/,
  /^\/referidos/,
  /supabase\.co/,
  /supabase\.in/,
  /\.supabase\./,
  /paypal\.com/,
  /facebook\.net/,
  /connect\.facebook/,
  /sb-.*-auth-token/,
];

/**
 * Check whether a URL should be excluded from caching.
 */
function shouldNeverCache(url) {
  const urlObj = new URL(url);
  const pathname = urlObj.pathname;
  const fullUrl = urlObj.href;

  return NEVER_CACHE_PATTERNS.some(
    (pattern) => pattern.test(pathname) || pattern.test(fullUrl)
  );
}

// ── Install: Pre-cache critical assets ──────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ── Activate: Clean old caches, claim clients ───────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ── Fetch: Stale-while-revalidate for safe assets ───────────
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle GET requests
  if (request.method !== 'GET') return;

  // Ignore non-http/https protocols (e.g., chrome-extension://)
  if (!request.url.startsWith('http')) return;

  // Never cache sensitive routes
  if (shouldNeverCache(request.url)) return;

  // Navigation requests (HTML pages) — network-first with offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Only cache successful navigation responses that aren't redirects to protected routes
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, clone);
            });
          }
          return response;
        })
        .catch(() =>
          caches
            .match(request)
            .then((cached) => cached || caches.match(OFFLINE_URL))
        )
    );
    return;
  }

  // Static assets (JS, CSS, images, fonts) — stale-while-revalidate
  if (isStaticAsset(request.url)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetchPromise = fetch(request)
          .then((response) => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, clone);
              });
            }
            return response;
          })
          .catch(() => cached);

        return cached || fetchPromise;
      })
    );
    return;
  }
});

/**
 * Determine if a URL is a static asset suitable for caching.
 */
function isStaticAsset(url) {
  const urlObj = new URL(url);
  const pathname = urlObj.pathname;

  // Cache JS/CSS bundles, images, fonts, SVGs
  return /\.(js|css|png|jpg|jpeg|gif|webp|avif|svg|woff2?|ttf|eot|ico)(\?.*)?$/.test(
    pathname
  );
}

// ── Message handler for cache busting ───────────────────────
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

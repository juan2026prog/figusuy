# 📱 FigusUY — PWA Setup Guide

> **Versión:** 1.0  
> **Fecha:** 2026-05-09  
> **Stack:** React + Vite + React Router DOM  
> **Deploy:** Vercel  

---

## 📋 Resumen

FigusUY ahora es una **Progressive Web App (PWA) instalable** en Android y iOS.  
La capa PWA agrega:

- ✅ Instalación en pantalla de inicio (Android Chrome & Safari iOS)
- ✅ Ícono y nombre de app correcto
- ✅ Modo standalone (sin barra de navegación del browser)
- ✅ Caché de assets estáticos para carga más rápida
- ✅ Página offline con diseño coherente
- ✅ Actualización automática de versiones
- ✅ **Sin cambios** en lógica, diseño, auth, pagos ni rutas

---

## 📁 Archivos Creados

| Archivo | Ubicación | Propósito |
|---------|-----------|-----------|
| `manifest.webmanifest` | `/public/` | Web App Manifest — define nombre, íconos, colores, shortcuts |
| `sw.js` | `/public/` | Service Worker — caché de assets, fallback offline |
| `offline.html` | `/public/` | Página offline — se muestra sin conexión |
| `icons/icon-192x192.svg` | `/public/icons/` | Ícono app 192px (SVG) |
| `icons/icon-512x512.svg` | `/public/icons/` | Ícono app 512px (SVG) |
| `icons/icon-512x512.png` | `/public/icons/` | Ícono app 512px (PNG) |
| `icons/maskable-icon-192x192.svg` | `/public/icons/` | Ícono maskable 192px |
| `icons/maskable-icon-512x512.svg` | `/public/icons/` | Ícono maskable 512px |
| `icons/apple-touch-icon.svg` | `/public/icons/` | Apple Touch Icon 180px |

## 📝 Archivos Modificados

| Archivo | Cambio |
|---------|--------|
| `index.html` | Meta tags PWA + manifest link + SW registration script |
| `vercel.json` | Headers para `sw.js` (no-cache) y manifest (content-type) |

---

## 🔧 Web App Manifest

El archivo `manifest.webmanifest` contiene:

```json
{
  "name": "FigusUY — Intercambiá Figuritas",
  "short_name": "FigusUY",
  "display": "standalone",
  "background_color": "#060606",
  "theme_color": "#ea580c",
  "start_url": "/",
  "scope": "/",
  "orientation": "portrait-primary",
  "lang": "es",
  "categories": ["social", "entertainment", "lifestyle"]
}
```

### Shortcuts

La app tiene 3 shortcuts desde el ícono:
- **Mi Álbum** → `/album`
- **Mis Matches** → `/matches`
- **Chats** → `/chats`

---

## ⚙️ Service Worker

### Estrategia de caché

| Tipo de recurso | Estrategia | Detalle |
|-----------------|------------|---------|
| Navegación HTML | Network-first | Intenta red primero, fallback a caché/offline |
| JS/CSS bundles | Stale-while-revalidate | Sirve caché inmediato, actualiza en background |
| Imágenes/fonts | Stale-while-revalidate | Caché eficiente para assets pesados |
| Offline fallback | Pre-cached | Se cachea en install |

### Precache (install)

```
/
/offline.html
/manifest.webmanifest
/favicon.svg
/icons/icon-192x192.png
/icons/icon-512x512.png
```

### Rutas Cacheadas ✅

- `/` (landing)
- Todos los bundles JS/CSS generados por Vite (`/assets/*.js`, `/assets/*.css`)
- Imágenes (`.png`, `.jpg`, `.webp`, `.svg`, `.gif`, `.avif`)
- Fuentes (`.woff2`, `.woff`, `.ttf`)
- Íconos y manifest

### Rutas EXCLUIDAS del Caché ❌

| Patrón | Motivo |
|--------|--------|
| `/api/*` | Endpoints de API |
| `/auth/*` | Autenticación |
| `/admin/*` | Panel administrativo |
| `/checkout/*` | Flujo de pagos |
| `/account/*` | Datos de cuenta |
| `/profile/*` | Datos de perfil |
| `/business/*` | Dashboard comercial |
| `/influencer/*` | Dashboard influencer |
| `/premium/*` | Suscripción |
| `/referidos/*` | Sistema de referidos |
| `*.supabase.co` | Backend Supabase |
| `*.supabase.in` | Backend Supabase |
| `paypal.com` | Pagos PayPal |
| `facebook.net` | Meta Pixel |
| `sb-*-auth-token` | Tokens de sesión |

### Actualización

- El SW se actualiza automáticamente cada 60 minutos
- Al detectar nueva versión, se activa en la siguiente navegación
- Se puede forzar actualización con `navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' })`

---

## 🎨 Íconos PWA

### Tamaños requeridos

| Archivo | Tamaño | Propósito | Formato actual |
|---------|--------|-----------|----------------|
| `icon-192x192` | 192×192 | Chrome install prompt | SVG |
| `icon-512x512` | 512×512 | Splash screen Android | PNG + SVG |
| `maskable-icon-192x192` | 192×192 | Adaptive icon Android | SVG |
| `maskable-icon-512x512` | 512×512 | Adaptive icon Android | SVG |
| `apple-touch-icon` | 180×180 | iOS home screen | SVG |

### Cómo reemplazar íconos finales

1. Crear las versiones PNG definitivas:
   - `icon-192x192.png` — 192×192px, fondo transparente o con gradiente
   - `icon-512x512.png` — 512×512px, fondo transparente o con gradiente
   - `maskable-icon-192x192.png` — 192×192px, con 10% padding (safe zone)
   - `maskable-icon-512x512.png` — 512×512px, con 10% padding (safe zone)
   - `apple-touch-icon.png` — 180×180px

2. Colocarlos en `/public/icons/`

3. Actualizar `manifest.webmanifest`:
   - Cambiar `"type": "image/svg+xml"` → `"type": "image/png"`
   - Cambiar extensiones de `.svg` a `.png`

4. Actualizar `index.html`:
   - Cambiar `href="/icons/apple-touch-icon.svg"` → `href="/icons/apple-touch-icon.png"`

### Herramientas recomendadas para generar íconos
- [Maskable.app](https://maskable.app/) — verificar safe zone
- [PWA Builder](https://www.pwabuilder.com/imageGenerator) — generar todos los tamaños
- [RealFaviconGenerator](https://realfavicongenerator.net/) — generar favicons completos

---

## 📱 Meta Tags Mobile

Los siguientes meta tags se agregaron a `index.html`:

```html
<link rel="manifest" href="/manifest.webmanifest" />
<link rel="apple-touch-icon" href="/icons/apple-touch-icon.svg" />
<meta name="mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-title" content="FigusUY" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="format-detection" content="telephone=no" />
<meta name="msapplication-TileColor" content="#060606" />
```

Estos estaban previamente:
```html
<meta name="theme-color" content="#ea580c" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
```

---

## 🔒 Seguridad del Service Worker

### Registro seguro

- Solo se registra si `'serviceWorker' in navigator` (compatibilidad)
- **No se registra en `localhost`** para no interferir con Vite HMR
- Se registra en el evento `load` para no bloquear la carga inicial
- No se duplica (el browser gestiona una sola instancia por scope)

### Vercel deploy

El `vercel.json` incluye headers para:
- `sw.js` → `no-cache` (siempre obtener última versión)
- `manifest.webmanifest` → `Content-Type: application/manifest+json`

---

## 🌐 Página Offline

La página `offline.html`:
- Usa el mismo estilo visual de FigusUY (dark theme, Barlow font, colores de marca)
- Muestra ícono de wifi desconectado
- Mensaje claro: "Sin conexión — FigusUY"
- Botón "Reintentar" que recarga la página
- **Auto-recarga** cuando vuelve la conexión (`online` event)
- NO simula datos ni muestra información falsa

---

## 🧪 Cómo Probar

### Probar instalación en Android (Chrome)

1. Desplegá en Vercel (o servir con HTTPS)
2. Abrí la app en Chrome Android
3. Esperá ~30 segundos → debería aparecer el banner "Agregar a pantalla de inicio"
4. Si no aparece, tocá menú ⋮ → "Instalar aplicación" o "Agregar a pantalla de inicio"
5. Verificar: ícono en home, nombre "FigusUY", modo standalone

### Probar instalación en iPhone (Safari)

1. Abrí la app en Safari iOS
2. Tocá el botón de compartir (□↑)
3. Seleccioná "Agregar a pantalla de inicio"
4. Verificar: ícono correcto, nombre "FigusUY", abre sin barra de Safari

### Probar offline

1. Abrí la app normalmente (para que cachee assets)
2. Activá modo avión
3. Navegá a la app → debería mostrar la página offline
4. Desactivá modo avión → debería recargar automáticamente

### Probar Lighthouse PWA

1. Abrí Chrome DevTools (F12)
2. Tab "Lighthouse"
3. Seleccioná categoría "Progressive Web App"
4. Hacer "Analyze page load"
5. Verificar que pase:
   - ✅ Web app manifest meets the installability requirements
   - ✅ Registers a service worker
   - ✅ Configured for a custom splash screen
   - ✅ Sets a theme color for the address bar
   - ✅ Content is sized correctly for the viewport
   - ✅ Has a `<meta name="viewport">` tag

### Probar en desarrollo local

El SW **no se registra en localhost** intencionalmente. Para probar el SW en dev:

```bash
npm run build
npx serve dist
```

Luego abrir `http://localhost:3000` y verificar en DevTools > Application > Service Workers.

---

## ✅ Checklist Final PWA

| Requisito | Estado |
|-----------|--------|
| `manifest.webmanifest` válido | ✅ |
| `name` y `short_name` | ✅ |
| `start_url` y `scope` | ✅ |
| `display: standalone` | ✅ |
| `theme_color` y `background_color` | ✅ |
| `icons` 192px | ✅ |
| `icons` 512px | ✅ |
| `maskable` icons | ✅ |
| `apple-touch-icon` | ✅ |
| Meta tag `theme-color` | ✅ |
| Meta tag `viewport` | ✅ |
| Meta tag `apple-mobile-web-app-capable` | ✅ |
| Meta tag `mobile-web-app-capable` | ✅ |
| Service Worker registrado | ✅ |
| Service Worker: caché de assets | ✅ |
| Service Worker: offline fallback | ✅ |
| Service Worker: actualización de versiones | ✅ |
| Rutas sensibles excluidas del caché | ✅ |
| Página offline con estilo coherente | ✅ |
| No rompe HMR en desarrollo | ✅ |
| Compatible con Vercel deploy | ✅ |
| `vercel.json` con headers correctos | ✅ |
| Build exitoso (`npm run build`) | ✅ |
| No modifica lógica de negocio | ✅ |
| No modifica diseño visual | ✅ |
| No modifica auth/Supabase/pagos | ✅ |

---

## 📊 Archivos que NO fueron tocados

- ❌ `src/` — Ningún componente React modificado
- ❌ `src/stores/` — Ningún store modificado
- ❌ `src/services/` — Ningún servicio modificado
- ❌ `src/admin/` — Admin intacto
- ❌ `src/business/` — Business intacto
- ❌ `supabase/` — Edge Functions intactas
- ❌ `.env` — Variables de entorno intactas
- ❌ `package.json` — Sin nuevas dependencias
- ❌ `vite.config.ts` — Configuración de build intacta

---

## 🔄 Cómo actualizar la versión del SW

Cuando deploys una nueva versión:

1. El `sw.js` es servido con `no-cache` desde Vercel
2. El browser detecta el cambio en el contenido del archivo
3. Instala el nuevo SW en background
4. Se activa en la siguiente navegación

Para forzar un bump manual, cambiar `CACHE_NAME` en `sw.js`:

```js
const CACHE_NAME = 'figusuy-v2'; // incrementar versión
```

Esto limpiará el caché antiguo y precacheará los nuevos assets.

---

*Generado automáticamente por PWA Engineer Agent — FigusUY*

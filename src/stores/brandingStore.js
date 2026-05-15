import { create } from 'zustand'
import { supabase } from '../lib/supabase'

let settingsPromise = null
let footerPagesPromise = null

const applyFavicon = (faviconUrl) => {
  if (!faviconUrl || typeof document === 'undefined') return

  let link = document.querySelector("link[rel~='icon']")
  if (!link) {
    link = document.createElement('link')
    link.rel = 'icon'
    document.head.appendChild(link)
  }
  link.href = faviconUrl
}

export const useBrandingStore = create((set, get) => ({
  settings: {
    header_logo_url: '/logo.webp',
    header_logo_alt: 'FigusUY',
    header_logo_link: '/',
    header_show_logo: true,
    header_bg_color: '#0b0b0b',
    header_text_color: '#ffffff',
    header_primary_color: '#ff5a00',
    header_sticky: true,
    footer_enabled: true,
    footer_text: '© 2026 FigusUY. Todos los derechos reservados.',
    footer_bg_color: '#090909',
    footer_text_color: '#f5f5f5',
    footer_link_color: '#ff5a00',
    favicon_url: '/favicon.jpg',
    header_menu_items: [
      { label: 'Cómo funciona', link: '#como' },
      { label: 'Intercambios', link: '#intercambios' },
      { label: 'Premium', link: '#premium' }
    ],
    footer_menu_items: [
      { label: 'Términos', link: '/p/terminos' },
      { label: 'Privacidad', link: '/p/privacidad' },
      { label: 'Soporte', link: '/p/soporte' }
    ]
  },
  footerPages: [],
  loading: false,
  initialized: false,
  footerPagesLoaded: false,

  fetchSettings: async (options = {}) => {
    const { force = false } = options
    if (!force && get().initialized) {
      applyFavicon(get().settings.favicon_url)
      return get().settings
    }
    if (settingsPromise) return settingsPromise

    set({ loading: true })
    settingsPromise = (async () => {
      try {
        // Timeout de seguridad: si el branding falla o tarda, usamos el default
        const { data, error } = await Promise.race([
          supabase.from('app_settings').select('key, value'),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Branding Timeout')), 15000))
        ]).catch(err => {
          console.warn('[BrandingStore] Timeout fetching settings, using defaults:', err.message)
          return { data: null, error: null }
        })

        if (data && !error) {
          const settingsMap = { ...get().settings }
          data.forEach(item => {
            if (settingsMap[item.key] !== undefined) {
              try {
                const rawValue = typeof item.value === 'string' ? item.value : ''
                if (rawValue === 'true') settingsMap[item.key] = true
                else if (rawValue === 'false') settingsMap[item.key] = false
                else if (rawValue.startsWith('[') || rawValue.startsWith('{')) {
                  settingsMap[item.key] = JSON.parse(rawValue)
                } else if (item.key.includes('logo_url') && (!rawValue || rawValue === 'null')) {
                  // Keep default if empty
                } else {
                  settingsMap[item.key] = rawValue
                }
              } catch (e) {
                settingsMap[item.key] = item.value
              }
            }
          })
          applyFavicon(settingsMap.favicon_url)
          set({ settings: settingsMap, initialized: true, loading: false })
          return settingsMap
        }

        if (error) {
          console.error('Error fetching branding settings:', error)
        }
        set({ loading: false })
        return get().settings
      } finally {
        settingsPromise = null
      }
    })()

    return settingsPromise
  },

  fetchFooterPages: async () => {
    if (get().footerPagesLoaded) return get().footerPages
    if (footerPagesPromise) return footerPagesPromise

    footerPagesPromise = (async () => {
      try {
        const { data, error } = await supabase
          .from('static_pages')
          .select('title, slug')
          .eq('status', 'published')
          .eq('show_in_footer', true)
          .order('footer_order', { ascending: true })
        if (data && !error) {
          set({ footerPages: data, footerPagesLoaded: true })
          return data
        }
        if (error) {
          console.error('Error fetching footer pages:', error)
        }
        return get().footerPages
      } finally {
        footerPagesPromise = null
      }
    })()

    return footerPagesPromise
  },

  updateSettings: async (newSettings) => {
    set({ loading: true })
    const updates = Object.entries(newSettings).map(([key, value]) => ({
      key,
      value: typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value),
      category: 'branding'
    }))

    const { error } = await supabase.from('app_settings').upsert(updates, { onConflict: 'key' })
    if (!error) {
      set(state => ({ settings: { ...state.settings, ...newSettings } }))
    }
    set({ loading: false })
    return { error }
  },

  uploadAsset: async (file, namePrefix) => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${namePrefix}-${Date.now()}.${fileExt}`
    const { data, error } = await supabase.storage
      .from('branding-assets')
      .upload(fileName, file, { upsert: true, cacheControl: '3600' })
    
    if (error) return { error }
    
    const { data: publicData } = supabase.storage
      .from('branding-assets')
      .getPublicUrl(fileName)
      
    return { url: publicData.publicUrl }
  }
}))

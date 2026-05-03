import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export const useBrandingStore = create((set, get) => ({
  settings: {
    header_logo_url: '',
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
    favicon_url: '',
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

  fetchSettings: async () => {
    set({ loading: true })
    const { data, error } = await supabase.from('app_settings').select('key, value')
    if (data && !error) {
      const settingsMap = { ...get().settings }
      data.forEach(item => {
        if (settingsMap[item.key] !== undefined) {
          try {
            // Attempt to parse JSON if it looks like an array or boolean
            if (item.value === 'true') settingsMap[item.key] = true
            else if (item.value === 'false') settingsMap[item.key] = false
            else if (item.value.startsWith('[') || item.value.startsWith('{')) {
              settingsMap[item.key] = JSON.parse(item.value)
            } else {
              settingsMap[item.key] = item.value
            }
          } catch (e) {
            settingsMap[item.key] = item.value
          }
        }
      })
      set({ settings: settingsMap })

      if (settingsMap.favicon_url) {
        let link = document.querySelector("link[rel~='icon']")
        if (!link) {
          link = document.createElement('link')
          link.rel = 'icon'
          document.head.appendChild(link)
        }
        link.href = settingsMap.favicon_url
      }
    }
    set({ loading: false })
  },

  fetchFooterPages: async () => {
    const { data, error } = await supabase
      .from('static_pages')
      .select('title, slug')
      .eq('status', 'published')
      .eq('show_in_footer', true)
      .order('footer_order', { ascending: true })
    if (data && !error) {
      set({ footerPages: data })
    }
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

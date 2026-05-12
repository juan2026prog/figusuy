import { create } from 'zustand'

export const useThemeStore = create((set) => {
  const isClient = typeof window !== 'undefined'
  const saved = isClient ? localStorage.getItem('theme') : null
  const prefersDark = isClient ? window.matchMedia('(prefers-color-scheme: dark)').matches : false
  const initialDark = saved === 'dark' || (!saved && prefersDark)

  if (initialDark && typeof document !== 'undefined') {
    document.documentElement.classList.add('dark')
  }

  return {
    isDark: initialDark,
    toggleTheme: () => set((state) => {
      const newDark = !state.isDark
      if (typeof document !== 'undefined') {
        if (newDark) {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem('theme', newDark ? 'dark' : 'light')
      }
      return { isDark: newDark }
    }),
  }
})

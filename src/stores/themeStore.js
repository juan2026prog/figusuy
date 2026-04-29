import { create } from 'zustand'

export const useThemeStore = create((set) => {
  const saved = typeof window !== 'undefined' ? localStorage.getItem('theme') : null
  const prefersDark = typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)').matches : false
  const initialDark = saved === 'dark' || (!saved && prefersDark)

  if (initialDark && typeof document !== 'undefined') {
    document.documentElement.classList.add('dark')
  }

  return {
    isDark: initialDark,
    toggleTheme: () => set((state) => {
      const newDark = !state.isDark
      if (newDark) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
      localStorage.setItem('theme', newDark ? 'dark' : 'light')
      return { isDark: newDark }
    }),
  }
})

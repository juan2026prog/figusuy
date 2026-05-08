import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  build: {
    rollupOptions: {
      onwarn(warning, warn) {
        // Rompe el build si hay dependencia circular — facilita detectar el origen
        if (warning.code === 'CIRCULAR_DEPENDENCY') {
          throw new Error(`[CIRCULAR] ${warning.message}`)
        }
        warn(warning)
      },
      output: {
        // Evita que Rollup fusione exports internos y renombre variables
        // a letras simples (n, t, k) que chocan en producción
        minifyInternalExports: false,
        // Aislar influencerStore en su propio chunk para prevenir
        // que el minificador genere referencias cruzadas
        manualChunks(id) {
          if (id.includes('influencerStore')) return 'influencerStore'
          if (id.includes('appStore')) return 'appStore'
          if (id.includes('growthStore')) return 'growthStore'
          if (id.includes('zustand')) return 'zustand'
        },
      },
    },
  },
  test: {
    globals: true,
    exclude: ['tests/e2e/**', 'node_modules/**', 'dist/**'],
  },
})

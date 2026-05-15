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
        // Optimizaciones habilitadas según requerimiento
        minifyInternalExports: true,
        treeshake: true,
        // Aislar stores en chunks propios y mejorar split chunks para vendors
        manualChunks(id) {
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'react-vendor'
          }
          if (id.includes('node_modules/react-router')) {
            return 'router-vendor'
          }
          if (id.includes('node_modules/@supabase/')) {
            return 'supabase-vendor'
          }
          // Isolate heavy vendor libs used only in specific routes
          if (id.includes('node_modules/framer-motion')) {
            return 'framer-motion-vendor'
          }
          if (id.includes('node_modules/leaflet') || id.includes('node_modules/react-leaflet')) {
            return 'leaflet-vendor'
          }
          if (id.includes('node_modules/lucide-react')) {
            return 'lucide-vendor'
          }
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

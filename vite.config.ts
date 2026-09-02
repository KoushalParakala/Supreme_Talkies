import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const missing = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'].filter((key) => !env[key])
  if (mode === 'production' && missing.length) {
    throw new Error(
      `Missing required env vars for production build: ${missing.join(', ')}`
    )
  }

  return {
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-animation': ['framer-motion', 'gsap', 'lenis'],
            'vendor-supabase': ['@supabase/supabase-js'],
          }
        }
      },
      chunkSizeWarningLimit: 600,
    },
    plugins: [react()],
  }
})

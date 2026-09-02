import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
// https://vitejs.dev/config/
export default defineConfig(function (_a) {
    var mode = _a.mode;
    var env = loadEnv(mode, process.cwd(), '');
    var missing = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'].filter(function (key) { return !env[key]; });
    if (mode === 'production' && missing.length) {
        throw new Error("Missing required env vars for production build: ".concat(missing.join(', ')));
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
    };
});

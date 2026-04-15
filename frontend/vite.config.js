import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Dev proxy target comes from env (VITE_API_PROXY_TARGET), defaulting to
// a loopback address. This keeps the backend port out of the committed
// source — set VITE_API_PROXY_TARGET in your local .env for development.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:5000'

  return {
    plugins: [react()],
    server: {
      port: 5174,
      proxy: {
        '/api': apiTarget,
      },
    },
    base: '/vignet/',
    build: {
      outDir: '../dist-react',
    },
  }
})

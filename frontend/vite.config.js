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
      // outDir sits OUTSIDE the Vite root (frontend/), and for that case Vite
      // defaults emptyOutDir to false -- it will not delete files it cannot be
      // sure it owns. So every build since June piled fresh hashed chunks on
      // top of all previous ones: dist-react/assets/ reached 91 files where 16
      // were live, and rsync shipped all 91 to the server every deploy.
      // dist-react/ holds only generated output, so emptying it is safe.
      emptyOutDir: true,
    },
  }
})

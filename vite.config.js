import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ command }) => ({
  plugins: [react(), tailwindcss()],
  // Backend CORS allowlist only contains the production domain, so direct
  // browser calls from localhost fail ("Failed to fetch"). In dev, point the
  // app at the dev server itself and proxy /api to Railway (same-origin in
  // the browser; the proxy sets the Origin server-side). Build is untouched.
  ...(command === 'serve' && {
    define: {
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify('http://localhost:5173'),
    },
    server: {
      strictPort: true,
      proxy: {
        '/api': {
          target: 'https://loan-backend-production-cd45.up.railway.app',
          changeOrigin: true,
          // changeOrigin only rewrites Host. The browser's Origin header still
          // says localhost and trips the backend CORS allowlist (500 HTML).
          // Strip it so the request looks server-to-server.
          configure: proxy => {
            proxy.on('proxyReq', proxyReq => proxyReq.removeHeader('origin'))
          },
        },
      },
    },
  }),
}))

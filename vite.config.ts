import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'

// Environment-aware backend target with IPv4 primary, localhost fallback
const getBackendTarget = () => {
  // In dev, prefer explicit IPv4 to avoid Windows IPv6/localhost resolution issues
  // Set VITE_BACKEND_HOST=localhost to force localhost (useful for some network setups)
  const host = process.env.VITE_BACKEND_HOST || '127.0.0.1'
  const port = process.env.VITE_BACKEND_PORT || '4001'
  return `http://${host}:${port}`
}

const backendTarget = getBackendTarget()

export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: backendTarget,
        changeOrigin: true,
        // Retry with localhost if IPv4 fails (fallback for complex network setups)
        configure: (proxy, _options) => {
          proxy.on('error', (err: any, _req, res) => {
            if (err?.code === 'ECONNREFUSED' && backendTarget.includes('127.0.0.1')) {
              console.warn('⚠️  Backend connection failed on 127.0.0.1:4001, try setting VITE_BACKEND_HOST=localhost')
            }
            if (!res.headersSent) {
              res.writeHead(503, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({ error: 'Backend unavailable', code: err?.code || 'UNKNOWN' }))
            }
          })
        },
      },
      '/auth': {
        target: backendTarget,
        changeOrigin: true,
      },
      '/health': {
        target: backendTarget,
        changeOrigin: true,
      },
    },
  },
  plugins: [
    react(),
    visualizer({ filename: 'dist/stats.html', open: false, gzipSize: true, brotliSize: true })
  ],
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    sourcemap: false,
    minify: 'terser',
    terserOptions: { compress: { drop_console: true, drop_debugger: true } },
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
        manualChunks(id: string) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('scheduler')) return 'vendor-react'
            if (id.includes('@tanstack')) return 'vendor-tanstack'
            if (id.includes('framer-motion')) return 'vendor-framer'
            if (id.includes('recharts') || id.includes('chart.js') || id.includes('echarts')) return 'vendor-charts'
            if (id.includes('monaco-editor') || id.includes('react-quill') || id.includes('@codemirror')) return 'vendor-editor'
            if (id.includes('date-fns') || id.includes('dayjs') || id.includes('moment')) return 'vendor-date'
            if (id.includes('xlsx') || id.includes('pdfjs-dist')) return 'vendor-docs'
            if (id.includes('zustand') || id.includes('redux')) return 'vendor-state'
            return 'vendor'
          }
          if (id.includes('/src/pages/')) {
            const seg = id.split('/src/pages/')[1]?.split('/')[0]
            if (seg) return `page-${seg}`
          }
        },
      },
    },
  },
  resolve: {
    alias: {
      // 'moment': 'dayjs',
    },
  },
})

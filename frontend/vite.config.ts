import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/auth': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        bypass: (req) => {
          if (req.headers.accept?.includes('text/html')) {
            return req.url
          }
        },
      },
      '/images': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        bypass: (req) => {
          if (req.headers.accept?.includes('text/html')) {
            return req.url
          }
        },
      },
      '/annotations': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        bypass: (req) => {
          if (req.headers.accept?.includes('text/html')) {
            return req.url
          }
        },
      },
      '/projects': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        bypass: (req) => {
          if (req.headers.accept?.includes('text/html')) {
            return req.url
          }
        },
      },
      '/tasks': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        bypass: (req) => {
          if (req.headers.accept?.includes('text/html')) {
            return req.url
          }
        },
      },
    }
  }
})
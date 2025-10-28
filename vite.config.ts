import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import fs from 'fs'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'spa-fallback-for-composer-route',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const accept = req.headers['accept'] || '';
          if (typeof accept === 'string' && accept.includes('text/html')) {
            if (req.url === '/composer') {
              const indexHtml = fs.readFileSync(resolve(__dirname, 'index.html'), 'utf-8');
              server.transformIndexHtml(req.url!, indexHtml).then((html) => {
                res.setHeader('Content-Type', 'text/html');
                res.end(html);
              });
              return;
            }
          }
          next();
        });
      }
    }
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@/components': resolve(__dirname, './src/components'),
      '@/pages': resolve(__dirname, './src/pages'),
      '@/hooks': resolve(__dirname, './src/hooks'),
      '@/stores': resolve(__dirname, './src/stores'),
      '@/types': resolve(__dirname, './src/types'),
      '@/data': resolve(__dirname, './src/data'),
      '@/utils': resolve(__dirname, './src/utils'),
      '@/styles': resolve(__dirname, './src/styles'),
      '@/lib': resolve(__dirname, './src/lib')
    }
  },
  server: {
    port: 5173,
    host: true,
    strictPort: false,
    open: true,
    hmr: {
      overlay: true
    },
    watch: {
      usePolling: true,
      interval: 100
    },
    // Proxy habilitado: evita CORS no desenvolvimento
    proxy: {
      '/api': {
        target: 'http://localhost/1canticosccb',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending Request:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Response:', proxyRes.statusCode, req.url);
          });
        }
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
    exclude: []
  },
  clearScreen: false
})

import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import fs from 'fs'

function splitVendorChunks(moduleId: string) {
  if (!moduleId.includes('node_modules')) return undefined;

  if (moduleId.includes('/react/') || moduleId.includes('/react-dom/') || moduleId.includes('/react-router-dom/')) {
    return 'vendor-react';
  }

  if (moduleId.includes('/@supabase/') || moduleId.includes('/@tanstack/')) {
    return 'vendor-data';
  }

  if (moduleId.includes('/lucide-react/')) {
    return 'vendor-icons';
  }

  if (moduleId.includes('/framer-motion/')) {
    return 'vendor-motion';
  }

  if (moduleId.includes('/recharts/')) {
    return 'vendor-charts';
  }

  if (moduleId.includes('/@tinymce/')) {
    return 'vendor-editors';
  }

  if (moduleId.includes('/@aws-sdk/') || moduleId.includes('/jszip/') || moduleId.includes('/howler/')) {
    return 'vendor-media';
  }

  return undefined;
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const devPort = Number(env.VITE_DEV_PORT || 5173);
  const devHost = env.VITE_DEV_HOST || 'localhost';
  const devOpen = env.VITE_DEV_OPEN === 'true';
  const proxyTarget = env.VITE_DEV_PROXY_TARGET?.trim();

  return {
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
      port: devPort,
      host: devHost,
      strictPort: false,
      open: devOpen,
      hmr: {
        overlay: true
      },
      watch: {
        usePolling: true,
        interval: 100
      },
      proxy: proxyTarget ? {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path,
          configure: (proxy, _options) => {
            proxy.on('error', (err, _req, _res) => {
              console.log('proxy error', err);
            });
            proxy.on('proxyReq', (_proxyReq, req, _res) => {
              console.log('Sending Request:', req.method, req.url);
            });
            proxy.on('proxyRes', (proxyRes, req, _res) => {
              console.log('Received Response:', proxyRes.statusCode, req.url);
            });
          }
        }
      } : undefined
    },
    esbuild: {
      // drop console/debugger disabled - was causing runtime issues on Vercel
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks: splitVendorChunks
        }
      }
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom'],
      exclude: []
    },
    clearScreen: false
  };
})

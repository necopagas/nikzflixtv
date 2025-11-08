import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { visualizer } from 'rollup-plugin-visualizer';
import axios from 'axios';
import path from 'path';

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    tailwindcss(),
    // Bundle analyzer (only in build mode)
    mode === 'production' &&
      visualizer({
        filename: './dist/stats.html',
        open: false,
        gzipSize: true,
        brotliSize: true,
      }),
    // Dev-only plugin: serve a simple server-side proxy for /api/vivamax
    {
      name: 'dev-vivamax-middleware',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          try {
            const url = new URL(req.url, 'http://localhost');
            if (url.pathname === '/api/vivamax') {
              if (req.method !== 'GET') {
                res.statusCode = 405;
                res.end(JSON.stringify({ error: 'Method not allowed' }));
                return;
              }

              const page = parseInt(url.searchParams.get('page') || '1', 10) || 1;
              const DEFAULT_KEY =
                import.meta.env.VITE_TMDB_API_KEY || '3b0f392b6173455e37624a78bd5f79d4';
              const tmdbUrl = `https://api.themoviedb.org/3/company/149142/movies?api_key=${DEFAULT_KEY}&page=${page}`;

              const resp = await axios.get(tmdbUrl, { timeout: 10000 });
              res.setHeader('Content-Type', 'application/json');
              res.setHeader('Cache-Control', 'public, max-age=300');
              res.statusCode = 200;
              res.end(JSON.stringify({ cached: false, ...resp.data }));
              return;
            }
          } catch (err) {
            console.error('dev vivamax middleware error', err?.message || err);
            res.statusCode = err?.response?.status || 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err?.response?.data || err?.message || 'internal' }));
            return;
          }

          next();
        });
      },
    },
  ],
  server: {
    proxy: {
      // BAG-O: Proxy para sa 'allorigins' (para sa IPTV)
      '/proxy': {
        target: 'https://api.allorigins.win',
        changeOrigin: true,
        rewrite: p => p.replace(/^\/proxy/, '/raw'),
      },
      // IMONG DAAN: Proxy para sa Consumet API (gikan sa imong consumetApi.js)
      '/api/proxy': {
        target: 'https://api.consumet.org',
        changeOrigin: true,
        rewrite: p => p.replace(/^\/api\/proxy/, ''),
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: id => {
          // Core React dependencies
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'vendor-react';
          }
          // React Router
          if (id.includes('node_modules/react-router')) {
            return 'vendor-router';
          }
          // Icons
          if (id.includes('react-icons')) {
            return 'vendor-icons';
          }
          // Firebase
          if (id.includes('firebase')) {
            return 'vendor-firebase';
          }
          // Video players
          if (id.includes('hls.js') || id.includes('shaka-player') || id.includes('dashjs')) {
            return 'vendor-players';
          }
          // Other large vendors
          if (id.includes('node_modules')) {
            return 'vendor-other';
          }
        },
      },
    },
    chunkSizeWarningLimit: 600,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@store': path.resolve(__dirname, './src/store'),
      '@assets': path.resolve(__dirname, './src/assets'),
    },
  },
}));

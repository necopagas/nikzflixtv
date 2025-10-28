import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import axios from 'axios';
import path from 'path';

export default defineConfig(({ command, mode }) => ({
  plugins: [
    react(),
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
              const DEFAULT_KEY = process.env.TMDB_API_KEY || '3b0f392b6173455e37624a78bd5f79d4';
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
      }
    }
  ],
  server: {
    proxy: {
      // BAG-O: Proxy para sa 'allorigins' (para sa IPTV)
      '/proxy': {
        target: 'https://api.allorigins.win',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/proxy/, '/raw')
      },
      // IMONG DAAN: Proxy para sa Consumet API (gikan sa imong consumetApi.js)
      '/api/proxy': {
        target: 'https://api.consumet.org',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api\/proxy/, '')
      }
    }
  }
}));

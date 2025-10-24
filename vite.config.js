import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // BAG-O: Proxy para sa 'allorigins' (para sa IPTV)
      '/proxy': {
        target: 'https://api.allorigins.win',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/proxy/, '/raw')
      },
      
      // IMONG DAAN: Proxy para sa Consumet API (gikan sa imong consumetApi.js)
      '/api/proxy': {
        target: 'https://api.consumet.org', // I-check ni kung mao ba ni imong target
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/proxy/, '')
      }
    }
  }
});
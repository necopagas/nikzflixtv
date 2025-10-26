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
      
      // GI-UPDATE: Proxy para sa Consumet API (para sa Dev)
      '/api/consumet': {
        target: 'https://api.consumet.org', 
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/consumet/, '')
      },

      // BAG-O: Proxy para sa XyraStream API (para sa Dev)
      '/api/xyra': {
        target: 'https://api.xyrastream.live',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/xyra/, '')
      }
    }
  }
});

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      '@': '/src'
    },
  },
  
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api/v1': {
        target: 'http://10.75.0.125:8000',
        changeOrigin: true,
        secure: false,
        ws: true,
        rewrite: (path) => path
      }
    }
  }
});

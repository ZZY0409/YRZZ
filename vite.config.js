import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3009,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
      'Cross-Origin-Embedder-Policy': 'unsafe-none'
    }
  },
  resolve: {
    extensions: ['.js', '.jsx', '.json']
  },
  define: {
    __REACT_ROUTER_FUTURE_FLAGS__: {
      v7_startTransition: true,
      v7_relativeSplatPath: true
    }
  }
}); 
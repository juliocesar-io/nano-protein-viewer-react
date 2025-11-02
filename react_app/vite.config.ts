import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  resolve: {
    dedupe: ['react', 'react-dom']
  },
  optimizeDeps: {
    exclude: ['@juliocesar-io/nano-protein-viewer-react']
  }
});



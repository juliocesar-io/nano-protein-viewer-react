import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    react(),
    dts({
      insertTypesEntry: true,
      rollupTypes: true,
      tsconfigPath: fileURLToPath(new URL('./tsconfig.json', import.meta.url))
    })
  ],
  resolve: {
    alias: {
      '@components': fileURLToPath(new URL('./src/components', import.meta.url)),
      '@utils': fileURLToPath(new URL('./src/utils', import.meta.url)),
      '@types': fileURLToPath(new URL('./src/types.ts', import.meta.url))
    }
  },
  server: {
    port: 5173
  },
  build: {
    lib: {
      entry: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
      name: 'NanoProteinViewerReact',
      formats: ['es', 'cjs'],
      fileName: (format) => (format === 'es' ? 'index.esm.js' : 'index.cjs')
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime', 'react/jsx-dev-runtime', 'molstar'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          molstar: 'Molstar'
        }
      }
    }
  }
});


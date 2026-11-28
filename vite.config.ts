import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    target: 'es2022',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three')) {
            return 'three';
          }
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'react';
          }
          if (id.includes('/src/engines/') || id.includes('\\src\\engines\\')) {
            return 'engines';
          }
          if (id.includes('/src/data/') || id.includes('\\src\\data\\')) {
            return 'catalog';
          }
          return undefined;
        },
      },
    },
  },
});

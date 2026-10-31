import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import {fileURLToPath, URL} from 'node:url';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {alias: {'@': fileURLToPath(new URL('./src', import.meta.url))}},
  base: './', // the Toy is served from /toy/<slug>/
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('@dnd-kit')) return 'drag-and-drop';
          if (id.includes('@lobehub')) return 'brand-avatars';
          return 'vendor';
        },
      },
    },
  },
});

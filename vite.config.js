import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import {fileURLToPath,URL} from 'node:url';
export default defineConfig({plugins:[react(),tailwindcss()],resolve:{alias:{'@':fileURLToPath(new URL('./src',import.meta.url))}},base:'./',build:{rollupOptions:{output:{manualChunks(id){if(id.includes('node_modules')){if(id.includes('@dnd-kit'))return 'drag-and-drop';if(id.includes('@lobehub')||id.includes('culori'))return 'brand-avatars';return 'vendor';}}}}}});

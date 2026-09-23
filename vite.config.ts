/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  // GitHub Pages serves from /<repo>/; set BASE_PATH there. Local builds use /.
  base: process.env.BASE_PATH ?? '/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // Our own service worker in src/sw.ts; the plugin injects the precache list.
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      injectRegister: false,
      // The manifest lives in public/ so it is readable and editable as a plain file.
      manifest: false,
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,woff,woff2,png,svg,webmanifest}'],
      },
      devOptions: { enabled: false },
    }),
  ],
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { crx } from '@crxjs/vite-plugin';
import manifest from './manifest.json';

export default defineConfig({
  plugins: [
    crx({ manifest }),
    react()
  ],
  build: {
    rollupOptions: {
      input: {
        popup: 'src/popup/index.html',
        background: 'src/background/index.js',
        gmail: 'src/content/gmail.js',
        linkedin: 'src/content/linkedin.js'
      }
    }
  }
});

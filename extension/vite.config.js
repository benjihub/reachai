import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import { crx } from '@crxjs/vite-plugin';
import manifest from './manifest.json';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');

  return {
    plugins: [
      crx({ manifest }),
      react()
    ],
    define: {
      'import.meta.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL || 'http://localhost:3000'),
      'import.meta.env.VITE_GOOGLE_CLIENT_ID': JSON.stringify(env.VITE_GOOGLE_CLIENT_ID || '')
    },
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
  };
});

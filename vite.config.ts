import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  base: './',
  build: {
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        dailyflora_TD: fileURLToPath(new URL('./dailyflora_TD.html', import.meta.url))
      }
    },
    target: 'es2020',
    sourcemap: true
  }
});

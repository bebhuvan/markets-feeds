// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  output: 'static',
  integrations: [],
  vite: {
    define: {
      'import.meta.env.WORKER_URL': JSON.stringify(
        process.env.WORKER_URL || 'http://localhost:8787'
      )
    }
  }
});

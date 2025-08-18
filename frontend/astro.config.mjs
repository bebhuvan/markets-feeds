// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: cloudflare(),
  integrations: [],
  vite: {
    define: {
      'import.meta.env.WORKER_URL': JSON.stringify(
        process.env.WORKER_URL || 'http://localhost:8787'
      )
    }
  }
});

import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  integrations: [tailwind()],
  output: 'hybrid',
  adapter: cloudflare({
    mode: 'directory'
  }),
  build: {
    format: 'directory'
  },
  site: 'https://markets-feeds.pages.dev'
});
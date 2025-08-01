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
    format: 'directory',
    inlineStylesheets: 'auto',
    splitting: true
  },
  server: {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  },
  vite: {
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'date-utils': ['./src/utils/date'],
            'rss-sources': ['./src/config/rss-sources']
          }
        }
      },
      chunkSizeWarningLimit: 1000
    },
    ssr: {
      noExternal: ['date-fns']
    }
  },
  site: 'https://markets-feeds.pages.dev'
});
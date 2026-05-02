import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://e-comgen.site',
  integrations: [
    tailwind(),
    sitemap({
      // Pack pages get higher priority (revenue-bearing); homepage even higher
      serialize(item) {
        if (item.url.includes('/packs/') && item.url.split('/').length > 5) {
          item.priority = 0.9;          // individual pack pages
          item.changefreq = 'weekly';
        } else if (item.url.endsWith('/packs/') || item.url.endsWith('/packs')) {
          item.priority = 0.8;          // packs catalog
          item.changefreq = 'weekly';
        } else {
          item.priority = 0.7;
          item.changefreq = 'monthly';
        }
        return item;
      },
    }),
  ],
  build: {
    format: 'directory',
  },
});

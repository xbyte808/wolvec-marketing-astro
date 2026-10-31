// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import vercel from '@astrojs/vercel';

import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://wolvec.ai',
  output: 'static',
  adapter: vercel(),
  integrations: [react(), sitemap({
    filter: (page) => !page.endsWith('/blog/') && !page.endsWith('/changelog/') && !page.endsWith('/roadmap/'),
    // List every page at its canonical URL, which has no trailing slash (the home page keeps "/").
    // The sitemap used to list "/tools/x/" while the page's canonical said "/tools/x" (W841).
    serialize: (item) => ({ ...item, url: item.url.replace(/^(https:\/\/wolvec\.ai\/.+?)\/$/, '$1') }),
  })],
  vite: {
    plugins: [tailwindcss()],
    build: {
      // Never inline font files as data: URIs. The CSP in vercel.json allows fonts only from
      // 'self', so an inlined font is blocked (W832). Other assets keep Vite's default limit.
      assetsInlineLimit: (filePath) => (/\.(woff2?|ttf|otf|eot)$/i.test(filePath) ? false : undefined),
    },
  },
});
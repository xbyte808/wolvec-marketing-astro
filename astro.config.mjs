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
  integrations: [react(), sitemap({ filter: (page) => !page.endsWith('/blog/') && !page.endsWith('/changelog/') })],
  vite: {
    plugins: [tailwindcss()],
  },
});
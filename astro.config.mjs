// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import fs from 'node:fs';

// Адрес сайта — из content/site.json (его можно поменять в админке)
const content = JSON.parse(fs.readFileSync(new URL('./content/site.json', import.meta.url), 'utf8'));

export default defineConfig({
  site: content.settings.siteUrl,
  trailingSlash: 'always',
  vite: {
    plugins: [tailwindcss()],
  },
});

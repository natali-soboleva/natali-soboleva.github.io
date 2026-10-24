// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import fs from 'node:fs';

// Адрес сайта — из content/site.json (его можно поменять в админке)
const content = JSON.parse(fs.readFileSync(new URL('./content/site.json', import.meta.url), 'utf8'));

// Размеры видеофайлов → dist/video/sizes.json. Нужны functions/video/[[path]].js:
// внутри функции Cloudflare не сообщает размер файла, а без него нельзя отдать видео кусками.
const videoSizes = {
  name: 'video-sizes',
  hooks: {
    'astro:build:done': ({ dir }) => {
      const videoDir = new URL('video/', dir);
      if (!fs.existsSync(videoDir)) return;
      const sizes = {};
      for (const f of fs.readdirSync(videoDir)) sizes[f] = fs.statSync(new URL(f, videoDir)).size;
      fs.writeFileSync(new URL('sizes.json', videoDir), JSON.stringify(sizes));
    },
  },
};

export default defineConfig({
  site: content.settings.siteUrl,
  integrations: [videoSizes],
  trailingSlash: 'always',
  vite: {
    plugins: [tailwindcss()],
  },
});

// Создаёт public/og-image.jpg (превью ссылки 1200×630) и public/apple-touch-icon.png.
// Запуск: node scripts/make-images.mjs (после замены главного фото или имени)
import sharp from 'sharp';
import fs from 'node:fs';

const content = JSON.parse(fs.readFileSync('content/site.json', 'utf8'));
const { name, role } = content.hero;
const heroPath = content.hero.photo.replace(/^\//, '');
const [first, ...rest] = name.split(' ');
const bw = content.settings.blackWhitePhotos;

const photo = await sharp(heroPath)
  .rotate()
  .resize(520, 630, { fit: 'cover', position: 'north' })
  .modulate({ saturation: bw ? 0 : 1 })
  .toBuffer();

const text = Buffer.from(`
<svg width="680" height="630" xmlns="http://www.w3.org/2000/svg">
  <rect width="680" height="630" fill="#F4F0EA"/>
  <text x="70" y="270" font-family="Georgia, serif" font-size="72" letter-spacing="6" fill="#23201D">${first.toUpperCase()}</text>
  <text x="70" y="355" font-family="Georgia, serif" font-size="72" letter-spacing="6" fill="#23201D">${rest.join(' ').toUpperCase()}</text>
  <text x="72" y="420" font-family="Georgia, serif" font-style="italic" font-size="34" fill="#6E6157">${role}</text>
</svg>`);

await sharp({ create: { width: 1200, height: 630, channels: 3, background: '#F4F0EA' } })
  .composite([
    { input: text, left: 0, top: 0 },
    { input: photo, left: 680, top: 0 },
  ])
  .jpeg({ quality: 85 })
  .toFile('public/og-image.jpg');

await sharp('public/favicon.svg', { density: 300 }).resize(180, 180).png().toFile('public/apple-touch-icon.png');
console.log('ok');

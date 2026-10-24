// Всё содержимое сайта — в content/site.json (его правит админка Pages CMS, см. .pages.yml).
import type { ImageMetadata } from 'astro';
import data from '../../content/site.json';

export const content = data;

// Фото лежат в src/assets/photos. В site.json путь записан так: /src/assets/photos/имя.jpg
const photos = import.meta.glob<{ default: ImageMetadata }>('/src/assets/photos/*.{jpg,jpeg,png,webp}', {
  eager: true,
});

export function photo(path: string | undefined | null): ImageMetadata | undefined {
  if (!path) return undefined;
  const key = path.startsWith('/') ? path : `/${path}`;
  return photos[key]?.default;
}

// Ссылки Instagram: профиль и сразу личные сообщения (Direct)
export const instagramProfile = (user: string) => `https://www.instagram.com/${user}/`;
export const instagramDirect = (user: string) => `https://ig.me/m/${user}`;

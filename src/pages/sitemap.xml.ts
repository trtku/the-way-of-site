import type { APIRoute } from 'astro';
import { content } from '../lib/content';

export const GET: APIRoute = ({ site }) => {
  const base = (site ?? new URL('https://example.org')).toString().replace(/\/$/, '');
  const urls = [
    '/', '/exhibitions/',
    ...content.exhibitions.map((e) => `/exhibitions/${e.slug}/`),
    ...content.issues.map((i) => `/issues/${i.yearMonth}/`)
  ];
  const body =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map((u) => `  <url><loc>${base}${u}</loc></url>`).join('\n') +
    `\n</urlset>\n`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};

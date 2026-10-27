import type { APIRoute } from 'astro';
import { content } from '../lib/content';
import { site as meta } from '../config/site';

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export const GET: APIRoute = ({ site }) => {
  const base = (site ?? new URL('https://example.org')).toString().replace(/\/$/, '');
  const items = [
    ...content.news.map((n) => ({
      title: n.title, date: n.date, link: n.url || `${base}/`, desc: n.body
    })),
    ...content.reading.map((r) => ({
      title: r.title, date: r.date, link: r.url, desc: `${r.source} の記事`
    }))
  ]
    .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))
    .slice(0, 20);

  const body =
    `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel>\n` +
    `<title>${esc(meta.name)}</title>\n<link>${base}/</link>\n` +
    `<description>${esc(meta.tagline)}</description>\n<language>ja</language>\n` +
    items.map((i) =>
      `<item><title>${esc(i.title)}</title><link>${esc(i.link)}</link>` +
      (i.date ? `<pubDate>${new Date(i.date + 'T00:00:00+09:00').toUTCString()}</pubDate>` : '') +
      `<description>${esc(i.desc ?? '')}</description>` +
      `<guid isPermaLink="false">${esc(i.link + '#' + (i.date ?? ''))}</guid></item>`
    ).join('\n') +
    `\n</channel></rss>\n`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};

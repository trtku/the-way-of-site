import type { APIRoute } from 'astro';
import { content } from '../../lib/content';
import { toIcs } from '../../lib/ics';

/** 展示ごとの .ics を静的に書き出す。
 *  JavaScript が無効でもカレンダー追加が機能する。 */
export function getStaticPaths() {
  return content.exhibitions
    .filter((e) => e.start && e.end)
    .map((e) => ({ params: { slug: e.slug }, props: { e } }));
}

export const GET: APIRoute = ({ props }) =>
  new Response(toIcs((props as any).e), {
    headers: { 'Content-Type': 'text/calendar; charset=utf-8' }
  });

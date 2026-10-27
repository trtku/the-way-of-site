import type { Content } from '../types';
import raw from '../../data/content.json';

/** ビルドはここだけを見る。
 *  中身は scripts/fetch-content.mjs が書き出した JSON。
 *  ネットワークに触らないので、オフラインでも開発できる。 */
export const content: Content = raw as Content;

export const publishedExhibitions = () => content.exhibitions;

export const ongoing = () =>
  content.exhibitions.filter((e) => e.status === 'ongoing');

export const archived = () =>
  content.exhibitions
    .filter((e) => e.status === 'archive')
    .sort((a, b) => (b.start ?? '').localeCompare(a.start ?? ''));

export const latestIssue = () =>
  [...content.issues].sort((a, b) => b.yearMonth.localeCompare(a.yearMonth))[0] ?? null;

export const backNumbers = (limit = 5) =>
  [...content.issues]
    .sort((a, b) => b.yearMonth.localeCompare(a.yearMonth))
    .slice(1, 1 + limit);

export const notesForIssue = (ym: string) =>
  content.notes.filter((n) => n.issue === ym).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

export const readingLatest = (limit = 5) =>
  [...content.reading]
    .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))
    .slice(0, limit);

export const newsLatest = (limit = 3) =>
  [...content.news]
    .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))
    .slice(0, limit);

export const exhibitionBySlug = (slug: string) =>
  content.exhibitions.find((e) => e.slug === slug) ?? null;

export const upcoming = () =>
  content.exhibitions
    .filter((e) => e.status === 'upcoming')
    .sort((a, b) => (a.start ?? '').localeCompare(b.start ?? ''));

/** 会期バー用。ongoing + upcoming をまとめ、
 *  表示する期間（いちばん早い開始日〜いちばん遅い終了日）も返す。 */
export function spanData() {
  const rows = [...ongoing(), ...upcoming()].filter((e) => e.start && e.end);
  if (!rows.length) return null;
  const starts = rows.map((r) => r.start!).sort();
  const ends = rows.map((r) => r.end!).sort();
  const from = starts[0];
  const to = ends[ends.length - 1];
  const t0 = Date.parse(from);
  const t1 = Date.parse(to);
  const total = Math.max(t1 - t0, 1);
  return {
    from, to,
    rows: rows.map((r) => ({
      ...r,
      left: ((Date.parse(r.start!) - t0) / total) * 100,
      width: Math.max(((Date.parse(r.end!) - Date.parse(r.start!)) / total) * 100, 2)
    }))
  };
}

/** 2026-10-14 → 10.14 / 2026-10 → 2026.10 */
export function fmtDate(iso: string | null | undefined, withYear = false) {
  if (!iso) return '';
  const p = iso.split('-');
  if (p.length === 2) return `${p[0]}.${p[1]}`;
  return withYear ? `${p[0]}.${p[1]}.${p[2]}` : `${p[1]}.${p[2]}`;
}

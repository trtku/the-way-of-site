import { z } from 'zod';

/** 日付のゆれを吸収する。
 *  スプレッドシートの書式や編集者の手入力で
 *  2026-10-14 / 2026/10/14 / 2026.10.14 / シリアル値 のどれも来うる。 */
export function normalizeDate(raw) {
  if (raw === null || raw === undefined) return null;
  const s = String(raw).trim();
  if (!s) return null;

  // Google Sheets のシリアル値（1899-12-30 起点）
  if (/^\d+(\.\d+)?$/.test(s) && Number(s) > 20000 && Number(s) < 80000) {
    const ms = (Number(s) - 25569) * 86400 * 1000;
    return new Date(ms).toISOString().slice(0, 10);
  }

  const m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (m) {
    const [, y, mo, d] = m;
    return `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  // "2026-10" のような年月だけ
  const ym = s.match(/^(\d{4})[-/.](\d{1,2})$/);
  if (ym) return `${ym[1]}-${ym[2].padStart(2, '0')}`;

  const parsed = Date.parse(s);
  if (!Number.isNaN(parsed)) return new Date(parsed).toISOString().slice(0, 10);

  return null; // 読めなければ null。呼び出し側でエラーにする
}

const bool = z.preprocess((v) => {
  const s = String(v ?? '').trim().toUpperCase();
  return s === 'TRUE' || s === '1' || s === 'YES' || s === '○';
}, z.boolean());

const text = z.preprocess((v) => String(v ?? '').trim(), z.string());
const dateish = z.preprocess((v) => normalizeDate(v), z.string().nullable());
const num = z.preprocess((v) => {
  const s = String(v ?? '').trim();
  return s === '' ? null : Number(s);
}, z.number().nullable());

export const issueRow = z.object({
  year_month: text.refine((s) => /^\d{4}-\d{2}$/.test(s), '年月は YYYY-MM 形式で入力してください'),
  title: text,
  recommend_1: text, recommend_2: text, recommend_3: text,
  recommend_4: text, recommend_5: text, recommend_6: text,
  feature_slug: text,
  photo_1: text, photo_2: text, photo_3: text, photo_4: text,
  published: bool
});

export const exhibitionRow = z.object({
  slug: text
    .refine((s) => s.length > 0, 'slug は必須です')
    .refine((s) => /^[a-z0-9-]+$/.test(s), 'slug は半角の英小文字・数字・ハイフンのみです'),
  title: text.refine((s) => s.length > 0, 'title は必須です'),
  subtitle: text,
  venue: text,
  address: text,
  start: dateish,
  end: dateish,
  status: z.preprocess(
    (v) => String(v ?? '').trim().toLowerCase() || 'archive',
    z.enum(['ongoing', 'upcoming', 'archive'])
  ),
  cover: text,
  body: text,
  works_count: num,
  map_url: text,
  published: bool
});

export const readingRow = z.object({
  title: text.refine((s) => s.length > 0, 'title は必須です'),
  url: text.refine((s) => s === '' || /^https?:\/\//.test(s), 'URL は http から始めてください'),
  source: text,
  date: dateish,
  thumb: text,
  tag: text,
  published: bool
});

export const noteRow = z.object({
  issue: text,
  order: num,
  author: text,
  title: text,
  date: dateish,
  url: text,
  published: bool
});

export const newsRow = z.object({
  date: dateish,
  title: text.refine((s) => s.length > 0, 'title は必須です'),
  url: text,
  body: text,
  published: bool
});

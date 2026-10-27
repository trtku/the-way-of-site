#!/usr/bin/env node
/**
 * スプレッドシート → data/content.json
 *
 *  - 5シートをCSVで取得
 *  - Zodで検証。1件でも壊れていたら「公開せずに落ちる」
 *  - エラーは「どのシートの何行目のどの列か」まで出す（編集者に返す用）
 *
 * 使い方: SHEET_ID=... node scripts/fetch-content.mjs
 */
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
 
import { csvUrl, parseCsv, toObjects, SHEETS } from './lib/csv.mjs';
import * as S from './lib/schema.mjs';
 
const SHEET_ID = process.env.SHEET_ID;
const OUT = resolve(ROOT, 'data/content.json');
 
const problems = [];
 
/** 「公開する」以外が全部空なら、その行は無いものとして扱う。
 *  スプレッドシートの空行には FALSE だけが入っていることがあるため、
 *  published 列は空判定から除く。 */
const isBlankRow = (row) =>
  Object.entries(row)
    .filter(([k]) => k !== 'published')
    .every(([, v]) => String(v ?? '').trim() === '');
 
const isPublished = (row) =>
  /^(true|1|yes|y|○|はい)$/i.test(String(row.published ?? '').trim());
 
function validate(sheet, rows, schema) {
  const ok = [];
  rows.forEach((row, i) => {
    const lineNo = i + 3; // 1行目=列名, 2行目=説明
 
    // 空行と下書き行は検証しない。
    // 書きかけの行がサイト全体の更新を止めてしまうのは筋が悪い。
    if (isBlankRow(row) || !isPublished(row)) return;
 
    const r = schema.safeParse(row);
    if (!r.success) {
      for (const issue of r.error.issues) {
        problems.push({
          sheet,
          line: lineNo,
          column: issue.path.join('.') || '(行全体)',
          message: issue.message,
          value: row[issue.path[0]] ?? ''
        });
      }
      return;
    }
    ok.push(r.data);
  });
  return ok;
}
 
/** LOCAL_ROWS が指定されていれば、取得の代わりにそのJSON（シート名→二次元配列）を使う。
 *  共有設定を変える前でも開発できるようにするための逃げ道。 */
const LOCAL = process.env.LOCAL_ROWS
  ? JSON.parse(readFileSync(resolve(ROOT, process.env.LOCAL_ROWS), 'utf8'))
  : null;
 
async function getSheet(name) {
  if (LOCAL) return toObjects(LOCAL[name] ?? []);
  if (!SHEET_ID) throw new Error('SHEET_ID が設定されていません');
  const res = await fetch(csvUrl(SHEET_ID, name));
  if (!res.ok) throw new Error(`${name} シートを取得できませんでした (HTTP ${res.status})`);
  const text = await res.text();
  if (text.trimStart().startsWith('<')) {
    throw new Error(
      `${name} シートがCSVで返ってきません。スプレッドシートの共有設定を` +
      `「リンクを知っている全員が閲覧可」にしてください。`
    );
  }
  const rows = toObjects(parseCsv(text));
  return rows;
}
 
/** 列名が期待どおりに取れているかを先に見る。
 *  ここで落としておかないと、全行が「値が空」で落ちて原因が分かりにくくなる。 */
function assertColumns(sheet, rows, expected) {
  if (!rows.length) return;
  const got = Object.keys(rows[0]);
  const missing = expected.filter((c) => !got.includes(c));
  if (missing.length) {
    throw new Error(
      `${sheet} シートの列が読めません（見つからない列: ${missing.join(', ')}）。\n` +
      `  いま読めた列: ${got.join(', ')}\n` +
      `  1行目の列名が書き換わっていないか確認してください。`
    );
  }
}
 
function splitRecommends(r) {
  return [r.recommend_1, r.recommend_2, r.recommend_3, r.recommend_4, r.recommend_5, r.recommend_6]
    .map((s) => (s ?? '').trim())
    .filter(Boolean);
}
 
async function main() {
  const [issuesRaw, exRaw, readRaw, notesRaw, newsRaw] = await Promise.all(
    SHEETS.map((s) => getSheet(s))
  );
 
  assertColumns('issues', issuesRaw, ['year_month', 'title', 'feature_slug', 'published']);
  assertColumns('exhibitions', exRaw, ['slug', 'title', 'start', 'end', 'status', 'published']);
  assertColumns('reading', readRaw, ['title', 'url', 'date', 'published']);
  assertColumns('notes', notesRaw, ['issue', 'order', 'author', 'title', 'published']);
  assertColumns('news', newsRaw, ['date', 'title', 'published']);
 
  const issues = validate('issues', issuesRaw, S.issueRow)
    .filter((r) => r.published)
    .map((r) => ({
      yearMonth: r.year_month,
      title: r.title,
      recommends: splitRecommends(r),
      featureSlug: r.feature_slug || null,
      photos: [r.photo_1, r.photo_2, r.photo_3, r.photo_4].filter(Boolean)
    }));
 
  const exhibitions = validate('exhibitions', exRaw, S.exhibitionRow)
    .filter((r) => r.published)
    .map((r) => ({
      slug: r.slug, title: r.title, subtitle: r.subtitle,
      venue: r.venue, address: r.address,
      start: r.start, end: r.end, status: r.status,
      cover: r.cover || null, body: r.body,
      worksCount: r.works_count, mapUrl: r.map_url || null
    }));
 
  const reading = validate('reading', readRaw, S.readingRow)
    .filter((r) => r.published)
    .map((r) => ({
      title: r.title, url: r.url, source: r.source || 'note',
      date: r.date, thumb: r.thumb || null, tag: r.tag
    }));
 
  const notes = validate('notes', notesRaw, S.noteRow)
    .filter((r) => r.published)
    .map((r) => ({
      issue: r.issue, order: r.order ?? 0, author: r.author,
      title: r.title, date: r.date, url: r.url
    }));
 
  const news = validate('news', newsRaw, S.newsRow)
    .filter((r) => r.published)
    .map((r) => ({ date: r.date, title: r.title, url: r.url, body: r.body }));
 
  // ── 相互参照のチェック ──────────────────────────
  const slugs = new Set(exhibitions.map((e) => e.slug));
  for (const i of issues) {
    if (i.featureSlug && !slugs.has(i.featureSlug)) {
      problems.push({
        sheet: 'issues', line: '-', column: 'feature_slug',
        message: `exhibitions シートに slug「${i.featureSlug}」が見つかりません`,
        value: i.featureSlug
      });
    }
  }
  const dupes = exhibitions.map((e) => e.slug).filter((s, i, a) => a.indexOf(s) !== i);
  for (const d of new Set(dupes)) {
    problems.push({ sheet: 'exhibitions', line: '-', column: 'slug',
      message: `slug「${d}」が重複しています`, value: d });
  }
 
  if (problems.length) {
    console.error('\n入力に問題があるため、公開を中止しました。\n');
    for (const p of problems) {
      console.error(`  [${p.sheet}] ${p.line}行目 / ${p.column} : ${p.message}` +
        (p.value ? `  （いまの値: ${p.value}）` : ''));
    }
    console.error('\n直してから、もう一度「サイトに反映」を押してください。\n');
    writeFileSync(resolve(ROOT, 'data/problems.json'), JSON.stringify(problems, null, 2));
    process.exit(1);
  }
 
  mkdirSync(resolve(ROOT, 'data'), { recursive: true });
  const out = { fetchedAt: new Date().toISOString(), issues, exhibitions, reading, notes, news };
  writeFileSync(OUT, JSON.stringify(out, null, 2));
  console.log(
    `取得できました: issues ${issues.length} / exhibitions ${exhibitions.length} / ` +
    `reading ${reading.length} / notes ${notes.length} / news ${news.length}`
  );
}
 
main().catch((e) => { console.error('取得に失敗しました:', e.message); process.exit(1); });
 

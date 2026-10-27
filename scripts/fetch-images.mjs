#!/usr/bin/env node
/**
 * 画像入稿フォルダ（Drive） → src/assets/images/
 *
 *  - ファイル名でそのまま保存する。シートのセルに書くのはファイル名だけ。
 *  - APIキーが無いとき、取得に失敗したときは test-images/ のローカル画像で代替する。
 *    （デザイン作業と CI を、入稿の遅れで止めないため）
 *  - 保存後は astro:assets がビルド時に最適化するので、
 *    Drive の署名付きURLの期限切れという問題はそもそも起きない。
 */
import { writeFileSync, mkdirSync, readdirSync, copyFileSync, existsSync } from 'node:fs';
import { dirname, resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(ROOT, 'src/assets/images');
const FALLBACK = resolve(ROOT, 'test-images');

const FOLDER = process.env.DRIVE_IMAGE_FOLDER_ID;
const KEY = process.env.GOOGLE_API_KEY;
const OK_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif']);

mkdirSync(OUT, { recursive: true });

function useFallback(why) {
  console.warn(`画像: ${why} → test-images/ のローカル画像を使います`);
  if (!existsSync(FALLBACK)) { console.warn('画像: test-images/ もありません'); return; }
  let n = 0;
  for (const f of readdirSync(FALLBACK)) {
    if (!OK_EXT.has(extname(f).toLowerCase())) continue;
    copyFileSync(resolve(FALLBACK, f), resolve(OUT, f));
    n++;
  }
  console.log(`画像: ローカルから ${n} 件そろえました`);
}

async function main() {
  if (!FOLDER || !KEY) return useFallback('APIキーまたはフォルダIDが未設定');

  const q = encodeURIComponent(`'${FOLDER}' in parents and trashed = false`);
  const listUrl =
    `https://www.googleapis.com/drive/v3/files?q=${q}` +
    `&fields=files(id,name,mimeType,size)&pageSize=200&key=${KEY}`;

  let files;
  try {
    const res = await fetch(listUrl);
    if (!res.ok) return useFallback(`一覧の取得に失敗 (HTTP ${res.status})`);
    files = (await res.json()).files ?? [];
  } catch (e) {
    return useFallback(`一覧の取得に失敗 (${e.message})`);
  }

  const images = files.filter((f) => (f.mimeType ?? '').startsWith('image/'));
  if (!images.length) return useFallback('入稿フォルダに画像がありません');

  let ok = 0;
  const failed = [];
  for (const f of images) {
    try {
      const r = await fetch(`https://www.googleapis.com/drive/v3/files/${f.id}?alt=media&key=${KEY}`);
      if (!r.ok) { failed.push(`${f.name} (HTTP ${r.status})`); continue; }
      writeFileSync(resolve(OUT, f.name), Buffer.from(await r.arrayBuffer()));
      ok++;
    } catch (e) { failed.push(`${f.name} (${e.message})`); }
  }
  console.log(`画像: Drive から ${ok} 件取得しました`);
  if (failed.length) console.warn('画像: 取得できなかったもの → ' + failed.join(', '));

  // 入稿フォルダに無いファイル名は、ローカルで補う（開発中のため）
  if (existsSync(FALLBACK)) {
    for (const f of readdirSync(FALLBACK)) {
      if (!OK_EXT.has(extname(f).toLowerCase())) continue;
      if (!existsSync(resolve(OUT, f))) copyFileSync(resolve(FALLBACK, f), resolve(OUT, f));
    }
  }
}

main().catch((e) => { useFallback(`想定外のエラー (${e.message})`); });

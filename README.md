# THE WAY OF → サイト

東京藝術大学芸術未来研究場 tokyo-well-city のプロジェクトを、月に一度まとめて記録・発信するメディア。

- **本文** … Googleスプレッドシート（非エンジニアが編集）
- **画像** … Googleドライブ `01_画像入稿` に入れるだけ
- **生成** … Astro（静的HTML）
- **公開** … Cloudflare Pages
- **費用** … 0円（ドメイン代を除く）

```
スプレッドシート ─┐
                  ├→ npm run sync ─→ data/content.json ─→ astro build ─→ dist/ ─→ Cloudflare Pages
Drive 01_画像入稿 ─┘   (Zod検証)                              (画像最適化)
```

## 使う人向け

- 編集のしかた → [`docs/編集者ガイド.md`](docs/編集者ガイド.md)
- 触ってはいけないもの → [`docs/やってはいけないこと.md`](docs/やってはいけないこと.md)

## 作る人向け

- 最初の設定 → [`docs/セットアップ手順.md`](docs/セットアップ手順.md)
- 設計の判断と理由 → [`DECISIONS.md`](DECISIONS.md)
- Claude Code への指示 → [`CLAUDE.md`](CLAUDE.md)

```bash
npm install
npm run sync        # シート → data/content.json（Zodで検証。壊れていたら落ちる）
npm run sync:images # Drive → src/assets/images（APIキーが無ければ test-images/）
npm run dev
npm run build
```

## ディレクトリ

```
scripts/         Googleに触るのはここだけ（CSV取得・検証・画像取得）
data/            取得結果（content.json）。ビルドはここしか見ない
src/types/       ドメイン型。Googleという語は出てこない
src/lib/         content.ts（読み出し）、jsonld.ts、ics.ts、images.ts
src/config/      site.ts（固定情報）、home.ts（トップの枠の並び順）
src/components/  画面の部品
src/pages/       ページ。/、/exhibitions/、/issues/、/events/*.ics、rss、sitemap
test-images/     入稿前に使う仮画像（15枚）
apps-script/     スプレッドシートの［サイトに反映］ボタン
```

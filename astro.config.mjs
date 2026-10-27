import { defineConfig } from 'astro/config';

export default defineConfig({
  // 本番の独自ドメインに差し替える（sitemap と構造化データの絶対URLに使う）
  site: process.env.SITE_URL || 'https://example.org',
  build: { format: 'directory' },
  image: {
    // 画像はビルド時にローカルへ取り込んでから最適化するので、remotePatterns は使わない
    service: { entrypoint: 'astro/assets/services/sharp' }
  }
});

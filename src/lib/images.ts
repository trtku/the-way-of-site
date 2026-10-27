/** 画像はファイル名で引く。
 *  src/assets/images/ の中身は scripts/fetch-images.mjs が用意する。
 *  見つからなければ null を返し、呼び出し側はプレースホルダーを出す。
 *  （入稿が遅れてもビルドは通る） */
const mods = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/images/*.{jpg,jpeg,png,webp,avif,JPG,JPEG,PNG}'
);

export async function pic(name?: string | null): Promise<ImageMetadata | null> {
  if (!name) return null;
  const loader = mods[`/src/assets/images/${name.trim()}`];
  if (!loader) return null;
  return (await loader()).default;
}

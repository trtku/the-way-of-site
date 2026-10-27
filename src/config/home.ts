/** トップページの枠の並び順。
 *  「枠の順番」はコード（ここ）、「枠の中身」はスプレッドシート。
 *  並べ替えたいときだけ、この配列を編集する。 */
export const homeSections = [
  'now',      // 開催中の展示
  'notes',    // 今月の書き手
  'reading',  // 読み物
  'report',   // 連載バナー
  'archive',  // これまでの展示
  'news'      // お知らせ＋今月の一冊
] as const;

export type HomeSection = (typeof homeSections)[number];


/** Google を知っているのはこの scripts/ 配下だけ。
 *  CMS を差し替えるときはここを置き換えれば、src/ は触らずに済む。 */
 
export const SHEETS = ['issues', 'exhibitions', 'reading', 'notes', 'news'];
 
/** 共有設定が「リンクを知っている全員が閲覧可」なら、
 *  ウェブに公開しなくても gviz から CSV が取れる。 */
/** headers=1 は必須。
 *  付けないと gviz が「1行目と2行目をまとめて見出し」と自動判定し、
 *  列名が「slug URLになる記号（…）」のように連結されて全行が壊れる。 */
export function csvUrl(sheetId, sheet) {
  return `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq` +
    `?tqx=out:csv&headers=1&sheet=${encodeURIComponent(sheet)}`;
}
 
/** 引用符・改行・カンマを含むセルに耐える最小のCSVパーサ */
export function parseCsv(input) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
 
  for (let i = 0; i < input.length; i++) {
    const c = input[i];
    if (quoted) {
      if (c === '"') {
        if (input[i + 1] === '"') { cell += '"'; i++; }
        else quoted = false;
      } else cell += c;
      continue;
    }
    if (c === '"') { quoted = true; continue; }
    if (c === ',') { row.push(cell); cell = ''; continue; }
    if (c === '\r') continue;
    if (c === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; continue; }
    cell += c;
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  return rows;
}
 
/** 1行目=列名, 2行目=人間向けの説明, 3行目以降=データ */
export function toObjects(rows) {
  if (rows.length < 3) return [];
  // 見出しが連結されていた場合に備えて、最初の空白までを列名として扱う
  const header = rows[0].map((h) => h.trim().split(/\s/)[0]);
  return rows.slice(2)
    .filter((r) => r.some((c) => String(c).trim() !== ''))
    .map((r) => {
      const o = {};
      header.forEach((h, i) => { if (h) o[h] = (r[i] ?? '').trim(); });
      return o;
    });
}

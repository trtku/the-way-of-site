/**
 * スプレッドシートに「サイトに反映」メニューを足す。
 *
 * 置き場所: スプレッドシートを開く → 拡張機能 → Apps Script → このコードを貼る
 * 設定:     プロジェクトの設定 → スクリプト プロパティ に次の3つを入れる
 *
 *   GITHUB_OWNER  … GitHubのユーザー名／組織名
 *   GITHUB_REPO   … リポジトリ名（例: the-way-of-site）
 *   GITHUB_TOKEN  … Fine-grained token（Actions: Read and write だけ）
 *
 * トークンは編集者には見えない場所（スクリプトプロパティ）に入れること。
 */

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('サイト')
    .addItem('サイトに反映する', 'deploySite')
    .addItem('反映の状況を見る', 'openActions')
    .addToUi();
}

function deploySite() {
  var ui = SpreadsheetApp.getUi();
  var ok = ui.alert(
    'サイトに反映しますか？',
    'いまのシートの内容で、サイトを作り直します。\n' +
    '反映までは3〜5分くらいかかります。',
    ui.ButtonSet.OK_CANCEL
  );
  if (ok !== ui.Button.OK) return;

  var p = PropertiesService.getScriptProperties();
  var owner = p.getProperty('GITHUB_OWNER');
  var repo = p.getProperty('GITHUB_REPO');
  var token = p.getProperty('GITHUB_TOKEN');

  if (!owner || !repo || !token) {
    ui.alert('設定が足りません', 'スクリプト プロパティに GITHUB_OWNER / GITHUB_REPO / GITHUB_TOKEN を入れてください。', ui.ButtonSet.OK);
    return;
  }

  var url = 'https://api.github.com/repos/' + owner + '/' + repo +
            '/actions/workflows/build.yml/dispatches';

  var res = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    headers: {
      Authorization: 'Bearer ' + token,
      Accept: 'application/vnd.github+json'
    },
    payload: JSON.stringify({ ref: 'main' }),
    muteHttpExceptions: true
  });

  if (res.getResponseCode() === 204) {
    ui.alert('受け付けました', '3〜5分後にサイトへ反映されます。\n' +
      '入力に問題があったときは反映されず、「反映の状況を見る」で理由が分かります。', ui.ButtonSet.OK);
  } else {
    ui.alert('うまくいきませんでした',
      'コード ' + res.getResponseCode() + '\n' + res.getContentText().slice(0, 300),
      ui.ButtonSet.OK);
  }
}

function openActions() {
  var p = PropertiesService.getScriptProperties();
  var url = 'https://github.com/' + p.getProperty('GITHUB_OWNER') + '/' +
            p.getProperty('GITHUB_REPO') + '/actions';
  var html = HtmlService.createHtmlOutput(
    '<p style="font-family:sans-serif;font-size:13px">' +
    '<a href="' + url + '" target="_blank">反映の状況をひらく</a></p>'
  ).setWidth(260).setHeight(80);
  SpreadsheetApp.getUi().showModalDialog(html, '反映の状況');
}

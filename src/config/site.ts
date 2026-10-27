/** サイト全体の固定情報。
 *  スプレッドシートに置くほど頻繁に変わらないものだけをここに書く。
 *  （毎月変わるものは全部シート側） */

export const site = {
  name: 'THE WAY OF →',
  nameEn: 'THE WAY OF',
  tagline: '東京藝術大学芸術未来研究場 tokyo-well-city のプロジェクトを、月に一度まとめて記録・発信するメディア',
  cadence: '毎月1日更新',
  lang: 'ja',
  team: '東京藝術大学芸術未来研究場 TOKYO WELL CITY team',
  partner: '三菱地所株式会社',
  university: '東京藝術大学',
  links: {
    instagram: 'https://www.instagram.com/the.way.of_/',
    note: 'https://note.com/the_way_of'
  }
} as const;

/** 会場の補足情報。会場名（シートの venue 列の先頭一致）で引く。
 *  geo（緯度経度）は作品マップ確定後に入れる。 */
export const venues = [
  {
    match: '大手町',
    name: '大手町エコミュージアム／大手町ゲートビル外構',
    postalCode: '100-0004',
    address: '東京都千代田区大手町',
    region: '東京都',
    locality: '千代田区',
    access: ['東京メトロ 大手町駅から徒歩3分', 'JR 東京駅から徒歩10分'],
    hours: '屋外のため、会期中はいつでも観覧できます',
    fee: '無料',
    note: '会場は屋外の緑道と広場に点在しています。作品の位置は作品マップで確認できます。車いすでの観覧も可能です。',
    geo: null as null | { lat: number; lng: number }
  },
  {
    match: '東京藝術大学',
    name: '東京藝術大学',
    postalCode: '110-8714',
    address: '東京都台東区上野公園12-8',
    region: '東京都',
    locality: '台東区',
    access: ['JR 上野駅から徒歩10分'],
    hours: '展示ごとに異なります',
    fee: '展示ごとに異なります',
    note: '',
    geo: null as null | { lat: number; lng: number }
  }
];

export function venueFor(venueName: string) {
  return venues.find((v) => venueName.includes(v.match)) ?? venues[0];
}

/** 用語集。About の <dl> に出し、AIにも読ませる。 */
export const glossary = [
  {
    term: '野良展示',
    def: '展示室ではなく、都市の隙間や通路にそのまま置かれる展示のかたち。通りすがりに出会うことを前提にしている。'
  },
  {
    term: 'ホトリア広場',
    def: '東京駅から皇居方面へ徒歩約10分、大手町の緑道に隣接する広場。生物多様性に配慮した緑地として整備されている。'
  }
];

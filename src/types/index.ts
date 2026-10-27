// ドメイン型。Google という単語はここに一度も出てこない。
// CMS を差し替えるときに変えるのは src/lib/sheets/ だけで、この型は据え置く。

export type Issue = {
  yearMonth: string;        // "2026-10"
  title: string;
  recommends: string[];     // 今月おすすめの過ごし方
  featureSlug: string | null;
  photos: string[];         // 画像ファイル名
};

export type ExhibitionStatus = 'ongoing' | 'upcoming' | 'archive';

export type Exhibition = {
  slug: string;
  title: string;
  subtitle: string;
  venue: string;
  address: string;
  start: string | null;     // ISO (YYYY-MM-DD)
  end: string | null;
  status: ExhibitionStatus;
  cover: string | null;
  body: string;
  worksCount: number | null;
  mapUrl: string | null;
};

export type ReadingItem = {
  title: string;
  url: string;
  source: string;
  date: string | null;
  thumb: string | null;
  tag: string;
};

export type Note = {
  issue: string;
  order: number;
  author: string;
  title: string;
  date: string | null;
  url: string;
};

export type NewsItem = {
  date: string | null;
  title: string;
  url: string;
  body: string;
};

export type Content = {
  fetchedAt: string;
  issues: Issue[];
  exhibitions: Exhibition[];
  reading: ReadingItem[];
  notes: Note[];
  news: NewsItem[];
};

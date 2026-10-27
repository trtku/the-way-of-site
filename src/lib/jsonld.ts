import type { Content, Exhibition } from '../types';
import { site, venueFor } from '../config/site';

/** 構造化データ。
 *  - 会場（Place）は @id で共有し、展示から参照する
 *  - ExhibitionEvent は開催中・開催予定を出す
 *  - 住所と geo は src/config/site.ts の venues から
 *  日本では Google の「イベントのリッチリザルト」は未提供だが、
 *  Place / Event の構造化データは地図やAIの読み取りに効く。 */

const abs = (base: string, path: string) => new URL(path, base).toString();

function placeNode(base: string, venueName: string) {
  const v = venueFor(venueName);
  return {
    '@type': 'Place',
    '@id': `${base}#venue-${v.match}`,
    name: v.name,
    address: {
      '@type': 'PostalAddress',
      postalCode: v.postalCode,
      addressRegion: v.region,
      addressLocality: v.locality,
      streetAddress: v.address.replace(`${v.region}${v.locality}`, ''),
      addressCountry: 'JP'
    },
    ...(v.geo ? { geo: { '@type': 'GeoCoordinates', latitude: v.geo.lat, longitude: v.geo.lng } } : {}),
    publicAccess: true,
    isAccessibleForFree: true
  };
}

function eventNode(base: string, e: Exhibition) {
  const v = venueFor(e.venue);
  return {
    '@type': 'ExhibitionEvent',
    '@id': abs(base, `/exhibitions/${e.slug}/`) + '#event',
    name: e.title,
    ...(e.subtitle ? { alternateName: e.subtitle } : {}),
    description: e.body,
    ...(e.start ? { startDate: e.start } : {}),
    ...(e.end ? { endDate: e.end } : {}),
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: { '@id': `${base}#venue-${v.match}` },
    organizer: { '@id': `${base}#org` },
    url: abs(base, `/exhibitions/${e.slug}/`),
    isAccessibleForFree: true,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'JPY',
      availability: 'https://schema.org/InStock',
      url: abs(base, `/exhibitions/${e.slug}/`)
    }
  };
}

export function graph(base: string, content: Content, opts: { issueYm?: string | null } = {}) {
  const live = content.exhibitions.filter((e) => e.status === 'ongoing' || e.status === 'upcoming');
  const venueNames = [...new Set(live.map((e) => venueFor(e.venue).match))];
  const issue = opts.issueYm
    ? content.issues.find((i) => i.yearMonth === opts.issueYm)
    : null;

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${base}#website`,
        name: site.name,
        alternateName: site.nameEn,
        url: base,
        inLanguage: 'ja',
        description: site.tagline,
        publisher: { '@id': `${base}#org` }
      },
      {
        '@type': 'CollegeOrUniversity',
        '@id': `${base}#org`,
        name: site.team,
        parentOrganization: { '@type': 'CollegeOrUniversity', name: site.university },
        sameAs: [site.links.instagram, site.links.note]
      },
      ...venueNames.map((n) => placeNode(base, n)),
      ...(issue
        ? [{
            '@type': 'PublicationIssue',
            '@id': abs(base, `/issues/${issue.yearMonth}/`) + '#issue',
            name: issue.title,
            issueNumber: issue.yearMonth,
            datePublished: `${issue.yearMonth}-01`,
            inLanguage: 'ja',
            isPartOf: {
              '@type': 'Periodical',
              name: site.name,
              publicationFrequency: 'Monthly',
              '@id': `${base}#periodical`
            }
          }]
        : []),
      ...live.map((e) => eventNode(base, e)),
      {
        '@type': 'ItemList',
        '@id': `${base}#reading`,
        name: '読み物',
        itemListElement: content.reading.slice(0, 5).map((r, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          item: {
            '@type': 'Article',
            headline: r.title,
            ...(r.date ? { datePublished: r.date } : {}),
            url: r.url
          }
        }))
      }
    ]
  };
}

export function exhibitionGraph(base: string, e: Exhibition) {
  const v = venueFor(e.venue);
  return {
    '@context': 'https://schema.org',
    '@graph': [
      placeNode(base, e.venue),
      {
        '@type': 'CollegeOrUniversity',
        '@id': `${base}#org`,
        name: site.team,
        parentOrganization: { '@type': 'CollegeOrUniversity', name: site.university }
      },
      eventNode(base, e),
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'ホーム', item: base },
          { '@type': 'ListItem', position: 2, name: '展示', item: abs(base, '/exhibitions/') },
          { '@type': 'ListItem', position: 3, name: e.title }
        ]
      }
    ]
  };
}

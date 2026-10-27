import type { Exhibition } from '../types';
import { site } from '../config/site';

const fold = (s: string) => s.replace(/\r?\n/g, '\\n');
const ymd = (iso: string) => iso.replace(/-/g, '');

/** 終了日の翌日を DTEND にする（iCalendar の DATE は非包含） */
function nextDay(iso: string) {
  const d = new Date(iso + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + 1);
  return ymd(d.toISOString().slice(0, 10));
}

export function toIcs(e: Exhibition, stamp = new Date()): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//THE WAY OF//JP',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${e.slug}@the-way-of`,
    `DTSTAMP:${stamp.toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`,
    e.start ? `DTSTART;VALUE=DATE:${ymd(e.start)}` : '',
    e.end ? `DTEND;VALUE=DATE:${nextDay(e.end)}` : '',
    `SUMMARY:${fold(e.subtitle ? `${e.title} — ${e.subtitle}` : e.title)}`,
    `LOCATION:${fold([e.venue, e.address].filter(Boolean).join('（') + (e.address ? '）' : ''))}`,
    `DESCRIPTION:${fold(e.body || '')}\\n主催: ${site.team}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].filter(Boolean);
  return lines.join('\r\n') + '\r\n';
}

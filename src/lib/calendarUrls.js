// src/lib/calendarUrls.js
// Čisti URL/datum helperi za kalendarske rute — bez server-only zavisnosti (Prisma),
// pa se mogu koristiti i iz client i iz server komponenti.

import { todayInSarajevo } from "@/lib/advent";

export const BASE_URL = "https://calendar.meridianbet.ba";

// "Sada" po sarajevskom vremenu (server radi u UTC-u) — dan se otključava u ponoć u BiH, ne u 01:00.
// Vraća lokalni Date na ponoć tog dana, pa ga postojeća poređenja (getDate, toDateString…) koriste kao i prije.
export function sarajevoNow() {
  const t = todayInSarajevo();
  return new Date(t.y, t.m, t.d);
}

export const MIN_YEAR = 2024;
export function maxYear() {
  return sarajevoNow().getFullYear() + 2;
}

// URL koristi mjesece 1-12 (čitljivije), interno se svuda koristi 0-11 (JS Date konvencija)
export function monthToUrl(m) {
  return m + 1;
}
export function monthFromUrl(m) {
  return m - 1;
}
export function monthPath(year, month) {
  return `/${year}/${monthToUrl(month)}`;
}

export function isCurrentMonth(year, month, now = sarajevoNow()) {
  return year === now.getFullYear() && month === now.getMonth();
}

// Kanonski URL za dati mjesec — tekući mjesec uvijek živi na "/", ostali na "/[year]/[month]"
export function monthHref(year, month, now = sarajevoNow()) {
  return isCurrentMonth(year, month, now) ? "/" : monthPath(year, month);
}

export function isValidYear(year) {
  return Number.isInteger(year) && year >= MIN_YEAR && year <= maxYear();
}
export function isValidMonth(month) {
  return Number.isInteger(month) && month >= 0 && month <= 11;
}

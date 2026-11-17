// src/lib/advent.js
// Novogodišnja (advent) tema: period preko više mjeseci, jedno polje po danu.

const TZ = "Europe/Sarajevo";
const MAX_DAYS = 62;

// Današnji datum po sarajevskom vremenu (server može biti u UTC-u).
export function todayInSarajevo(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const get = (t) => Number(parts.find((p) => p.type === t)?.value);
  return { y: get("year"), m: get("month") - 1, d: get("day") };
}

export function parseYMD(s) {
  if (typeof s !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const [y, m, d] = s.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return null;
  return { y, m: m - 1, d };
}

const toUTC = ({ y, m, d }) => Date.UTC(y, m, d);
const ord = ({ y, m }) => y * 12 + m;
export const ymdKey = ({ y, m, d }) =>
  `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

function wholeMonth(year, month) {
  const last = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return { start: { y: year, m: month, d: 1 }, end: { y: year, m: month, d: last } };
}

function rangeFromEntry(entry) {
  const start = parseYMD(entry?.adventStart);
  const end = parseYMD(entry?.adventEnd);
  if (!start || !end) return null;
  const days = (toUTC(end) - toUTC(start)) / 86400000 + 1;
  if (days < 1 || days > MAX_DAYS) return null;
  return { start, end };
}

/**
 * Da li je za traženi mjesec aktivna advent tema i koji period prikazujemo.
 * Redoslijed:
 *  1. mjesec ima override theme=advent → njegov period (ili cijeli mjesec ako period nije unesen)
 *  2. mjesec ima neki drugi override teme → nije advent
 *  3. advent period nekog drugog mjeseca pokriva ovaj mjesec (npr. decembar 14.12–03.01 pokriva januar)
 *  4. globalna tema je advent → cijeli mjesec
 */
export function resolveAdvent({ monthBgs = {}, globalTheme, year, month }) {
  const own = monthBgs[`${year}-${month}`] || {};
  if (own.theme === "advent") {
    return rangeFromEntry(own) || wholeMonth(year, month);
  }
  if (own.theme) return null;

  for (const entry of Object.values(monthBgs)) {
    if (entry?.theme !== "advent") continue;
    const r = rangeFromEntry(entry);
    if (r && ord(r.start) <= ord({ y: year, m: month }) && ord({ y: year, m: month }) <= ord(r.end)) {
      return r;
    }
  }

  if (globalTheme === "advent") return wholeMonth(year, month);
  return null;
}

// Mjeseci koje period dodiruje: [{ y, m }, ...]
export function monthsInRange({ start, end }) {
  const out = [];
  for (let o = ord(start); o <= ord(end); o++) out.push({ y: Math.floor(o / 12), m: o % 12 });
  return out;
}

/**
 * Pravi listu dana za advent prikaz.
 * specials: normalizovani SpecialPromotion redovi (year, month, day, ...)
 * weeklyByMonth: { "y-m": [7 weekly promo ili null] } (index 0 = ponedjeljak)
 *
 * Za buduće dane (osim admin preview-a) sadržaj promocije se NE šalje klijentu.
 */
export function buildAdventDays({ range, specials = [], weeklyByMonth = {}, adminPreview = false, today }) {
  const t = today || todayInSarajevo();
  const todayUTC = toUTC(t);

  const specialMap = new Map();
  for (const sp of specials) {
    if (!sp?.active) continue;
    specialMap.set(ymdKey({ y: sp.year, m: sp.month, d: sp.day }), sp);
  }

  const days = [];
  for (let ms = toUTC(range.start); ms <= toUTC(range.end); ms += 86400000) {
    const dt = new Date(ms);
    const ymd = { y: dt.getUTCFullYear(), m: dt.getUTCMonth(), d: dt.getUTCDate() };
    const key = ymdKey(ymd);
    const weekday = dt.getUTCDay(); // 0 = nedjelja

    let promo = specialMap.get(key) || null;
    let type = promo ? "special" : null;
    if (!promo) {
      const weekly = weeklyByMonth[`${ymd.y}-${ymd.m}`] || [];
      const w = weekly[(weekday + 6) % 7];
      if (w && w.active) {
        promo = w;
        type = "weekly";
      }
    }

    const state = ms < todayUTC ? "past" : ms === todayUTC ? "today" : "future";
    const hidden = state === "future" && !adminPreview;

    days.push({
      key,
      ...ymd,
      weekday,
      state,
      promo:
        promo && !hidden
          ? {
              type,
              title: promo.title || "",
              richHtml: promo.richHtml || null,
              link: promo.link || "#",
              button: promo.button || "Saznaj više",
              buttonColor: promo.buttonColor || "green",
              category: promo.category || "ALL",
              icon: promo.icon && String(promo.icon).trim() ? promo.icon : null,
            }
          : null,
    });
  }
  return days;
}

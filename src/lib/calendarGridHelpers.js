// src/lib/calendarGridHelpers.js
import { buildPromoUrlISO, slugify } from "@/lib/slug";
import { firstImage } from "@/lib/slot/slotReveal";

function asArray(x) {
  if (Array.isArray(x)) return x;
  if (x && typeof x === "object") return Object.values(x);
  return [];
}

// specials → map po danu
function indexSpecialsForMonth(specials, year, month) {
  const map = new Map();
  for (const sp of asArray(specials)) {
    if (!sp?.active) continue;
    if (sp.year === year && sp.month === month) {
      map.set(sp.day, sp);
    }
  }
  return map;
}

function pickPromoForDate(date, weekly, specialsMap) {
  const sp = specialsMap.get(date.getDate());
  if (sp) return { promo: sp, type: "special" };

  let wd = date.getDay(); // 0..6 (Sun..Sat)
  if (wd === 0) wd = 7;   // Sun -> 7
  wd = wd - 1;            // 0..6 (Mon..Sun)

  const w = asArray(weekly)[wd];
  if (w && w.active) return { promo: w, type: "weekly" };

  return { promo: null, type: null };
}

export function buildCalendarData({
  year,
  month,
  weekly = [],
  specials = [],
  adminPreview = false,
  lang = "pt",
  today = new Date(),
}) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const startDay = firstDay === 0 ? 7 : firstDay; // 1..7 (Mon..Sun)

  const prevMonthDays = new Date(year, month, 0).getDate();
  const specialsMap = indexSpecialsForMonth(specials, year, month);

  const cells = [];
  const daysPayload = [];

  // LEADING – dani prethodnog meseca
  const leadingDays = startDay - 1;
  for (let i = 0; i < leadingDays; i++) {
    const dayNum = prevMonthDays - leadingDays + 1 + i;
    cells.push({
      type: "prev",
      key: `prev-${dayNum}`,
      day: dayNum,
    });
  }

  // GLAVNI – dani tekućeg meseca
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month, day);
    const isFuture = d > today;
    const isToday = d.toDateString() === today.toDateString();

    const { promo, type } = pickPromoForDate(d, weekly, specialsMap);
    const icon =
      promo?.icon && String(promo.icon).trim() ? promo.icon : null;

    const hasContent = promo && (promo.richHtml || "").trim().length > 0;
    const shareUrl = hasContent
      ? buildPromoUrlISO(d, promo.title || slugify("promocija"))
      : null;

    const isFutureForUx = adminPreview ? false : isFuture && !isToday;
    const isLocked = adminPreview ? false : isFutureForUx;

    const category = promo?.category || "ALL";
    // slot ima prednost nad grebalicom (API ih ionako ne dozvoljava zajedno)
    const slot = !!promo?.slot;
    const scratch = !!promo?.scratch && !slot;
    const flipCard = !!promo?.flipCard && !slot;
    // faza nokaut turnira (football tema) — oznaka i prsten na lopti, vidljivi i na zaključanim danima
    const knockoutPhase = promo?.knockoutPhase || null;

    // cell za grid (desktop)
    cells.push({
      type: "day",
      key: `day-${day}`,
      day,
      hasPromo: Boolean(promo),
      isToday,
      isFutureForUx,
      isLocked,
      icon,
      category,
      knockoutPhase,
    });

    // payload za JS (modal + mobile)
    // Zaključani (budući) dani: tekst, opis i link se NE šalju u HTML — inače bi se buduće
    // promocije mogle pročitati iz izvornog koda stranice. Ikonica i kategorija ostaju (prikaz polja).
    const title = isLocked ? "" : promo?.title || "";
    const richHtml = isLocked ? null : promo?.richHtml || null;
    const link = isLocked ? "#" : promo?.link || "#";
    const button = isLocked ? "" : promo?.button || (lang === "ba" ? "Saznaj više" : "Learn more");
    const buttonColor = promo?.buttonColor || "green";

    daysPayload.push({
      day,
      year,
      month,
      shareUrl: isLocked ? null : shareUrl,
      type,
      title,
      richHtml,
      link,
      button,
      buttonColor,
      category,
      scratch,
      slot,
      flipCard,
      knockoutPhase,

      hasPromo: Boolean(promo),
      isToday,
      isFutureForUx,
      isLocked,
      icon,

      promo: promo
        ? {
            title,
            richHtml,
            link,
            button,
            buttonColor,
            category,
            icon,
            scratch,
            slot,
            flipCard,
          }
        : null,
    });
  }


  // Slot vrti slike ostalih promocija mjeseca (prva slika iz opisa), pa na kraju staje na svoju.
  // Zaključani dani nemaju opis u payload-u, pa njihove slike ne ulaze u valjke.
  const promoImages = [...new Set(daysPayload.map((d) => firstImage(d.richHtml || "")).filter(Boolean))];
  for (const d of daysPayload) {
    if (!d.slot) continue;
    const own = firstImage(d.richHtml || "");
    d.slotPool = promoImages.filter((src) => src !== own).slice(0, 12);
  }

  // TRAILING – dani sledećeg meseca da se popuni poslednji red
  const totalCells = cells.length;
  const remainder = totalCells % 7;
  if (remainder !== 0) {
    const nextDays = 7 - remainder;
    for (let i = 1; i <= nextDays; i++) {
      cells.push({
        type: "next",
        key: `next-${i}`,
        day: i,
      });
    }
  }

  return { cells, daysPayload };
}

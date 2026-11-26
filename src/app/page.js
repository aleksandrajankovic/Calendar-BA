// src/app/page.js
import CalendarGrid from "@/components/CalendarGrid";
import CalendarEnhancer from "@/components/CalendarEnhancer";
import MonthPagination from "@/components/MonthPagination";
import AdminLogoutButton from "@/components/AdminLogoutButton";
import prisma from "@/lib/db";
import { cookies } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { verifyToken } from "@/lib/auth";
import { BASE_URL, monthHref, isValidYear, isValidMonth, sarajevoNow } from "@/lib/calendarUrls";
import SnowOverlay from "@/components/SnowOverlay";
import AdventCalendar from "@/components/advent/AdventCalendar";
import { resolveAdvent, monthsInRange, buildAdventDays } from "@/lib/advent";
import { resolveConfetti } from "@/lib/confetti";
import CalendarClosed from "@/components/CalendarClosed";
import CountdownTimer from "@/components/CountdownTimer";
import { adventDisplay } from "@/app/fonts";
import { redirect } from "next/navigation";
import { unstable_cache } from "next/cache";

// -------------------------
// HELPERS
// -------------------------
function getParam(sp, key) {
  if (!sp) return undefined;
  const v = sp[key];
  return Array.isArray(v) ? v[0] : v;
}

function getTextFromTranslations(row, lang) {
  const translations = row.translations || {};
  const t =
    translations[lang] ||
    (Object.keys(translations).length
      ? translations[Object.keys(translations)[0]]
      : null);
  return {
    title:   t?.title   ?? row.title   ?? "",
    button:  t?.button  ?? row.button  ?? "",
    link:    t?.link    ?? row.link    ?? "#",
    richHtml: t?.richHtml ?? row.richHtml ?? null,
  };
}

function normWeeklyRows(rows = [], lang) {
  const out = Array(7).fill(null);
  for (const r of rows) {
    if (typeof r.weekday === "number" && r.weekday >= 0 && r.weekday <= 6) {
      const t = getTextFromTranslations(r, lang);
      out[r.weekday] = {
        title:       t.title,
        icon:        r.icon || "",
        richHtml:    t.richHtml,
        link:        t.link,
        button:      t.button,
        active:      !!r.active,
        buttonColor: r.buttonColor || "green",
        category:    r.category || "ALL",
        scratch:     !!r.scratch,
        slot:        !!r.slot,
        flipCard:    !!r.flipCard,
      };
    }
  }
  return out;
}

function normalizeSpecials(rows = [], lang) {
  return rows.map((r) => {
    const t = getTextFromTranslations(r, lang);
    return {
      year:        r.year,
      month:       r.month,
      day:         r.day,
      title:       t.title,
      icon:        r.icon || "",
      richHtml:    t.richHtml,
      link:        t.link,
      button:      t.button,
      active:      !!r.active,
      buttonColor: r.buttonColor || "green",
      category:    r.category || "ALL",
      scratch:     !!r.scratch,
      slot:        !!r.slot,
      flipCard:    !!r.flipCard,
      knockoutPhase: r.knockoutPhase || null,
    };
  });
}

// -------------------------
// KEŠ ZA POSJETIOCE — podešavanja, promocije i strelice za mjesece čitaju se iz keša
// (tag "calendar"); svako čuvanje u adminu (api/special, api/weekly-plan,
// api/calendar-settings) poziva revalidateTag("calendar"), pa izmjene važe odmah.
// Admin uvijek čita svježe iz baze.
// -------------------------
const CACHE = { revalidate: 300, tags: ["calendar"] };

const getCachedSettings = unstable_cache(() => prisma.calendarSettings.findFirst(), ["calendar-settings"], CACHE);
function getCalendarSettings(isAdmin = false) {
  return isAdmin ? prisma.calendarSettings.findFirst() : getCachedSettings();
}

function loadMonthRows(year, month) {
  return Promise.all([
    prisma.weeklyPlan.findMany({ where: { year, month }, orderBy: { weekday: "asc" } }),
    prisma.specialPromotion.findMany({ where: { year, month }, orderBy: [{ day: "asc" }] }),
  ]);
}
const getCachedMonthRows = unstable_cache(loadMonthRows, ["promo-data"], CACHE);

function loadAdventRows(months) {
  const monthFilter = { OR: months.map(({ y, m }) => ({ year: y, month: m })) };
  return Promise.all([
    prisma.weeklyPlan.findMany({ where: monthFilter }),
    prisma.specialPromotion.findMany({ where: monthFilter }),
  ]);
}
const getCachedAdventRows = unstable_cache(loadAdventRows, ["advent-data"], CACHE);

const getCachedNearestMonth = unstable_cache(
  (y, m, direction, inactiveKeys) => findNearestMonthWithPromos(y, m, direction, new Set(inactiveKeys)),
  ["nearest-month"],
  CACHE
);
function nearestMonth(y, m, direction, inactiveSet, isAdmin) {
  return isAdmin
    ? findNearestMonthWithPromos(y, m, direction, inactiveSet)
    : getCachedNearestMonth(y, m, direction, [...inactiveSet].sort());
}

// -------------------------
// PAGINATION — finds nearest month with promos, skipping inactive months
// -------------------------
async function findNearestMonthWithPromos(currentY, currentM, direction, inactiveSet = new Set()) {
  const isNext = direction === "next";

  const dirFilter = isNext
    ? { OR: [{ year: { gt: currentY } }, { year: currentY, month: { gt: currentM } }] }
    : { OR: [{ year: { lt: currentY } }, { year: currentY, month: { lt: currentM } }] };
  const dirOrder = isNext
    ? [{ year: "asc" }, { month: "asc" }]
    : [{ year: "desc" }, { month: "desc" }];

  const [special, plan] = await Promise.all([
    prisma.specialPromotion.findFirst({ where: { active: true, ...dirFilter }, orderBy: dirOrder }),
    prisma.weeklyPlan.findFirst({ where: { active: true, ...dirFilter }, orderBy: dirOrder }),
  ]);

  if (!special && !plan) return null;

  let candidate;
  if (!special) candidate = { y: plan.year, m: plan.month };
  else if (!plan) candidate = { y: special.year, m: special.month };
  else {
    const sOrd = special.year * 12 + special.month;
    const pOrd = plan.year * 12 + plan.month;
    const closer = isNext ? (sOrd <= pOrd ? special : plan) : (sOrd >= pOrd ? special : plan);
    candidate = { y: closer.year, m: closer.month };
  }

  if (inactiveSet.has(`${candidate.y}-${candidate.m}`)) {
    return findNearestMonthWithPromos(candidate.y, candidate.m, direction, inactiveSet);
  }

  return candidate;
}

// -------------------------
// METADATA
// -------------------------
const MONTH_NAMES_BS = [
  "Januar", "Februar", "Mart", "April", "Maj", "Juni",
  "Juli", "August", "Septembar", "Oktobar", "Novembar", "Decembar",
];

// Mjesec stranice: iz /[year]/[month] rute (prosljeđuje ga ta ruta), inače tekući mjesec.
// Stari ?y=&m= linkovi se na "/" preusmjeravaju na novi URL (vidi Home).
function resolvePageMonth(pageMonth) {
  const now = sarajevoNow();
  if (pageMonth && isValidYear(pageMonth.year) && isValidMonth(pageMonth.month)) return pageMonth;
  return { year: now.getFullYear(), month: now.getMonth() };
}

export async function generateMetadata({ pageMonth } = {}) {
  const { year, month } = resolvePageMonth(pageMonth);
  const settings = await getCalendarSettings();

  // Advent period preko dva mjeseca: oba mjeseca prikazuju istu tablu → jedan kanonski URL (mjesec početka)
  const adventRange = resolveAdvent({
    monthBgs: settings?.monthBackgrounds || {},
    globalTheme: settings?.theme,
    year,
    month,
  });
  const canonicalMonth = adventRange ? { y: adventRange.start.y, m: adventRange.start.m } : { y: year, m: month };
  const canonical = `${BASE_URL}${monthHref(canonicalMonth.y, canonicalMonth.m)}`;

  const seo = settings?.seoMeta?.ba || {};

  const monthBs = MONTH_NAMES_BS[month];
  const title       = seo.title       || `Kalendar Promocija ${monthBs} ${year} | Meridianbet`;
  const description = seo.description || `Otkrijte dnevne promocije za ${monthBs} ${year}. Iskoristite ekskluzivne nagrade uz Meridianbet Kalendar Promocija.`;

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: { bs: canonical, "x-default": canonical },
    },
    openGraph: { url: canonical, title, description },
    twitter: { title, description },
  };
}

// -------------------------
// PAGE COMPONENT
// -------------------------
export default async function Home({ searchParams, pageMonth }) {
  const sp = await searchParams;

  // Stari linkovi /?y=2026&m=11 → /2026/12 (jedan kanonski URL po mjesecu)
  if (!pageMonth) {
    const yRaw = getParam(sp, "y");
    const mRaw = getParam(sp, "m");
    if (yRaw !== undefined || mRaw !== undefined) {
      const y = Number.parseInt(yRaw ?? "", 10);
      const m = Number.parseInt(mRaw ?? "", 10);
      redirect(isValidYear(y) && isValidMonth(m) ? monthHref(y, m) : "/");
    }
  }

  const cookieStore = await cookies();
  const adminCookie = cookieStore.get("admin_auth");
  // Samo postojanje cookie-ja nije dovoljno — mora biti validan (potpisan) JWT,
  // inače bi bilo ko ručno postavljenim cookie-jem vidio buduće promocije
  const isAdmin = !!adminCookie?.value && !!(await verifyToken(adminCookie.value));

  const lang = "ba";
  const { year, month } = resolvePageMonth(pageMonth);

  // Calendar settings — admin svježe, posjetioci iz keša (briše se odmah pri čuvanju u adminu)
  const calendarSettings = await getCalendarSettings(isAdmin);
  const monthBgs = calendarSettings?.monthBackgrounds || {};

  // Build inactive set for pagination
  const inactiveSet = new Set(
    Object.entries(monthBgs)
      .filter(([, v]) => v?.inactive)
      .map(([k]) => k)
  );

  // Redirect non-admins away from inactive months
  const monthBg = monthBgs[`${year}-${month}`] || {};
  if (monthBg.inactive && !isAdmin) {
    const nearest =
      await nearestMonth(year, month, "next", inactiveSet, isAdmin) ||
      await nearestMonth(year, month, "prev", inactiveSet, isAdmin);
    if (nearest) redirect(monthHref(nearest.y, nearest.m));
  }

  // Novogodišnja (advent) tema — period može ići preko dva mjeseca (npr. 14.12. – 03.01.)
  const advent = resolveAdvent({
    monthBgs,
    globalTheme: calendarSettings?.theme,
    year,
    month,
  });

  let adventDays = null;
  if (advent) {
    const months = monthsInRange(advent);
    const [advPlanRows, advSpecialRows] = await (isAdmin ? loadAdventRows(months) : getCachedAdventRows(months));
    const weeklyByMonth = {};
    for (const { y, m } of months) {
      weeklyByMonth[`${y}-${m}`] = normWeeklyRows(
        advPlanRows.filter((r) => r.year === y && r.month === m),
        lang
      );
    }
    adventDays = buildAdventDays({
      range: advent,
      specials: normalizeSpecials(advSpecialRows, lang),
      weeklyByMonth,
      adminPreview: isAdmin,
    });
  }

  // Load promo data
  const [weeklyPlanRows, specialRows] = advent
    ? [[], []]
    : await (isAdmin ? loadMonthRows(year, month) : getCachedMonthRows(year, month));

  const planned = normWeeklyRows(weeklyPlanRows, lang);
  const weekly  = Array.from(
    { length: 7 },
    (_, i) =>
      planned[i] ?? {
        title: "", icon: "", richHtml: null, link: "#",
        button: "", active: false, buttonColor: "green", category: "ALL",
      }
  );

  const specials = normalizeSpecials(specialRows, lang);

  // Visual settings — per-month override > global default
  const logoUrl          = calendarSettings?.logoUrl           || "/img/meridianbet-ng.png";
  const bgImageUrl       = monthBg.desktop  || calendarSettings?.bgImageUrl       || "/img/bg-calendar.png";
  const bgImageUrlMobile = monthBg.mobile   || calendarSettings?.bgImageUrlMobile || bgImageUrl;
  const activeTheme      = advent ? "advent" : (monthBg.theme || calendarSettings?.theme || "default");

  const pos = monthBg.position || calendarSettings?.calendarPosition || "left";
  const mainJustify  = pos === "center" ? "md:justify-center" : pos === "right" ? "md:justify-end"   : "md:justify-start";
  const innerMargin  = pos === "center" ? "mx-auto"            : pos === "right" ? "mx-auto md:mx-0 md:ml-auto" : "mx-auto md:mx-0 md:mr-auto";
  const headingAlign = pos === "center" ? "md:text-center"     : pos === "right" ? "md:text-right"   : "md:text-left";

  const calendarTitle =
    monthBg.titleBa ||
    calendarSettings?.calendarTitle?.ba ||
    "Kalendar Promocija";

  const isMonthInactive = !!monthBg.inactive;

  // Konfete poslije grebanja — per-month override > global > po temi
  const confettiStyle = resolveConfetti({
    monthConfetti: monthBg.confetti,
    globalConfetti: calendarSettings?.confetti,
    theme: activeTheme,
  });

  // Logo na vrhu — može se isključiti u adminu (BA ga podrazumijevano prikazuje)
  const showLogo = calendarSettings?.showLogo ?? true;

  // Cijeli kalendar zatvoren (npr. kampanja završena): posjetilac vidi samo pozadinu i poruku,
  // admin i dalje vidi kalendar (uz oznaku u admin traci)
  const closedCfg = calendarSettings?.closed || {};
  const isClosed = !!closedCfg.enabled;
  const closedInfo = {
    title: closedCfg.message || "Kampanja je završena",
    buttonLabel: closedCfg.buttonLabel || "Pogledaj sve promocije",
    buttonLink: closedCfg.buttonLink || "https://meridianbet.ba",
  };

  // Odbrojavanje — prikazuje se samo kad je datum podešen u adminu (Engagement)
  const countdownTargetIso = calendarSettings?.countdownTargetIso || "";
  const countdownLabel = calendarSettings?.countdownLabel || "Kalendar se otvara za";

  // Pagination — kod advent teme preskačemo mjesece koje period već pokriva
  // (i mjesec na kojem je period podešen, npr. novembar sa periodom 14.12.–03.01. — inače "nazad" vodi na istu tablu)
  const ymOrd = ({ y, m }) => y * 12 + m;
  const covered = [{ y: year, m: month }, ...(advent ? [advent.start, advent.end, advent.owner].filter(Boolean) : [])];
  const pagFrom = covered.reduce((a, b) => (ymOrd(b) < ymOrd(a) ? b : a));
  const pagTo   = covered.reduce((a, b) => (ymOrd(b) > ymOrd(a) ? b : a));
  const [prevMonth, nextMonth] = await Promise.all([
    nearestMonth(pagFrom.y, pagFrom.m, "prev", inactiveSet, isAdmin),
    nearestMonth(pagTo.y, pagTo.m, "next", inactiveSet, isAdmin),
  ]);

  // Period preko više mjeseci: traka ispod piše cijeli raspon ("Novembar – Decembar 2026"), ne samo
  // tekući mjesec; strelice vode samo na popunjene mjesece prije/poslije perioda — ako ih nema, traka se ne prikazuje.
  const spansMonths = !!advent && (advent.start.y !== advent.end.y || advent.start.m !== advent.end.m);
  const pagLabel = spansMonths ? `${MONTH_NAMES_BS[advent.start.m]} – ${MONTH_NAMES_BS[advent.end.m]}` : null;
  const showPagination = !spansMonths || !!prevMonth || !!nextMonth;

  return (
    <div className="min-h-[100dvh] flex flex-col overflow-hidden">
      {/* HEADER — transparent overlay, centered logo (može se isključiti u adminu) */}
      {showLogo && (
      <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-center px-4 py-6 md:py-7">
        <a
          href="https://meridianbet.ba"
          target="_blank"
          rel="noreferrer"
          aria-label="Meridianbet"
        >
          {/* next/image: umjesto originalnog PNG-a (2074px) šalje se verzija u veličini prikaza */}
          <Image
            src={logoUrl}
            alt="Meridianbet"
            width={140}
            height={40}
            sizes="140px"
            priority
            unoptimized={/^https?:\/\//.test(logoUrl)}
            className="h-8 md:h-10 w-auto"
          />
        </a>
      </header>
      )}

      {/* MAIN */}
      <main
        className={`relative z-0 w-full flex-1 bg-no-repeat bg-cover bg-center calendar-bg overflow-hidden md:overflow-auto flex justify-center ${mainJustify}`}
        style={{ backgroundImage: `url("${bgImageUrl}")` }}
      >
        {/* Mobile background overlay */}
        <div
          className="pointer-events-none absolute inset-0 md:hidden bg-no-repeat bg-cover bg-center -z-10 calendar-mobile-bg"
          style={{ backgroundImage: `url("${bgImageUrlMobile}")` }}
        />

        <SnowOverlay />

        {isClosed && !isAdmin ? (
          // Kalendar zatvoren (Calendar Styling → Calendar Status): bez dana, klikova i popup-a
          <CalendarClosed
            {...closedInfo}
            countdownTargetIso={countdownTargetIso}
            countdownLabel={countdownLabel}
          />
        ) : (
        <div className={`relative z-10 w-full max-w-6xl px-4 sm:px-6 md:px-10 lg:px-16 ${showLogo ? "pt-20 md:pt-24" : "pt-6 md:pt-8 [@media(max-width:767px)_and_(max-height:700px)]:pt-3"} pb-4 md:pb-10 ${innerMargin}`}>
          {activeTheme === "advent" ? (
            // Novogodišnja tema: naslov u fontu i bojama teme (krem + zlatni ukras)
            <div className={`${adventDisplay.className} mt-2 mb-5 md:mb-8 [@media(max-width:767px)_and_(max-height:700px)]:mt-0 [@media(max-width:767px)_and_(max-height:700px)]:mb-3 flex flex-col items-center`}>
              <h1
                className="text-center text-[30px] [@media(max-width:767px)_and_(max-height:700px)]:text-[24px] md:text-[50px] leading-[1.08] font-bold tracking-[0.03em] text-[#f2e7cf] text-balance"
                style={{ textShadow: "0 2px 18px rgba(0,0,0,0.6)" }}
              >
                {calendarTitle}
              </h1>
              <span aria-hidden="true" className="mt-3 flex items-center gap-3 text-[11px] leading-none text-[#d1aa55]">
                <span className="h-px w-16 md:w-24 bg-gradient-to-r from-transparent to-[#d1aa55]" />
                ✦
                <span className="h-px w-16 md:w-24 bg-gradient-to-l from-transparent to-[#d1aa55]" />
              </span>
            </div>
          ) : (
            <h1
              className={`
                ${activeTheme === "football"
                  ? "text-[28px] md:text-[44px] font-normal tracking-[0.06em]"
                  : "text-3xl md:text-5xl font-extrabold tracking-tight"}
                text-white text-center ${headingAlign}
                ${activeTheme === "football"
                  ? "mb-4 [@media(min-height:800px)]:mb-10 md:mb-10"
                  : "mt-4 mb-4 md:mt-4 md:mb-6"}
              `}
            >
              {calendarTitle}
            </h1>
          )}

          {countdownTargetIso && <CountdownTimer targetIso={countdownTargetIso} label={countdownLabel} />}

          {isAdmin && (
            // plutajuća pločica dole desno — ne pomjera sadržaj stranice (vide je samo admini)
            <div
              className="fixed right-3 z-30 flex max-w-[calc(100vw-24px)] flex-col items-end gap-1.5 text-xs"
              style={{ bottom: "calc(12px + env(safe-area-inset-bottom, 0px))" }}
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-black/75 px-3 py-1.5 text-amber-200 shadow-lg backdrop-blur">
                <span>Admin preview</span>
                <Link
                  href="/admin"
                  className="underline hover:text-white transition-colors"
                  title="Go to dashboard"
                >
                  Dashboard
                </Link>
                <AdminLogoutButton />
              </div>
              {isClosed && (
                <div className="inline-flex items-center gap-1.5 rounded-full bg-red-900/85 text-red-100 border border-red-500/40 px-3 py-1.5 shadow-lg backdrop-blur">
                  <span>⚠ Kalendar zatvoren — posjetioci vide samo poruku</span>
                  <Link href="/admin/calendar-style" className="underline hover:text-white transition-colors">
                    Izmijeni
                  </Link>
                </div>
              )}
              {isMonthInactive && (
                <div className="inline-flex items-center gap-1.5 rounded-full bg-red-900/85 text-red-100 border border-red-500/40 px-3 py-1.5 shadow-lg backdrop-blur">
                  <span>⚠ Mjesec deaktiviran — nije vidljiv korisnicima</span>
                  <Link
                    href="/admin/calendar-style"
                    className="underline hover:text-white transition-colors"
                  >
                    Izmijeni
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* MOBILE PAGINATION — skrivena za football (paginacija je unutar CalendarMobileFootball) */}
          {activeTheme !== "football" && activeTheme !== "advent" && (
            <div className="flex items-center justify-center md:hidden">
              <MonthPagination
                year={year}
                month={month}
                prevMonth={prevMonth}
                nextMonth={nextMonth}
                className="text-sm"
              />
            </div>
          )}

          {advent ? (
            <div className="mt-6">
              <AdventCalendar
                days={adventDays}
                adminPreview={isAdmin}
                year={year}
                month={month}
                prevMonth={prevMonth}
                nextMonth={nextMonth}
                pagLabel={pagLabel}
                showPagination={showPagination}
              />
            </div>
          ) : (
            <>
              <div className={activeTheme === "football" ? "mt-2 md:mt-1" : "mt-6"}>
                <CalendarGrid
                  year={year}
                  month={month}
                  weekly={weekly}
                  specials={specials}
                  adminPreview={isAdmin}
                  lang={lang}
                  theme={activeTheme}
                  confetti={confettiStyle}
                  prevMonth={prevMonth}
                  nextMonth={nextMonth}
                />
              </div>

              <CalendarEnhancer adminPreview={isAdmin} lang={lang} />
            </>
          )}

          {/* DESKTOP PAGINATION */}
          {showPagination && (
          <div className={`hidden md:flex items-center justify-center ${activeTheme === "football" ? "mt-4" : "mt-6"}`}>
            <MonthPagination
              year={year}
              month={month}
              prevMonth={prevMonth}
              nextMonth={nextMonth}
              className={advent ? "" : "text-base"}
              label={pagLabel}
              variant={advent ? "advent" : "default"}
            />
          </div>
          )}
        </div>
        )}
      </main>
    </div>
  );
}

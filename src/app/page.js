// src/app/page.js
import CalendarGrid from "@/components/CalendarGrid";
import CalendarEnhancer from "@/components/CalendarEnhancer";
import MonthPagination from "@/components/MonthPagination";
import AdminLogoutButton from "@/components/AdminLogoutButton";
import prisma from "@/lib/db";
import { cookies } from "next/headers";
import SnowOverlay from "@/components/SnowOverlay";
import { redirect } from "next/navigation";

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
      flipCard:    !!r.flipCard,
    };
  });
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
const BASE_URL = "https://calendar.meridianbet.ba";

const MONTH_NAMES_BS = [
  "Januar", "Februar", "Mart", "April", "Maj", "Juni",
  "Juli", "August", "Septembar", "Oktobar", "Novembar", "Decembar",
];

export async function generateMetadata({ searchParams }) {
  const sp = await searchParams;
  const yRaw = Array.isArray(sp?.y) ? sp.y[0] : sp?.y;
  const mRaw = Array.isArray(sp?.m) ? sp.m[0] : sp?.m;

  const now = new Date();
  const year  = Number.isInteger(parseInt(yRaw)) ? parseInt(yRaw) : now.getFullYear();
  const month =
    Number.isInteger(parseInt(mRaw)) && parseInt(mRaw) >= 0 && parseInt(mRaw) <= 11
      ? parseInt(mRaw)
      : now.getMonth();

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();
  const canonical = isCurrentMonth ? `${BASE_URL}/` : `${BASE_URL}/?y=${year}&m=${month}`;

  const settings = await prisma.calendarSettings.findFirst();
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
export default async function Home({ searchParams }) {
  const sp = await searchParams;

  const cookieStore = await cookies();
  const adminCookie = cookieStore.get("admin_auth");
  const isAdmin = !!adminCookie?.value;

  const now = new Date();
  const lang = "ba";

  const yRaw = getParam(sp, "y");
  const mRaw = getParam(sp, "m");

  const reqYear  = Number.parseInt(yRaw ?? "", 10);
  const reqMonth = Number.parseInt(mRaw ?? "", 10);

  const MIN_YEAR = 2024;
  const MAX_YEAR = now.getFullYear() + 2;

  const year =
    Number.isInteger(reqYear) && reqYear >= MIN_YEAR && reqYear <= MAX_YEAR
      ? reqYear
      : now.getFullYear();
  const month =
    Number.isInteger(reqMonth) && reqMonth >= 0 && reqMonth <= 11
      ? reqMonth
      : now.getMonth();

  // Calendar settings — always read fresh (inactive flag must be current)
  const calendarSettings = await prisma.calendarSettings.findFirst();
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
      await findNearestMonthWithPromos(year, month, "next", inactiveSet) ||
      await findNearestMonthWithPromos(year, month, "prev", inactiveSet);
    if (nearest) redirect(`/?y=${nearest.y}&m=${nearest.m}`);
  }

  // Load promo data
  const [weeklyPlanRows, specialRows] = await Promise.all([
    prisma.weeklyPlan.findMany({ where: { year, month }, orderBy: { weekday: "asc" } }),
    prisma.specialPromotion.findMany({ where: { year, month }, orderBy: [{ day: "asc" }] }),
  ]);

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
  const activeTheme      = monthBg.theme    || calendarSettings?.theme            || "default";

  const pos = monthBg.position || calendarSettings?.calendarPosition || "left";
  const mainJustify  = pos === "center" ? "md:justify-center" : pos === "right" ? "md:justify-end"   : "md:justify-start";
  const innerMargin  = pos === "center" ? "mx-auto"            : pos === "right" ? "mx-auto md:mx-0 md:ml-auto" : "mx-auto md:mx-0 md:mr-auto";
  const headingAlign = pos === "center" ? "md:text-center"     : pos === "right" ? "md:text-right"   : "md:text-left";

  const calendarTitle =
    monthBg.titleBa ||
    calendarSettings?.calendarTitle?.ba ||
    "Kalendar Promocija";

  const isMonthInactive = !!monthBg.inactive;

  // Pagination
  const [prevMonth, nextMonth] = await Promise.all([
    findNearestMonthWithPromos(year, month, "prev", inactiveSet),
    findNearestMonthWithPromos(year, month, "next", inactiveSet),
  ]);

  return (
    <div className="min-h-[100dvh] flex flex-col overflow-hidden">
      {/* HEADER — transparent overlay, centered logo */}
      <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-center px-4 py-6 md:py-7">
        <a
          href="https://meridianbet.ba"
          target="_blank"
          rel="noreferrer"
          aria-label="Meridianbet"
        >
          <img
            src={logoUrl}
            alt="Meridianbet"
            className="h-8 md:h-10 w-auto"
          />
        </a>
      </header>

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

        <div className={`relative z-10 w-full max-w-6xl px-4 sm:px-6 md:px-10 lg:px-16 pt-20 pb-4 md:pt-24 md:pb-10 ${innerMargin}`}>
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

          {isAdmin && (
            <div className="mt-2 mb-4 flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 rounded bg-amber-500/20 text-amber-200 px-3 py-1 text-sm">
                <span>Admin preview</span>
                <a
                  href="/admin"
                  className="underline hover:text-white transition-colors"
                  title="Go to dashboard"
                >
                  Dashboard
                </a>
                <AdminLogoutButton />
              </div>
              {isMonthInactive && (
                <div className="inline-flex items-center gap-1.5 rounded bg-red-700/40 text-red-200 border border-red-500/40 px-3 py-1 text-sm">
                  <span>⚠ Mjesec deaktiviran — nije vidljiv korisnicima</span>
                  <a
                    href="/admin/calendar-style/monthly"
                    className="underline hover:text-white transition-colors"
                  >
                    Izmijeni
                  </a>
                </div>
              )}
            </div>
          )}

          {/* MOBILE PAGINATION — skrivena za football (paginacija je unutar CalendarMobileFootball) */}
          {activeTheme !== "football" && (
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

          <div className={activeTheme === "football" ? "mt-2 md:mt-1" : "mt-6"}>
            <CalendarGrid
              year={year}
              month={month}
              weekly={weekly}
              specials={specials}
              adminPreview={isAdmin}
              lang={lang}
              theme={activeTheme}
              prevMonth={prevMonth}
              nextMonth={nextMonth}
            />
          </div>

          <CalendarEnhancer adminPreview={isAdmin} lang={lang} />

          {/* DESKTOP PAGINATION */}
          <div className={`hidden md:flex items-center justify-center ${activeTheme === "football" ? "mt-4" : "mt-6"}`}>
            <MonthPagination
              year={year}
              month={month}
              prevMonth={prevMonth}
              nextMonth={nextMonth}
              className="text-base"
            />
          </div>
        </div>
      </main>
    </div>
  );
}

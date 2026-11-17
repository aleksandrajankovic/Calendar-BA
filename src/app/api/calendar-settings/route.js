// src/app/api/calendar-settings/route.js
export const runtime = "nodejs";

import { revalidateTag } from "next/cache";
import prisma from "@/lib/db";
import { getAdminFromRequest } from "@/lib/auth";
import { sanitizeConfetti } from "@/lib/confetti";
import { sanitizeLink } from "@/lib/validate";

const VALID_POS = ["left", "center", "right"];
const VALID_THEMES = ["default", "default-horizontal", "football", "advent"];
const YMD = /^\d{4}-\d{2}-\d{2}$/;
const DEFAULT_SEO_META = {
  ba: { title: "Kalendar Promocija | Meridianbet", description: "Otkrijte dnevne promocije i iskoristite ekskluzivne nagrade uz Meridianbet Kalendar Promocija." },
};

export async function GET(req) {
  const session = await getAdminFromRequest(req);
  if (!session) return new Response("unauthorized", { status: 401 });

  const row = await prisma.calendarSettings.findFirst();
  return Response.json({
    bgImageUrl:       row?.bgImageUrl       || "/img/bg-calendar.png",
    bgImageUrlMobile: row?.bgImageUrlMobile || "/img/bg-calendar-mobile.png",
    monthBackgrounds: row?.monthBackgrounds || {},
    calendarPosition: row?.calendarPosition || "left",
    calendarTitle:    row?.calendarTitle    || { ba: "KALENDAR PROMOCIJA", en: "PROMOTIONS CALENDAR" },
    logoUrl:          row?.logoUrl          || "/img/meridianbet-ng.png",
    theme:            row?.theme            || "default",
    seoMeta:          row?.seoMeta          || DEFAULT_SEO_META,
    showLogo:           row?.showLogo           ?? true,
    countdownTargetIso: row?.countdownTargetIso || "",
    countdownLabel:     row?.countdownLabel     || "",
    confetti:           row?.confetti           || null,
    closed:             row?.closed             || { enabled: false },
  });
}

export async function PUT(req) {
  const session = await getAdminFromRequest(req);
  if (!session) return new Response("unauthorized", { status: 401 });

  const body = await req.json().catch(() => ({}));

  // Partial update — only touch fields present in the request body
  const patch = {};

  if ("bgImageUrl" in body)
    patch.bgImageUrl = (body.bgImageUrl || "").trim() || null;

  if ("bgImageUrlMobile" in body)
    patch.bgImageUrlMobile = (body.bgImageUrlMobile || "").trim() || null;

  if ("calendarPosition" in body)
    patch.calendarPosition = VALID_POS.includes(body.calendarPosition) ? body.calendarPosition : "left";

  if ("logoUrl" in body)
    patch.logoUrl = (body.logoUrl || "").trim() || null;

  if ("showLogo" in body)
    patch.showLogo = body.showLogo === true;

  if ("confetti" in body)
    patch.confetti = sanitizeConfetti(body.confetti);

  // Kalendar zatvoren za posjetioce: naslov, opciono dugme (obični tekstovi — React ih
  // escape-uje pri prikazu; link prolazi istu provjeru kao linkovi promocija)
  if ("closed" in body) {
    const c = body.closed || {};
    const text = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");
    patch.closed = {
      enabled: c.enabled === true,
      message: text(c.message, 120),
      buttonLabel: text(c.buttonLabel, 60),
      buttonLink: sanitizeLink(text(c.buttonLink, 500)),
    };
  }

  if ("countdownTargetIso" in body) {
    const raw = (body.countdownTargetIso || "").trim();
    patch.countdownTargetIso = raw && !Number.isNaN(new Date(raw).getTime()) ? raw : null;
  }

  if ("countdownLabel" in body)
    patch.countdownLabel = (body.countdownLabel || "").trim().slice(0, 80) || null;

  if ("calendarTitle" in body) {
    const t = body.calendarTitle;
    patch.calendarTitle = {
      ba: (typeof t?.ba === "string" ? t.ba.trim() : "") || "KALENDAR PROMOCIJA",
      en: (typeof t?.en === "string" ? t.en.trim() : "") || "PROMOTIONS CALENDAR",
    };
  }

  if ("theme" in body)
    patch.theme = VALID_THEMES.includes(body.theme) ? body.theme : "default";

  if ("seoMeta" in body) {
    const s = body.seoMeta;
    patch.seoMeta = {
      ba: {
        title:       (typeof s?.ba?.title       === "string" ? s.ba.title.trim()       : "") || DEFAULT_SEO_META.ba.title,
        description: (typeof s?.ba?.description === "string" ? s.ba.description.trim() : "") || DEFAULT_SEO_META.ba.description,
      },
    };
  }

  if ("monthBackgrounds" in body) {
    let cleaned = null;
    const raw = body.monthBackgrounds;
    if (raw && typeof raw === "object" && !Array.isArray(raw)) {
      const out = {};
      for (const [key, val] of Object.entries(raw)) {
        if (val && typeof val === "object") {
          const desktop  = (val.desktop  || "").trim() || null;
          const mobile   = (val.mobile   || "").trim() || null;
          const position = VALID_POS.includes(val.position) ? val.position : null;
          const titleBa  = (val.titleBa  || "").trim() || null;
          const inactive = val.inactive === true ? true : null;
          const theme    = VALID_THEMES.includes(val.theme) ? val.theme : null;
          const isAdvent = theme === "advent";
          const adventStart = isAdvent && YMD.test(val.adventStart || "") ? val.adventStart : null;
          const adventEnd   = isAdvent && YMD.test(val.adventEnd   || "") ? val.adventEnd   : null;
          const confetti = sanitizeConfetti(val.confetti);
          if (desktop || mobile || position || titleBa || inactive || theme || confetti)
            out[key] = { desktop, mobile, position, titleBa, inactive, theme, adventStart, adventEnd, confetti };
        }
      }
      cleaned = Object.keys(out).length ? out : null;
    }
    patch.monthBackgrounds = cleaned;
  }

  const row = await prisma.calendarSettings.upsert({
    where:  { id: 1 },
    update: patch,
    create: { id: 1, ...patch },
  });

  revalidateTag("calendar");
  return Response.json({
    bgImageUrl:       row.bgImageUrl       || "/img/bg-calendar.png",
    bgImageUrlMobile: row.bgImageUrlMobile || "/img/bg-calendar-mobile.png",
    monthBackgrounds: row.monthBackgrounds || {},
    calendarPosition: row.calendarPosition || "left",
    calendarTitle:    row.calendarTitle    || { ba: "KALENDAR PROMOCIJA", en: "PROMOTIONS CALENDAR" },
    logoUrl:          row.logoUrl          || "/img/meridianbet-ng.png",
    theme:            row.theme            || "default",
    seoMeta:          row.seoMeta          || DEFAULT_SEO_META,
    showLogo:           row.showLogo,
    countdownTargetIso: row.countdownTargetIso || "",
    countdownLabel:     row.countdownLabel     || "",
    confetti:           row.confetti           || null,
    closed:             row.closed             || { enabled: false },
  });
}

// src/app/[year]/[month]/page.js
// Kanonski URL za mjesec: /2026/12 (mjeseci 1-12). Tekući mjesec živi na "/".
// Sav prikaz je u src/app/page.js — ova ruta samo validira URL i prosljeđuje mjesec.
import { notFound, redirect } from "next/navigation";
import Home, { generateMetadata as homeMetadata } from "../../page";
import { monthFromUrl, isValidYear, isValidMonth, isCurrentMonth } from "@/lib/calendarUrls";

function parseParams(params) {
  if (!/^\d{4}$/.test(params.year) || !/^\d{1,2}$/.test(params.month)) return null;
  const year = Number.parseInt(params.year, 10);
  const month = monthFromUrl(Number.parseInt(params.month, 10));
  if (!isValidYear(year) || !isValidMonth(month)) return null;
  return { year, month };
}

export async function generateMetadata({ params }) {
  const parsed = parseParams(await params);
  if (!parsed) return {};
  return homeMetadata({ pageMonth: parsed });
}

export default async function CalendarMonthPage({ params, searchParams }) {
  const parsed = parseParams(await params);
  if (!parsed) notFound();

  // Tekući mjesec ima kanonski URL "/" — bez duplikata sadržaja na dva URL-a
  if (isCurrentMonth(parsed.year, parsed.month)) redirect("/");

  return Home({ searchParams, pageMonth: parsed });
}

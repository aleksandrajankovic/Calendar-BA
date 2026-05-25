// src/app/promo/[iso]/[slug]/page.js
import { redirect } from "next/navigation";

// YYYY-MM-DD → { y, m(0-11) } + validacija
function parseISO(iso) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return null;
  const y = +match[1], mon = +match[2], d = +match[3];
  const dt = new Date(Date.UTC(y, mon - 1, d));
  const valid =
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() + 1 === mon &&
    dt.getUTCDate() === d;
  return valid ? { y, m: mon - 1 } : null;
}

// Direktan pristup /promo/[iso]/[slug] → redirect na odgovarajući mesec kalendara
export default async function PromoDetailPage({ params }) {
  const p = await params;
  const parsed = parseISO(p.iso);

  if (parsed) {
    redirect(`/?y=${parsed.y}&m=${parsed.m}`);
  }

  redirect("/");
}

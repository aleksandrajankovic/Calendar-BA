import { monthHref } from "@/lib/calendarUrls";

const MONTHS_BS = [
  "Januar", "Februar", "Mart", "April", "Maj", "Juni",
  "Juli", "August", "Septembar", "Oktobar", "Novembar", "Decembar",
];

export default function MonthPagination({ year, month, prevMonth, nextMonth, className = "", labelClassName = "", label = null, variant = "default" }) {
  // nazivi mjeseci ručno — browseri na telefonu često nemaju "bs-BA" pa prikažu "M11"
  const monthLabel = MONTHS_BS[month] || "";

  // advent: diskretna traka u bojama teme (tanak zlatni okvir, mala slova) umjesto velike tamne pilule
  if (variant === "advent") {
    const arrow = "grid h-7 w-7 place-items-center rounded-full text-[15px] leading-none";
    return (
      <div className={`inline-flex items-center gap-2 rounded-full border border-[#d1aa55]/45 bg-black/25 px-1.5 py-1 text-[#f2e7cf] backdrop-blur-sm ${className}`}>
        {prevMonth ? (
          <a href={monthHref(prevMonth.y, prevMonth.m)} className={`${arrow} text-[#d1aa55] hover:bg-[#d1aa55]/15`} aria-label="Previous month">‹</a>
        ) : (
          <span className={`${arrow} opacity-25`} aria-hidden="true">‹</span>
        )}
        <span className={`px-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${labelClassName}`}>
          {label ?? <>{monthLabel} {year}</>}
        </span>
        {nextMonth ? (
          <a href={monthHref(nextMonth.y, nextMonth.m)} className={`${arrow} text-[#d1aa55] hover:bg-[#d1aa55]/15`} aria-label="Next month">›</a>
        ) : (
          <span className={`${arrow} opacity-25`} aria-hidden="true">›</span>
        )}
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-4 rounded-full bg-black/40 px-4 py-2 text-white ${className}`}>
      {prevMonth ? (
        <a href={monthHref(prevMonth.y, prevMonth.m)} className="p-1 hover:opacity-80" aria-label="Previous month">
          ‹
        </a>
      ) : (
        <span className="p-1 opacity-20 cursor-default" aria-hidden="true">‹</span>
      )}

      <span className={`min-w-[140px] text-center font-semibold ${labelClassName}`}>
        {label ?? <>{monthLabel} <span className="ml-1 opacity-80">{year}</span></>}
      </span>

      {nextMonth ? (
        <a href={monthHref(nextMonth.y, nextMonth.m)} className="p-1 hover:opacity-80" aria-label="Next month">
          ›
        </a>
      ) : (
        <span className="p-1 opacity-20 cursor-default" aria-hidden="true">›</span>
      )}
    </div>
  );
}

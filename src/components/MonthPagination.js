import { monthHref } from "@/lib/calendarUrls";

const MONTHS_BS = [
  "Januar", "Februar", "Mart", "April", "Maj", "Juni",
  "Juli", "August", "Septembar", "Oktobar", "Novembar", "Decembar",
];

export default function MonthPagination({ year, month, prevMonth, nextMonth, className = "", labelClassName = "", label = null }) {
  // nazivi mjeseci ručno — browseri na telefonu često nemaju "bs-BA" pa prikažu "M11"
  const monthLabel = MONTHS_BS[month] || "";

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

// src/lib/calendarInteractions.js
import { renderScratchModal } from "./scratch/renderScratchModal";
import { initScratch } from "./scratch/initScratch";
import { esc } from "./escapeHtml";
import { firstImage, renderSlotModal, initSlot } from "./slot/slotReveal";
import { markDayOpened } from "./calendarProgress";
import { track, disableTracking } from "./track";

// -----------------------------
// NORMAL MODAL (bez scratch-a)
// -----------------------------
// export: koristi ga i advent tema za promociju u slot mašini (specijalan dan)
export function renderNormalModal(entry, lang = "ba", { hideLabel = false } = {}) {
  if (!entry) {
    return lang === "ba"
      ? "<p>Nema promocija za ovaj dan.</p>"
      : "<p>No promotions for this day.</p>";
  }

  const { promo, type } = entry;

  // obični tekstovi iz admina se escape-uju (vidi escapeHtml.js); richHtml je sanitizovan HTML
  const title = esc(entry.title || (promo && promo.title) || "");
  const button = esc(entry.button || (promo && promo.button) || "");
  const buttonColor = entry.buttonColor || (promo && promo.buttonColor) || "green";
  const link = entry.link || (promo && promo.link) || "";
  const richHtml = entry.richHtml || (promo && promo.richHtml) || "";

  if (!promo && !richHtml) {
    return lang === "ba"
      ? "<p>Nema promocija za ovaj dan.</p>"
      : "<p>No promotions for this day.</p>";
  }

  let imageHtml = null;
  let contentHtml = richHtml;

  if (contentHtml) {
    const imgMatch = contentHtml.match(/<img[^>]*>/i);
    if (imgMatch) {
      imageHtml = imgMatch[0]
        .replace(/\s+width="[^"]*"/gi, "")
        .replace(/\s+height="[^"]*"/gi, "")
        .replace(/\s+style="[^"]*"/gi, "");
      contentHtml = contentHtml.replace(imgMatch[0], "");
    }
  }

  let categoryLabel;
  if (type === "special") {
    categoryLabel = lang === "ba" ? "Ekskluzivna promocija" : "Special promotion";
  } else {
    categoryLabel = lang === "ba" ? "Sedmična promocija" : "Weekly promotion";
  }

  const openUrl = link && esc(link);
  const canOpen = openUrl && openUrl !== "#";
  const isYellow = buttonColor === "yellow";
  const defaultButtonLabel = button || (lang === "ba" ? "Saznaj više" : "Learn more");

  return `
    <div class="flex flex-col w-full max-w-[420px] mx-auto">
      ${
        imageHtml
          ? `
        <div class="mb-4 [&_img]:w-full [&_img]:h-auto [&_img]:rounded-2xl">
          ${imageHtml}
        </div>`
          : ""
      }

      <h2 class="font-bold text-[24px] md:text-[28px] leading-tight mb-2 text-center text-white">
        ${title}
      </h2>
      ${
        hideLabel
          ? ""
          : `<div class="text-[11px] uppercase tracking-[0.12em] text-[#FACC01] mb-3 text-center">
        ${categoryLabel}
      </div>`
      }

      ${
        contentHtml
          ? `
        <div class="
          text-sm leading-relaxed text-white/90
          [&_strong]:font-semibold [&_em]:italic [&_u]:underline
          [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-1
          [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-1
          [&_li]:mb-0.5
          [&_h1]:text-xl [&_h1]:font-bold [&_h1]:mb-1 [&_h1]:mt-2
          [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mb-1 [&_h2]:mt-2
          [&_h3]:text-base [&_h3]:font-bold [&_h3]:mb-1 [&_h3]:mt-2
        ">
          ${contentHtml}
        </div>`
          : ""
      }

      ${
        canOpen
          ? `
        <div class="pt-5 mt-2 flex justify-center">
          <a
            href="${openUrl}"
            data-track="cta"
            target="_blank"
            rel="noreferrer"
            class="
              w-4/5 max-w-[360px]
              inline-flex items-center justify-center
              px-4 py-3
              rounded-[10px]
              text-sm font-semibold font-condensed
              shadow-[0_10px_25px_rgba(0,0,0,0.6)]
              transition
              ${
                isYellow
                  ? "bg-[#FACC01] text-black hover:brightness-110"
                  : "bg-[#17BB00] text-white hover:brightness-110"
              }
            "
          >
            ${defaultButtonLabel}
          </a>
        </div>`
          : ""
      }
    </div>
  `;
}

// -----------------------------
// SLOT MAŠINA
// -----------------------------
// Tri valjka vrte slike ostalih promocija mjeseca (entry.slotPool) i staju na sliku ove
// promocije, koja se zatim pretvara u običan prikaz promocije.
const MONTHS_BA = [
  "januar", "februar", "mart", "april", "maj", "juni",
  "juli", "august", "septembar", "oktobar", "novembar", "decembar",
];

function renderSlot(entry, lang) {
  const richHtml = entry.richHtml || entry.promo?.richHtml || "";
  const image = firstImage(richHtml);
  return renderSlotModal({
    image,
    icon: entry.icon || entry.promo?.icon || "",
    pool: entry.slotPool?.length ? entry.slotPool : [image || entry.icon].filter(Boolean),
    promoHtml: renderNormalModal(entry, lang),
    dateLabel: `${entry.day}. ${MONTHS_BA[entry.month] || ""}`,
    buttonLabel: "OTKRIJ PROMOCIJU",
  });
}

// -----------------------------
// MAIN RENDER
// -----------------------------
function renderModalHTML(entry, lang = "ba") {
  if (!entry) {
    return lang === "ba"
      ? "<p>Nema promocija za ovaj dan.</p>"
      : "<p>No promotions for this day.</p>";
  }

  const { promo, type } = entry;

  const title = entry.title || (promo && promo.title) || "";
  const button = entry.button || (promo && promo.button) || "";
  const buttonColor = entry.buttonColor || (promo && promo.buttonColor) || "green";
  const link = entry.link || (promo && promo.link) || "";
  const richHtml = entry.richHtml || (promo && promo.richHtml) || "";
  const defaultButtonLabel = button || (lang === "ba" ? "Saznaj više" : "Learn more");

  if (entry?.slot || promo?.slot) return renderSlot(entry, lang);

  const isScratch = !!(entry?.scratch || promo?.scratch);
  const flipCard = !!(entry?.flipCard || promo?.flipCard);

  if (isScratch) {
    const shareKey =
      entry?.shareUrl ||
      `${entry?.year}-${entry?.month}-${entry?.day}-${type || "promo"}`;

    return renderScratchModal({
      title,
      richHtml,
      link,
      button: defaultButtonLabel,
      buttonColor,
      type,
      lang,
      shareKey,
      threshold: 0.7,
      flipCard,
      year: entry?.year,
      month: entry?.month,
      day: entry?.day,
    });
  }

  return renderNormalModal(entry, lang);
}

// -----------------------------
// INIT FUNKCIJA
// -----------------------------
export function initCalendarInteractions(rootSelector = "#calendar-root") {
  const root = document.querySelector(rootSelector);
  if (!root) return;

  const dataEl = root.querySelector("#calendar-data");
  if (!dataEl) return;

  const payload = JSON.parse(dataEl.textContent || "{}");
  const days = Array.isArray(payload.days) ? payload.days : [];

  // Analitika: admin pregled se ne broji
  if (payload.adminPreview) disableTracking();
  track("view", { year: payload.year, month: payload.month });

  function trackDay(type, entry) {
    track(type, {
      year: entry.year,
      month: entry.month,
      day: entry.day,
      promoType: entry.type,
      title: entry.title,
    });
  }
  let currentEntry = null;
  const lang = payload.lang || "ba";

  const modal = root.querySelector("#promo-modal");
  const content = root.querySelector("#promo-content");
  const closeBtn = root.querySelector("#promo-close");
  const dialog = modal ? modal.querySelector("#promo-dialog") : null;

  if (!modal || !content) return;

  let isOpen = false;
  let previousUrl = null;

  function resetModalStyles() {
    modal.style.opacity = "";
    modal.style.transition = "";
  }

  function animateOpen() {
    if (!dialog) return;

    dialog.classList.remove(
      "opacity-100", "translate-y-0", "scale-100",
      "opacity-0", "translate-y-4", "scale-95"
    );

    dialog.style.opacity = "0";
    dialog.style.transform = "scale(0.85)";
    dialog.style.transition =
      "opacity 300ms cubic-bezier(0.34,1.56,0.64,1), transform 300ms cubic-bezier(0.34,1.56,0.64,1)";

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        dialog.style.opacity = "1";
        dialog.style.transform = "scale(1)";
        setTimeout(() => {
          dialog.style.transition = "";
          dialog.style.opacity = "";
          dialog.style.transform = "";
          dialog.classList.add("opacity-100", "translate-y-0", "scale-100");
        }, 320);
      });
    });
  }

  function animateClose(cb) {
    if (!dialog) {
      cb?.();
      return;
    }

    dialog.style.opacity = "";
    dialog.style.transform = "";
    dialog.style.transition = "";

    dialog.classList.remove("opacity-100", "translate-y-0", "scale-100");
    dialog.classList.add("opacity-0", "translate-y-4", "scale-95");

    setTimeout(() => cb?.(), 200);
  }

  let disposeSlot = () => {};

  // Slot: jednom zavrteo = pri sljedećem otvaranju odmah promocija (kao ogrebana grebalica)
  function slotKey(entry) {
    return `slot:${entry.shareUrl || `${entry.year}-${entry.month}-${entry.day}`}`;
  }

  function startSlot(entry) {
    if (!document.getElementById("slot-reveal")) return;
    let alreadyOpened = false;
    try {
      alreadyOpened = localStorage.getItem(slotKey(entry)) === "1";
    } catch {}
    disposeSlot = initSlot({
      alreadyOpened,
      confetti: payload.confetti?.style !== "off",
      onStopped: () => {
        try {
          localStorage.setItem(slotKey(entry), "1");
        } catch {}
        markDayOpened(entry.year, entry.month, entry.day);
        trackDay("slot", entry);
      },
    });
  }

  function openModal(entry) {
    currentEntry = entry;
    if (entry?.hasPromo) trackDay("day_open", entry);
    content.innerHTML = renderModalHTML(entry, lang);

    modal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
    isOpen = true;

    previousUrl = window.location.href;
    if (entry && entry.shareUrl) {
      history.pushState({ promo: true }, "", entry.shareUrl);
    }

    animateOpen();

    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        const canvas = document.getElementById("scratch-canvas");
        if (canvas) initScratch({ confetti: payload.confetti });
        startSlot(entry);
      })
    );
  }

  function closeModal({ fromPopstate = false } = {}) {
    isOpen = false;
    currentEntry = null;
    disposeSlot();
    disposeSlot = () => {};
    document.body.style.overflow = "";
    resetModalStyles();

    animateClose(() => {
      modal.classList.add("hidden");
      content.innerHTML = "";

      if (!fromPopstate && previousUrl) {
        history.replaceState(null, "", previousUrl);
      }
    });
  }

  // Klik na dan
  root.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-day-button]");
    if (!btn) return;

    const day = Number(btn.getAttribute("data-day"));
    const entry = days.find((d) => d.day === day);

    if (!entry) return;

    openModal(entry);
  });

  // Klik na dugme promocije (data-track="cta") — analitika
  content.addEventListener("click", (e) => {
    if (currentEntry && e.target.closest('[data-track="cta"]')) trackDay("cta", currentEntry);
  });

  // Grebalica javlja kad je ogrebana (initScratch)
  window.addEventListener("mb-scratch-revealed", () => {
    if (currentEntry) trackDay("scratch", currentEntry);
  });

  // X dugme
  closeBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    closeModal();
  });

  // Klik na overlay
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  // ESC
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isOpen) {
      closeModal();
    }
  });

  // Back/forward
  window.addEventListener("popstate", () => {
    if (isOpen) {
      closeModal({ fromPopstate: true });
    }
  });
}

export default initCalendarInteractions;

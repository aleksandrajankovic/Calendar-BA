// src/lib/scratch/renderScratchModal.js

function extractFirstImg(richHtml = "") {
  if (!richHtml) return { imgSrc: "", restHtml: "" };
  const m = richHtml.match(/<img[^>]*src=["']([^"']+)["'][^>]*>/i);
  const imgSrc = m?.[1] || "";
  const restHtml = imgSrc ? richHtml.replace(m[0], "") : richHtml;
  return { imgSrc, restHtml };
}

export function renderScratchModal({
  title,
  richHtml,
  link,
  button,
  buttonColor,
  type,
  lang,
  shareKey,
  threshold = 0.7,
  coverSrc = "/img/scratchCard.png",
  flipCard = false,
  year,
  month,
  day,
}) {
  const { imgSrc, restHtml } = extractFirstImg(richHtml);

  const categoryLabel =
    type === "special"
      ? lang === "ba" ? "Ekskluzivna promocija" : "Special promotion"
      : lang === "ba" ? "Sedmična promocija"    : "Weekly promotion";

  const isYellow = buttonColor === "yellow";
  const canOpen = link && link !== "#";
  const safeKey = String(shareKey || "default");

  const hintText  = lang === "ba" ? "SPREMAN ZA IZNENAĐENJE?" : "Ready for a surprise?";
  const hintText1 = lang === "ba"
    ? "Ogrebi i otkrij današnju specijalnu promociju"
    : "Scratch to reveal today's offer";

  const canvas = `
    <canvas
      id="scratch-canvas"
      data-key="${safeKey}"
      data-cover="${coverSrc}"
      data-threshold="${threshold}"
      data-year="${year ?? ""}"
      data-month="${month ?? ""}"
      data-day="${day ?? ""}"
      class="absolute inset-0 z-10 touch-none select-none rounded-2xl"
      style="width:100%; height:100%; background-color:#6b21a8"
    ></canvas>`;

  // ── FLIP CARD mod ────────────────────────────────────────────────────────
  if (flipCard) {
    const flipHintText = lang === "ba" ? "Tapni za detalje promocije" : "Tap for promo details";

    return `
    <div class="w-full max-w-[420px] mx-auto">

      <div id="scratch-hint" class="mb-2 text-center text-xl font-semibold text-white uppercase">${hintText}</div>
      <div id="scratch-hint1" class="mb-3 text-[#FACC01] text-sm text-center uppercase">${hintText1}</div>

      <div class="flip-card-wrapper relative w-full rounded-2xl" style="aspect-ratio:420/450; perspective:1000px">

        <!-- Slika vidljiva iza canvasa dok se grebe; overflow-hidden ovdje ne utiče na 3D context wrappera -->
        <div id="scratch-bg-img" class="absolute inset-0 rounded-2xl overflow-hidden">
          ${imgSrc
            ? `<img src="${imgSrc}" alt="" class="w-full h-full object-contain block" />`
            : `<div class="w-full h-full bg-[#1a0a2e] flex items-center justify-center text-white/50 text-sm">Nema slike</div>`}
        </div>

        <!-- Flip kartica — pojavljuje se tek nakon grebanja (opacity-0 → opacity-100) -->
        <div id="scratch-reveal" class="absolute inset-0 opacity-0 pointer-events-none transition-opacity duration-500">
          <div id="flip-card-inner" class="flip-card-inner relative w-full h-full cursor-pointer">

            <!-- prednja strana: ista slika (bezšavni prelaz nakon reveal-a) -->
            <div class="flip-card-face absolute inset-0 rounded-2xl overflow-hidden">
              ${imgSrc
                ? `<img src="${imgSrc}" alt="" class="w-full h-full object-contain block" />`
                : `<div class="w-full h-full bg-[#1a0a2e]"></div>`}
            </div>

            <!-- zadnja strana: promo detalji -->
            <div class="flip-card-face flip-card-back absolute inset-0 rounded-2xl bg-[#05070D] flex flex-col items-center justify-center gap-5 p-8 text-center">
              <div class="text-[11px] uppercase tracking-[0.15em] text-[#FACC01]">${categoryLabel}</div>
              <h2 class="font-bold text-[22px] md:text-[26px] text-white leading-tight">${title}</h2>
              ${canOpen
                ? `<a href="${link}" target="_blank" rel="noreferrer"
                     class="w-4/5 max-w-[300px] px-4 py-3 rounded-[10px] text-sm text-center font-semibold block
                            ${isYellow ? "bg-[#FACC01] text-black" : "bg-[#17BB00] text-white"}
                            hover:brightness-110 transition"
                   >${button}</a>`
                : ""}
            </div>

          </div>
        </div>

        ${canvas}
      </div>

      <div id="flip-hint" class="mt-3 text-center text-sm text-[#FACC01] opacity-0 transition-opacity duration-500">${flipHintText}</div>
    </div>`;
  }

  // ── KLASIČNI mod ─────────────────────────────────────────────────────────
  return `
  <div class="w-full max-w-[420px] mx-auto rounded-3xl overflow-hidden">

    <div>
      <div class="relative h-[140px] overflow-hidden rounded-2xl bg-[#6b21a8] md:h-40" style="line-height:0">
        ${imgSrc
          ? `<img src="${imgSrc}" alt="" class="absolute inset-0 z-0 block w-full h-full object-cover" />`
          : `<div class="absolute inset-0 z-0 flex items-center justify-center text-white/70 text-sm leading-normal">No image</div>`}
        ${canvas}
      </div>

      <div id="scratch-hint" class="mt-3 text-center text-xl font-semibold text-white uppercase">${hintText}</div>
      <div id="scratch-hint1" class="text-[#FACC01] text-sm text-center uppercase">${hintText1}</div>
    </div>

    <div
      id="scratch-reveal"
      class="px-4 pb-5 overflow-hidden max-h-0 opacity-0 translate-y-2 pointer-events-none transition-all duration-500 ease-out"
    >
      <h2 class="font-bold text-[22px] md:text-[26px] text-center text-white">${title}</h2>

      <div class="text-[11px] uppercase tracking-[0.12em] text-[#FACC01] mt-2 text-center">${categoryLabel}</div>

      ${restHtml
        ? `<div class="mt-3 text-sm text-white/90
                [&_p]:mb-2 [&_p:last-child]:mb-0
                [&_strong]:font-semibold
                [&_ul]:list-disc [&_ul]:pl-5">${restHtml}</div>`
        : ""}

      ${canOpen
        ? `<div class="pt-5 flex justify-center">
             <a href="${link}" target="_blank" rel="noreferrer"
                class="w-4/5 max-w-[360px] px-4 py-3 rounded-[10px] text-sm text-center font-semibold
                       ${isYellow ? "bg-[#FACC01] text-black" : "bg-[#17BB00] text-white"}
                       hover:brightness-110 transition">
               ${button}
             </a>
           </div>`
        : ""}
    </div>
  </div>`;
}

// src/lib/scratch/initScratch.js
import confetti from "canvas-confetti";
import { markDayOpened } from "@/lib/calendarProgress";

function getAnonUserId() {
  try {
    let id = localStorage.getItem("anon_user_id");
    if (!id) {
      id =
        (crypto?.randomUUID && crypto.randomUUID()) ||
        `u_${Math.random().toString(16).slice(2)}_${Date.now()}`;
      localStorage.setItem("anon_user_id", id);
    }
    return id;
  } catch {
    return "anon";
  }
}

export function initScratch() {
  const canvas = document.getElementById("scratch-canvas");
  if (!canvas) return;

  const reveal = document.getElementById("scratch-reveal");
  const hint = document.getElementById("scratch-hint");
  const hint1 = document.getElementById("scratch-hint1");
  const flipHint = document.getElementById("flip-hint");

  const threshold = Number(canvas.dataset.threshold || 0.7);
  const coverUrl = canvas.dataset.cover;
  const promoKey = canvas.dataset.key || "default";

  const userId = getAnonUserId();
  const storageKey = `scratch:${userId}:${promoKey}`;

  let revealed = false;
  let drawing = false;
  let last = { x: 0, y: 0 };
  let timer = null;

  function showReveal() {
    // Radi za oba moda: klasični (max-h/translate) i flip card (samo opacity)
    reveal?.classList.remove("max-h-0", "opacity-0", "translate-y-2", "pointer-events-none");
    reveal?.classList.add("max-h-[1200px]", "opacity-100", "pointer-events-auto");
    // translate-y-0 namjerno nije ovdje — svaki CSS transform na parent-u uništava
    // transform-style: preserve-3d na #flip-card-inner i flip ne bi radio
    if (reveal) reveal.style.pointerEvents = "auto";
    flipHint?.classList.remove("opacity-0");
    flipHint?.classList.add("opacity-100");
    // Sakrij background sliku čim flip kartica postane vidljiva (front face preuzima prikaz)
    // Bez ovog koraka slika ostaje vidljiva iza 3D flip konteksta i probija kroz back face
    setTimeout(() => {
      const bgImg = document.getElementById("scratch-bg-img");
      if (bgImg) bgImg.style.display = "none";
    }, 520);
  }

  function attachFlipListener() {
    const flipInner = document.getElementById("flip-card-inner");
    if (!flipInner) return;

    flipInner.onclick = function (e) {
      if (e.target?.closest("a, button")) return;
      const flipped = flipInner.classList.toggle("is-flipped");
      if (flipHint) {
        flipHint.classList.toggle("opacity-0", flipped);
        flipHint.classList.toggle("opacity-100", !flipped);
      }
    };

    flipInner.style.pointerEvents = "auto";
    flipInner.style.cursor = "pointer";
  }

  function hideScratchInstant() {
    canvas.style.pointerEvents = "none";
    canvas.style.display = "none";
  }

  function fullyClearCanvas() {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.save();
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }

  // Već ogrebano — prikaži odmah
  try {
    if (localStorage.getItem(storageKey) === "1") {
      hint?.remove();
      hint1?.remove();
      hideScratchInstant();
      showReveal();
      attachFlipListener();
      return;
    }
  } catch {}

  function setup() {
    const r = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    if (!r.width || !r.height) return;

    canvas.width = Math.floor(r.width * dpr);
    canvas.height = Math.floor(r.height * dpr);

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = coverUrl;

    img.onload = () => {
      ctx.globalCompositeOperation = "source-over";
      ctx.clearRect(0, 0, r.width, r.height);
      ctx.fillStyle = "#6b21a8";
      ctx.fillRect(0, 0, r.width, r.height);
      ctx.drawImage(img, 0, 0, r.width, r.height);
      canvas.style.backgroundColor = "transparent";

      ctx.globalCompositeOperation = "destination-out";
      ctx.lineWidth = 46;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    };

    img.onerror = () => {
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "#6b21a8";
      ctx.fillRect(0, 0, r.width, r.height);
      canvas.style.backgroundColor = "transparent";

      ctx.globalCompositeOperation = "destination-out";
      ctx.lineWidth = 46;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    };
  }

  function scratch(from, to) {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  }

  function percent() {
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return 0;
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

    let clear = 0;
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] === 0) clear++;
    }
    return clear / (canvas.width * canvas.height);
  }

  function revealNow() {
    if (revealed) return;
    revealed = true;

    try {
      localStorage.setItem(storageKey, "1");
    } catch {}

    const y = parseInt(canvas.dataset.year, 10);
    const m = parseInt(canvas.dataset.month, 10);
    const d = parseInt(canvas.dataset.day, 10);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
      markDayOpened(y, m, d);
    }

    hint?.remove();
    hint1?.remove();

    const colors = ["#ff0000", "#ffd700", "#17bb00", "#0066ff", "#ff69b4", "#ffffff"];
    confetti({ particleCount: 80, spread: 70, startVelocity: 38, ticks: 300, origin: { x: 0.35, y: 0.35 }, colors });
    setTimeout(() => {
      confetti({ particleCount: 60, spread: 80, startVelocity: 32, ticks: 300, origin: { x: 0.65, y: 0.35 }, colors });
    }, 150);

    showReveal();
    attachFlipListener();
    fullyClearCanvas();

    canvas.style.pointerEvents = "none";
    canvas.style.transition = "opacity 250ms ease";
    canvas.style.opacity = "0";
    setTimeout(() => {
      canvas.style.display = "none";
    }, 260);
  }

  function check() {
    if (timer) return;
    timer = setTimeout(() => {
      timer = null;
      if (percent() >= threshold) revealNow();
    }, 180);
  }

  function point(e) {
    const r = canvas.getBoundingClientRect();
    const clientX = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    const clientY = e.clientY ?? e.touches?.[0]?.clientY ?? 0;
    return { x: clientX - r.left, y: clientY - r.top };
  }

  function down(e) {
    drawing = true;
    last = point(e);
    scratch(last, { x: last.x + 0.01, y: last.y });
    check();
  }

  function move(e) {
    if (!drawing) return;
    const p = point(e);
    scratch(last, p);
    last = p;
    check();
  }

  function up() {
    drawing = false;
  }

  setup();
  window.addEventListener("resize", setup, { once: true });

  canvas.onpointerdown = down;
  canvas.onpointermove = move;
  canvas.onpointerup = up;
  canvas.onpointerleave = up;
  canvas.onpointercancel = up;
}

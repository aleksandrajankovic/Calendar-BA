// src/lib/scratch/initScratch.js
import { markDayOpened } from "@/lib/calendarProgress";

// Emoji burst drawn on our own canvas. canvas-confetti's shapeFromText uses ImageBitmap
// patterns that render as white boxes on iOS Safari / some Android, and system emoji
// look different per OS, so we use Twemoji SVGs (public/img/fx, CC-BY 4.0) instead.
const BURST_IMAGES = ["/img/fx/bat.svg", "/img/fx/candy.svg"];
const BURST_SIZES = [18, 24, 30];
let spritesPromise = null;

// rasterize each image once per size; drawing a cached canvas per frame is cheap
function loadSprites() {
  if (spritesPromise) return spritesPromise;
  const dpr = window.devicePixelRatio || 1;
  spritesPromise = Promise.all(
    BURST_IMAGES.map(
      (src) =>
        new Promise((resolve) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = () => resolve(null);
          img.src = src;
        })
    )
  ).then((imgs) =>
    imgs.filter(Boolean).flatMap((img) =>
      BURST_SIZES.map((size) => {
        const c = document.createElement("canvas");
        c.width = c.height = Math.ceil(size * dpr);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        return { canvas: c, size };
      })
    )
  );
  return spritesPromise;
}

async function emojiBurst({ duration = 1400, perPuff = 8 } = {}) {
  const sprites = await loadSprites();
  if (!sprites.length) return;

  const dpr = window.devicePixelRatio || 1;
  const W = window.innerWidth;
  const H = window.innerHeight;

  const fx = document.createElement("canvas");
  fx.width = W * dpr;
  fx.height = H * dpr;
  Object.assign(fx.style, {
    position: "fixed",
    inset: "0",
    width: `${W}px`,
    height: `${H}px`,
    pointerEvents: "none",
    zIndex: "9999",
  });
  document.body.appendChild(fx);
  const ctx = fx.getContext("2d");

  const rand = (min, max) => Math.random() * (max - min) + min;
  const parts = [];
  const burstEnd = Date.now() + duration;
  let left = true;

  // alternate sides and mirror angle/drift so both halves get the same amount
  (function puff() {
    const offset = rand(0.05, 0.35);
    const tilt = rand(0, 30);
    const spread = rand(40, 80);
    const drift = rand(0, 0.6);
    const size = BURST_SIZES[Math.floor(Math.random() * BURST_SIZES.length)];
    const pool = sprites.filter((s) => s.size === size);
    const ox = W * (left ? 0.5 - offset : 0.5 + offset);
    const oy = H * rand(0.3, 0.45);
    for (let i = 0; i < perPuff; i++) {
      const deg = (left ? 90 + tilt : 90 - tilt) + rand(-spread / 2, spread / 2);
      const rad = (deg * Math.PI) / 180;
      const speed = rand(20, 38) * rand(0.5, 1);
      parts.push({
        sprite: pool[Math.floor(Math.random() * pool.length)].canvas,
        size,
        x: ox,
        y: oy,
        vx: Math.cos(rad) * speed,
        vy: -Math.sin(rad) * speed,
        gravity: rand(0.6, 0.9) * 3,
        drift: left ? -drift : drift,
        wobble: rand(0, Math.PI * 2),
        wobbleSpeed: rand(0.05, 0.12),
        tick: 0,
        ticks: 320,
      });
    }
    left = !left;
    if (Date.now() < burstEnd) setTimeout(puff, rand(30, 70));
  })();

  let last = performance.now();
  (function frame(now) {
    const step = Math.min((now - last) / (1000 / 60), 3);
    last = now;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, fx.width, fx.height);

    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.tick += step;
      p.vx *= Math.pow(0.93, step);
      p.vy *= Math.pow(0.93, step);
      p.x += (p.vx + p.drift) * step;
      p.y += (p.vy + p.gravity) * step;
      p.wobble += p.wobbleSpeed * step;

      if (p.tick >= p.ticks || p.y > H + 40) {
        parts.splice(i, 1);
        continue;
      }

      const a = Math.sin(p.wobble) * 0.35;
      const cos = Math.cos(a) * dpr;
      const sin = Math.sin(a) * dpr;
      ctx.setTransform(cos, sin, -sin, cos, p.x * dpr, p.y * dpr);
      ctx.globalAlpha = 1 - p.tick / p.ticks;
      ctx.drawImage(p.sprite, -p.size / 2, -p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;

    if (parts.length || Date.now() < burstEnd) requestAnimationFrame(frame);
    else fx.remove();
  })(last);
}

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
  loadSprites();

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

    reveal?.classList.remove("max-h-0", "opacity-0", "translate-y-2", "pointer-events-none");
    reveal?.classList.add("max-h-[1200px]", "opacity-100", "pointer-events-auto");
  
    if (reveal) reveal.style.pointerEvents = "auto";
    flipHint?.classList.remove("opacity-0");
    flipHint?.classList.add("opacity-100");

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

    emojiBurst();

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

// src/components/advent/AdventCalendar.js
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { adventDisplay, adventBody } from "@/app/fonts";
import { ADVENT_SPRITE, TILE_ART } from "./adventArt";
import { track, disableTracking } from "@/lib/track";
import s from "./AdventCalendar.module.css";

const MONTHS = ["januar", "februar", "mart", "april", "maj", "juni", "juli", "august", "septembar", "oktobar", "novembar", "decembar"];
const WEEKDAYS = ["nedjelja", "ponedjeljak", "utorak", "srijeda", "četvrtak", "petak", "subota"];
const WEEKDAY_HEAD = ["Pon", "Uto", "Sri", "Čet", "Pet", "Sub", "Ned"];
const TONES = [s.tBordeaux, s.tCream, s.tOlive, s.tBeige];
const STORAGE_KEY = "advent-opened";

// Prošle promocije i dalje imaju dugme (CTA). Na false: umjesto dugmeta "Ova promocija je završena".
const PAST_CTA_ENABLED = true;

const fmtShort = (d) => `${d.d}.${d.m + 1}.`;
const cx = (...a) => a.filter(Boolean).join(" ");

function readOpened() {
  try {
    const v = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return new Set(Array.isArray(v) ? v : []);
  } catch {
    return new Set();
  }
}
function writeOpened(set) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...set].slice(-60)));
  } catch {}
}

// Ikonica promocije kao poklon; ako se slika ne učita (obrisana, pogrešan link), prikaže se
// podrazumijevana poklon kutija umjesto "polomljene slike" sa okvirom.
function GiftArt({ promo, className }) {
  const [broken, setBroken] = useState(false);
  if (promo?.icon && !broken) {
    return <img src={promo.icon} alt="" className={className} loading="lazy" onError={() => setBroken(true)} />;
  }
  return (
    <svg className={className} aria-hidden="true">
      <use href="#adv-g-gift" />
    </svg>
  );
}

// Dani prije i poslije perioda, da tabla bude pun pravougaonik po sedmicama (kao "ghost"
// polja u ostalim temama). Samo prikaz — bez vrata, ilustracije i klika.
function ghostDays(days) {
  const first = days[0];
  const last = days[days.length - 1];
  const lead = (first.weekday + 6) % 7;
  const trail = (7 - ((lead + days.length) % 7)) % 7;
  const at = (base, offset) => {
    const dt = new Date(Date.UTC(base.y, base.m, base.d + offset));
    return { key: `ghost-${dt.toISOString().slice(0, 10)}`, d: dt.getUTCDate(), m: dt.getUTCMonth() };
  };
  return {
    before: Array.from({ length: lead }, (_, i) => at(first, i - lead)),
    after: Array.from({ length: trail }, (_, i) => at(last, i + 1)),
  };
}

function Ghost({ day }) {
  return (
    <div className={s.ghost} aria-hidden="true">
      <span className={s.ghostNum}>{day.d}</span>
      <span className={s.ghostMon}>{MONTHS[day.m].slice(0, 3)}</span>
    </div>
  );
}

function Door({ day, index, isOpen, canOpen, adminPreview, hint, extraClass, onDoor, onGift }) {
  const label = `${day.d}. ${MONTHS[day.m]}`;
  const tone = TONES[(index * 3 + Math.floor(index / 7)) % 4];
  const state = s[day.state];

  return (
    <div
      className={cx(s.cell, tone, state, isOpen && s.open, adminPreview && day.state === "future" && s.adminOpenable, hint?.shake && s.shake, extraClass)}
    >
      <div className={s.recess}>
        {day.promo ? (
          <button
            type="button"
            className={s.gift}
            aria-label={`Poklon: ${day.promo.title || label}`}
            tabIndex={isOpen ? 0 : -1}
            onClick={() => isOpen && onGift(index)}
          >
            <GiftArt promo={day.promo} />
          </button>
        ) : (
          <svg className={s.empty} aria-hidden="true">
            <use href="#adv-i-star" />
          </svg>
        )}
      </div>

      <button
        type="button"
        className={s.door}
        aria-label={`${label}${day.state === "future" && !canOpen ? ", zaključano" : day.state === "today" ? ", danas – otvori" : ""}`}
        aria-hidden={isOpen || undefined}
        tabIndex={isOpen ? -1 : 0}
        onClick={() => onDoor(index)}
      >
        {[s.leafL, s.leafR].map((side) => (
          <span key={side} className={cx(s.leaf, side)}>
            <span className={cx(s.face, s.front)}>
              <span className={s.faceInner}>
                <span className={s.num}>{day.d}</span>
                <span className={s.mon}>{MONTHS[day.m].slice(0, 3)}</span>
                <svg className={s.ill} aria-hidden="true">
                  <use href={`#adv-i-${TILE_ART[index % TILE_ART.length]}`} />
                </svg>
              </span>
            </span>
            <span className={cx(s.face, s.back)} />
          </span>
        ))}
      </button>

      {day.state === "future" && (
        <span className={s.lock} aria-hidden="true">
          <svg>
            <use href="#adv-lock" />
          </svg>
        </span>
      )}
      {day.state === "today" && <span className={s.tag}>Danas</span>}
      {hint && <span className={s.hint}>{hint.text}</span>}
    </div>
  );
}

function trackDay(type, day) {
  track(type, { year: day.y, month: day.m, day: day.d, promoType: day.promo?.type, title: day.promo?.title });
}

// Prva slika iz opisa promocije ide na vrh pop-up-a kao naslovna (baner), ostatak opisa ispod
function splitHero(html = "") {
  const m = html.match(/<img[^>]*src=["']([^"']+)["'][^>]*>/i);
  if (!m) return { hero: null, body: html };
  return { hero: m[1], body: html.replace(m[0], "") };
}

const LIGHT_COUNT = 64;

function PromoModal({ day, onClose }) {
  const closeRef = useRef(null);
  const promo = day.promo;
  const past = day.state === "past";
  const ctaOff = past && !PAST_CTA_ENABLED;
  const hasLink = promo.link && promo.link !== "#";
  const { hero, body } = splitHero(promo.richHtml || "");
  const [heroBroken, setHeroBroken] = useState(false);
  const showHero = hero && !heroBroken;

  useEffect(() => {
    const prevFocus = document.activeElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      prevFocus?.focus?.({ preventScroll: true });
    };
  }, [onClose]);

  return (
    <div className={s.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={s.modalWrap}>
      {/* lampice po bordo ramu — isto kao kod slot reveal-a */}
      <svg className={s.lights} aria-hidden="true">
        {[0, 1].map((k) => (
          <rect
            key={k}
            className={k ? s.bulbsB : s.bulbsA}
            width="100%"
            height="100%"
            rx="13"
            pathLength="100"
            strokeDasharray={`0 ${200 / LIGHT_COUNT}`}
            strokeDashoffset={k ? 100 / LIGHT_COUNT : 0}
          />
        ))}
      </svg>
      <div className={s.modal} role="dialog" aria-modal="true" aria-labelledby="advent-modal-title">
        <button ref={closeRef} type="button" className={s.close} aria-label="Zatvori" onClick={onClose}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        {/* naslovna: baner promocije (prva slika iz opisa) ili praznična pozadina */}
        <div className={cx(s.hero, !showHero && s.heroPlain, ctaOff && s.heroPast)}>
          {showHero && <img src={hero} alt="" className={s.heroImg} onError={() => setHeroBroken(true)} />}
        </div>

        {/* poklon kao medaljon preko donje ivice naslovne */}
        <div className={cx(s.medal, showHero && s.medalBelow)}>
          <GiftArt promo={promo} className={s.medalGift} />
        </div>

        <div className={s.mBody}>
          <div className={s.meta}>
            <span className={cx(s.pill, ctaOff ? s.pillDone : s.pillDate)}>
              {ctaOff ? "Završeno · " : ""}
              {fmtShort(day)}
              {day.y}.
            </span>
          </div>
          <h2 id="advent-modal-title" className={s.mTitle}>
            {promo.title}
          </h2>
          <span className={s.ornament} aria-hidden="true">
            ✦
          </span>
          {body && <div className={s.rich} dangerouslySetInnerHTML={{ __html: body }} />}
        </div>

        {(hasLink || ctaOff) && (
          <div className={s.mFoot}>
            {ctaOff ? (
              <p className={s.doneNote}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 2" />
                </svg>
                Ova promocija je završena
              </p>
            ) : (
              <a
                href={promo.link}
                target="_blank"
                rel="noreferrer"
                onClick={() => trackDay("cta", day)}
                className={cx(s.cta, promo.buttonColor === "yellow" ? s.ctaGold : s.ctaOlive)}
              >
                {promo.button}
              </a>
            )}
          </div>
        )}
      </div>
      </div>
    </div>
  );
}

export default function AdventCalendar({ days = [], adminPreview = false }) {
  const todayIdx = days.findIndex((d) => d.state === "today");
  const initialSel = todayIdx >= 0 ? todayIdx : days[0]?.state === "future" ? 0 : Math.max(days.length - 1, 0);

  const [opened, setOpened] = useState(() => new Set());
  const [ready, setReady] = useState(false);
  const [modalIdx, setModalIdx] = useState(null);
  const [hint, setHint] = useState(null); // { i, text, shake, n }
  const [sel, setSel] = useState(initialSel);
  const [slide, setSlide] = useState(0);
  const chipsRef = useRef(null);
  const touch = useRef({ x: 0, y: 0, swiped: false });

  // Analitika: prikaz kalendara (admin pregled se ne broji)
  useEffect(() => {
    if (adminPreview) disableTracking();
    const first = days[0];
    if (first) track("view", { year: first.y, month: first.m });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Stanje otvorenih vrata pamti se samo u browseru korisnika.
  useEffect(() => {
    setOpened(readOpened());
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setReady(true)));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    if (!hint) return;
    const t = setTimeout(() => setHint(null), 1600);
    return () => clearTimeout(t);
  }, [hint]);

  useEffect(() => {
    const strip = chipsRef.current;
    const chip = strip?.children[sel];
    if (!chip) return;
    strip.scrollTo({ left: chip.offsetLeft - strip.clientWidth / 2 + chip.offsetWidth / 2, behavior: slide ? "smooth" : "auto" });
  }, [sel, slide]);

  const isOpen = (day) => day.state === "past" || opened.has(day.key);
  const canOpen = (day) => day.state !== "future" || adminPreview;

  const onDoor = useCallback(
    (i) => {
      if (touch.current.swiped) {
        touch.current.swiped = false;
        return;
      }
      const day = days[i];
      if (!day || isOpen(day)) return;
      if (!canOpen(day)) {
        setHint((h) => ({ i, text: `Otvara se ${fmtShort(day)}`, shake: true, n: (h?.n || 0) + 1 }));
        return;
      }
      setOpened((prev) => {
        const next = new Set(prev).add(day.key);
        if (day.state === "today") writeOpened(next);
        return next;
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [days, opened, adminPreview]
  );

  const onGift = useCallback((i) => {
    if (!days[i]?.promo) return;
    trackDay("day_open", days[i]);
    setModalIdx(i);
  }, [days]);

  const closeModal = useCallback(() => setModalIdx(null), []);

  const go = (n) => {
    if (n < 0 || n >= days.length || n === sel) return;
    setSlide(n > sel ? 1 : -1);
    setSel(n);
  };

  if (!days.length) return null;

  const selDay = days[sel];
  const ghosts = ghostDays(days);
  const selStateLabel =
    selDay.state === "today" ? "Danas" : selDay.state === "past" ? "Završeno" : "Zaključano";

  const doorProps = (day, i) => ({
    day,
    index: i,
    isOpen: isOpen(day),
    canOpen: canOpen(day),
    adminPreview,
    hint: hint && hint.i === i ? hint : null,
    onDoor,
    onGift,
  });

  return (
    <div className={cx(s.root, adventDisplay.variable, adventBody.variable, !ready && s.noAnim)}>
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
        <defs dangerouslySetInnerHTML={{ __html: ADVENT_SPRITE }} />
      </svg>


      <div className={s.board}>
        {/* DESKTOP: cijela tabla, poravnata po danima u sedmici (pon–ned) */}
        <div className={s.desk}>
          <div className={s.weekdays} aria-hidden="true">
            {WEEKDAY_HEAD.map((w) => (
              <span key={w}>{w}</span>
            ))}
          </div>
          <div className={s.grid}>
            {ghosts.before.map((g) => (
              <Ghost key={g.key} day={g} />
            ))}
            {days.map((day, i) => (
              <Door key={day.key} {...doorProps(day, i)} />
            ))}
            {ghosts.after.map((g) => (
              <Ghost key={g.key} day={g} />
            ))}
          </div>
        </div>

        {/* MOBILNI: jedno polje, swipe lijevo/desno */}
        <div className={s.mView}>
          <div className={s.chips} ref={chipsRef} role="tablist" aria-label="Dani">
            {days.map((day, i) => (
              <button
                key={day.key}
                type="button"
                role="tab"
                aria-selected={i === sel}
                className={cx(s.chip, s[day.state], i === sel && s.sel)}
                onClick={() => go(i)}
              >
                <b>{day.d}</b>
                <small>{MONTHS[day.m].slice(0, 3)}</small>
              </button>
            ))}
          </div>

          <div className={s.stageRow}>
            <button type="button" className={s.arrow} aria-label="Prethodni dan" disabled={sel === 0} onClick={() => go(sel - 1)}>
              ‹
            </button>
            <div
              className={s.stage}
              onTouchStart={(e) => {
                touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, swiped: false };
              }}
              onTouchEnd={(e) => {
                const dx = e.changedTouches[0].clientX - touch.current.x;
                const dy = e.changedTouches[0].clientY - touch.current.y;
                if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
                  touch.current.swiped = true;
                  go(sel + (dx < 0 ? 1 : -1));
                }
              }}
            >
              <Door
                key={`${selDay.key}-${sel}`}
                {...doorProps(selDay, sel)}
                extraClass={slide > 0 ? s.inLeft : slide < 0 ? s.inRight : ""}
              />
            </div>
            <button
              type="button"
              className={s.arrow}
              aria-label="Sljedeći dan"
              disabled={sel === days.length - 1}
              onClick={() => go(sel + 1)}
            >
              ›
            </button>
          </div>

          <div className={s.cap}>
            <span className={s.capState}>{selStateLabel}</span>
            <span className={s.capDate}>
              {WEEKDAYS[selDay.weekday]}, {selDay.d}. {MONTHS[selDay.m]}
            </span>
            <span className={s.capHint}>Prevuci lijevo ili desno za ostale dane</span>
          </div>
        </div>
      </div>

      {/* portal na <body>: pop-up je iznad svega (zaglavlje sa logom ima viši sloj od kalendara) */}
      {modalIdx !== null &&
        days[modalIdx]?.promo &&
        createPortal(
          <div className={cx(s.portal, adventDisplay.variable, adventBody.variable)}>
            <PromoModal day={days[modalIdx]} onClose={closeModal} />
          </div>,
          document.body
        )}
    </div>
  );
}

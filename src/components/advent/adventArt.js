// src/components/advent/adventArt.js
// SVG sprite za novogodišnju (advent) temu.
// - adv-i-*  : linijske ilustracije na vratima (boja dolazi iz currentColor, akcenat iz .acc)
// - adv-g-gift: podrazumijevani poklon kad promocija nema uploadovanu ikonicu
// - adv-lock : lokot za buduće dane

export const TILE_ART = [
  "tree", "star", "snow", "bell", "ornament", "candy", "ginger",
  "stock", "mitten", "holly", "candle", "giftbox", "snowman", "moon",
  "cocoa", "wreath", "clock", "cheers", "fire", "house", "sled",
];

const L = 'fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"';

export const ADVENT_SPRITE = `
<symbol id="adv-i-tree" viewBox="0 0 48 48"><path ${L} d="M24 9 13 22h6L10 33h11v7h6v-7h11l-9-11h6z"/><path class="acc" fill="currentColor" d="M24 2l1.6 3.4 3.6.4-2.7 2.4.8 3.6L24 10l-3.3 1.8.8-3.6-2.7-2.4 3.6-.4z"/></symbol>
<symbol id="adv-i-star" viewBox="0 0 48 48"><path ${L} d="M24 6l5 12 13 1-10 8 3 13-11-7-11 7 3-13-10-8 13-1z"/><circle class="acc" fill="currentColor" cx="24" cy="25" r="3"/></symbol>
<symbol id="adv-i-snow" viewBox="0 0 48 48"><path ${L} d="M24 6v36M8.4 15l31.2 18M8.4 33l31.2-18M19 9l5 5 5-5M19 39l5-5 5 5M8 21l7-2-2-7M40 27l-7 2 2 7M8 27l7 2-2 7M40 21l-7-2 2-7"/></symbol>
<symbol id="adv-i-bell" viewBox="0 0 48 48"><path ${L} d="M13 34c1-3 3-5 3-12a8 8 0 0116 0c0 7 2 9 3 12zM24 10V7"/><circle class="acc" fill="currentColor" cx="24" cy="38" r="3.4"/></symbol>
<symbol id="adv-i-ornament" viewBox="0 0 48 48"><g ${L}><circle cx="24" cy="29" r="12"/><path d="M21 13h6v4h-6zM24 13c0-4 4-4 4-7"/></g><path class="acc" ${L} d="M13 27c4 3 7-3 11 0s7-3 11 0"/></symbol>
<symbol id="adv-i-candy" viewBox="0 0 48 48"><path fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" d="M28 42V17a6 6 0 00-12 0v3"/><path class="acc" fill="none" stroke="currentColor" stroke-width="2.6" stroke-dasharray="3 5" d="M28 42V17a6 6 0 00-12 0v3"/></symbol>
<symbol id="adv-i-ginger" viewBox="0 0 48 48"><path ${L} d="M24 7a5.5 5.5 0 015.5 5.5c0 2-1 3.4-2 4.5h3.5l7 5-2.5 3.5-6-3v6l5 10-4 2-6.5-8.5L17.5 40.5l-4-2 5-10v-6l-6 3L10 22l7-5h3.5c-1-1.1-2-2.5-2-4.5A5.5 5.5 0 0124 7z"/><g class="acc" fill="currentColor"><circle cx="24" cy="23" r="1.6"/><circle cx="24" cy="28" r="1.6"/></g></symbol>
<symbol id="adv-i-stock" viewBox="0 0 48 48"><path ${L} d="M17 6h13v20l6 6a5 5 0 01-7 7L17 29z"/><path class="acc" fill="currentColor" d="M16 6h15v6H16z"/></symbol>
<symbol id="adv-i-mitten" viewBox="0 0 48 48"><path ${L} d="M15 36V19a8 8 0 0116 0v6l4-4a3 3 0 014.2 4.2L31 34v2z"/><path class="acc" fill="currentColor" d="M14 36h18v6H14z"/></symbol>
<symbol id="adv-i-holly" viewBox="0 0 48 48"><path ${L} d="M22 26c-5-1-11 0-15 6 3 0 4 3 7 3 0-3 3-3 3-6 2 0 3-2 5-3zM26 26c5-1 11 0 15 6-3 0-4 3-7 3 0-3-3-3-3-6-2 0-3-2-5-3z"/><g class="acc" fill="currentColor"><circle cx="20" cy="20" r="3.2"/><circle cx="28" cy="20" r="3.2"/><circle cx="24" cy="14" r="3.2"/></g></symbol>
<symbol id="adv-i-candle" viewBox="0 0 48 48"><path ${L} d="M18 22h12v18H18zM12 40h24M24 22v-3"/><path class="acc" fill="currentColor" d="M24 6c3.5 4.5 3.5 8 0 11-3.5-3-3.5-6.5 0-11z"/></symbol>
<symbol id="adv-i-giftbox" viewBox="0 0 48 48"><path ${L} d="M11 21h26v19H11zM9 15h30v6H9zM24 15v25"/><path class="acc" ${L} d="M24 15c-2-6-10-7-9-2 .5 2 5 2 9 2zM24 15c2-6 10-7 9-2-.5 2-5 2-9 2z"/></symbol>
<symbol id="adv-i-snowman" viewBox="0 0 48 48"><g fill="none" stroke="currentColor" stroke-width="2.4"><circle cx="24" cy="31" r="10"/><circle cx="24" cy="14" r="6.5"/></g><g class="acc" fill="currentColor"><circle cx="24" cy="28" r="1.6"/><circle cx="24" cy="33" r="1.6"/><path d="M24 14.5l6 1.5-6 1z"/></g></symbol>
<symbol id="adv-i-moon" viewBox="0 0 48 48"><path ${L} d="M28 8a15 15 0 1012 25A13 13 0 0128 8z"/><path class="acc" fill="currentColor" d="M37 8l1.2 2.8 2.8 1.2-2.8 1.2L37 16l-1.2-2.8L33 12l2.8-1.2z"/></symbol>
<symbol id="adv-i-cocoa" viewBox="0 0 48 48"><path ${L} d="M11 20h21v11a8 8 0 01-8 8h-5a8 8 0 01-8-8zM32 23h3a4 4 0 010 8h-3"/><path class="acc" ${L} d="M17 8c-2 3 2 5 0 8M24 8c-2 3 2 5 0 8"/></symbol>
<symbol id="adv-i-wreath" viewBox="0 0 48 48"><circle fill="none" stroke="currentColor" stroke-width="6" stroke-dasharray="4 2.3" cx="24" cy="23" r="12"/><path class="acc" fill="currentColor" d="M24 35l-7 6 1-7zM24 35l7 6-1-7z"/><circle class="acc" fill="currentColor" cx="24" cy="35" r="2.6"/></symbol>
<symbol id="adv-i-clock" viewBox="0 0 48 48"><g ${L}><circle cx="24" cy="25" r="15"/><path d="M24 25V14M24 25l-2-8"/></g><g class="acc" fill="currentColor"><circle cx="24" cy="25" r="2.2"/><path d="M18 5h12v4H18z"/></g></symbol>
<symbol id="adv-i-cheers" viewBox="0 0 48 48"><path ${L} d="M10 10l9 3-3 11a4 4 0 01-5-1.5zM15.5 24l-3 12M9 35l7 2M38 10l-9 3 3 11a4 4 0 005-1.5zM32.5 24l3 12M39 35l-7 2"/><g class="acc" fill="currentColor"><circle cx="24" cy="8" r="1.8"/><circle cx="20" cy="4" r="1.4"/><circle cx="28" cy="4" r="1.4"/></g></symbol>
<symbol id="adv-i-fire" viewBox="0 0 48 48"><path ${L} d="M24 22V8M24 22l10-10M24 22h14M24 22l10 10M24 22l-10 10M24 22H10M24 22L14 12M24 42V30"/><g class="acc" fill="currentColor"><circle cx="24" cy="6" r="2"/><circle cx="36" cy="10" r="2"/><circle cx="12" cy="10" r="2"/><circle cx="40" cy="22" r="2"/><circle cx="8" cy="22" r="2"/></g></symbol>
<symbol id="adv-i-house" viewBox="0 0 48 48"><path ${L} d="M8 24L24 11l16 13M13 21v18h22V21M21 39v-8h6v8"/><path class="acc" fill="currentColor" d="M24 11l16 13-3 1-13-10.5L11 25l-3-1z"/></symbol>
<symbol id="adv-i-sled" viewBox="0 0 48 48"><path ${L} d="M6 36h32a4 4 0 004-4M14 30v6M32 30v6M14 24c0-5 3-8 6-8"/><path class="acc" fill="currentColor" d="M10 24h28v6H10z"/></symbol>
<symbol id="adv-g-gift" viewBox="0 0 64 64"><path fill="#a3172b" d="M10 26h44v30H10z"/><path fill="#d7263d" d="M7 18h50v10H7z"/><path fill="#d1aa55" d="M28 18h8v38h-8z"/><path fill="#e3b94f" d="M32 18c-4-10-16-12-15-4 1 4 9 4 15 4zM32 18c4-10 16-12 15-4-1 4-9 4-15 4z"/><circle fill="#b8862f" cx="32" cy="18" r="3.5"/></symbol>
<symbol id="adv-lock" viewBox="0 0 48 48"><path fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" d="M16 22v-6a8 8 0 0116 0v6"/><rect x="11" y="21" width="26" height="20" rx="4" fill="currentColor"/><circle cx="24" cy="30" r="3" fill="#2a0c12"/><path stroke="#2a0c12" stroke-width="2.6" stroke-linecap="round" d="M24 31v4"/></symbol>
`;

// src/lib/sanitize.js
import sanitizeHtml from "sanitize-html";
import { sanitizeLink } from "@/lib/validate";

const ALLOWED_TAGS = [
  // tekst
  "p", "br", "b", "i", "em", "strong", "u", "s", "span",
  // naslovi
  "h1", "h2", "h3", "h4",
  // liste
  "ul", "ol", "li",
  // linkovi i slike
  "a", "img",
  // layout
  "div",
];

const ALLOWED_ATTRIBUTES = {
  a: ["href", "target", "rel"],
  img: ["src", "alt", "width", "height", "style"],
  div: ["style"],
  span: ["style", "data-fs", "data-color"],
  p: ["style"],
  h1: ["style"],
  h2: ["style"],
  h3: ["style"],
  h4: ["style"],
  li: ["style"],
};

export function sanitizeRichHtml(html) {
  if (!html || typeof html !== "string") return null;

  const clean = sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: ALLOWED_ATTRIBUTES,
    // force rel="noopener noreferrer" na sve linkove
    transformTags: {
      a: (tagName, attribs) => ({
        tagName,
        attribs: {
          ...attribs,
          rel: "noopener noreferrer",
          target: attribs.target || "_blank",
        },
      }),
    },
  });

  return clean || null;
}

// Sanitizuje richHtml i link u svakom jeziku unutar translations objekta
export function sanitizeTranslations(translations) {
  if (!translations || typeof translations !== "object") return null;
  const result = {};
  for (const [lang, t] of Object.entries(translations)) {
    if (!t || typeof t !== "object") continue;
    result[lang] = {
      ...t,
      richHtml: sanitizeRichHtml(t.richHtml ?? null),
      link: sanitizeLink(t.link ?? ""),
    };
  }
  return Object.keys(result).length ? result : null;
}

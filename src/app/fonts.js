// src/app/fonts.js
import { Rowdies, Russo_One, Bodoni_Moda, Jost } from "next/font/google";

export const rowdies = Rowdies({
  subsets: ["latin"],
  weight: "700",
  variable: "--font-rowdies", // slot mašina (lib/slot/slotReveal.css) ga koristi preko CSS promjenljive
});

export const russoOne = Russo_One({
  subsets: ["latin"],
  weight: "400",
});

// Novogodišnja (advent) tema
export const adventDisplay = Bodoni_Moda({
  subsets: ["latin", "latin-ext"],
  weight: ["500", "700"],
  variable: "--font-advent-display",
});

export const adventBody = Jost({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
  variable: "--font-advent-body",
});

import { describe, it, expect } from "vitest";

/**
 * WCAG AA Contrast Calculation Tests for Panenka Theme Tokens.
 *
 * Requirements:
 * - Normal text (body): contrast ratio >= 4.5:1
 * - Large text & UI components (borders, badges): contrast ratio >= 3.0:1
 */

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
}

function getLuminance(r: number, g: number, b: number): number {
  const norm = [r, g, b].map((c) => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  const rs = norm[0] ?? 0;
  const gs = norm[1] ?? 0;
  const bs = norm[2] ?? 0;
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function getContrastRatio(rgb1: [number, number, number], rgb2: [number, number, number]): number {
  const lum1 = getLuminance(...rgb1);
  const lum2 = getLuminance(...rgb2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

// Exact Theme Tokens from globals.css
const THEMES = {
  touchline: {
    background: hslToRgb(222, 47, 8),
    foreground: hslToRgb(60, 9, 93),
    primary: hslToRgb(78, 100, 50),
    primaryForeground: hslToRgb(222, 47, 8),
    card: hslToRgb(222, 40, 11),
    cardForeground: hslToRgb(60, 9, 93),
    muted: hslToRgb(222, 30, 16),
    mutedForeground: hslToRgb(222, 15, 65),
  },
  matchday: {
    background: hslToRgb(40, 33, 95),
    foreground: hslToRgb(150, 30, 10),
    primary: hslToRgb(150, 50, 25),
    primaryForeground: hslToRgb(40, 33, 95),
    card: hslToRgb(40, 30, 98),
    cardForeground: hslToRgb(150, 30, 10),
    muted: hslToRgb(40, 15, 88),
    mutedForeground: hslToRgb(150, 20, 35),
  },
  champions: {
    background: hslToRgb(0, 0, 5),
    foreground: hslToRgb(45, 20, 90),
    primary: hslToRgb(45, 80, 50),
    primaryForeground: hslToRgb(0, 0, 5),
    card: hslToRgb(0, 0, 9),
    cardForeground: hslToRgb(45, 20, 90),
    muted: hslToRgb(0, 0, 14),
    mutedForeground: hslToRgb(0, 0, 65),
  },
};

describe("WCAG AA Theme Contrast Verification", () => {
  for (const [themeName, tokens] of Object.entries(THEMES)) {
    describe(`Theme: ${themeName}`, () => {
      it("meets WCAG AA (>= 4.5:1) for body text on background", () => {
        const ratio = getContrastRatio(tokens.foreground, tokens.background);
        expect(ratio).toBeGreaterThanOrEqual(4.5);
      });

      it("meets WCAG AA (>= 4.5:1) for card text on card surface", () => {
        const ratio = getContrastRatio(tokens.cardForeground, tokens.card);
        expect(ratio).toBeGreaterThanOrEqual(4.5);
      });

      it("meets WCAG AA (>= 4.5:1) for primary button text on primary background", () => {
        const ratio = getContrastRatio(tokens.primaryForeground, tokens.primary);
        expect(ratio).toBeGreaterThanOrEqual(4.5);
      });

      it("meets UI component contrast (>= 3.0:1) for primary accents on background", () => {
        const ratio = getContrastRatio(tokens.primary, tokens.background);
        expect(ratio).toBeGreaterThanOrEqual(3.0);
      });
    });
  }
});

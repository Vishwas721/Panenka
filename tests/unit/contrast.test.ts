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
  floodlight: {
    background: hslToRgb(252, 24, 5),
    foreground: hslToRgb(40, 33, 92),
    primary: hslToRgb(12, 100, 61),
    primaryForeground: hslToRgb(252, 30, 6),
    card: hslToRgb(251, 20, 8),
    cardForeground: hslToRgb(40, 33, 92),
    muted: hslToRgb(250, 16, 13),
    mutedForeground: hslToRgb(248, 10, 64),
  },
  programme: {
    background: hslToRgb(40, 38, 93),
    foreground: hslToRgb(252, 30, 9),
    primary: hslToRgb(11, 88, 42),
    primaryForeground: hslToRgb(42, 45, 97),
    card: hslToRgb(42, 45, 96.5),
    cardForeground: hslToRgb(252, 30, 9),
    muted: hslToRgb(40, 26, 87),
    mutedForeground: hslToRgb(250, 10, 36),
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

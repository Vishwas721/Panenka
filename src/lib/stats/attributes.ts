/**
 * Card attributes, overall rating (OVR), card tier and archetype.
 *
 * Six attributes on a 1–99 scale, each derived from match data:
 *   FIN  Finishing    goals per appearance
 *   CRE  Creativity   assists per appearance
 *   IMP  Impact       man-of-the-match rate blended with G+A rate
 *   CON  Consistency  share of 7+ ratings and rating spread
 *   FRM  Form         last-5 rating and recent output
 *   CLU  Clutch       rating and output in one-goal games
 *
 * Small samples are shrunk toward 50 so one great match cannot produce a 99.
 */
import type { PlayerProfile } from "./profile";
import { mean } from "./profile";

export type AttributeKey = "FIN" | "CRE" | "IMP" | "CON" | "FRM" | "CLU";
export type Attributes = Record<AttributeKey, number>;

export const ATTRIBUTE_META: Record<AttributeKey, { name: string; blurb: string }> = {
  FIN: { name: "Finishing", blurb: "Goals per appearance" },
  CRE: { name: "Creativity", blurb: "Assists per appearance" },
  IMP: { name: "Impact", blurb: "Man of the Match rate and G+A output" },
  CON: { name: "Consistency", blurb: "How often they hit 7+ and how tight the ratings are" },
  FRM: { name: "Form", blurb: "Last five ratings and recent output" },
  CLU: { name: "Clutch", blurb: "Rating and output in one-goal games" },
};

export const ATTRIBUTE_KEYS: AttributeKey[] = ["FIN", "CRE", "IMP", "CON", "FRM", "CLU"];

export type PositionGroup = "ATT" | "MID" | "DEF" | "GK" | "ANY";

export function positionGroup(position: string): PositionGroup {
  if (["ST", "LW", "RW"].includes(position)) return "ATT";
  if (["CAM", "CM", "CDM"].includes(position)) return "MID";
  if (["CB", "LB", "RB"].includes(position)) return "DEF";
  if (position === "GK") return "GK";
  return "ANY";
}

const clamp = (n: number, lo = 1, hi = 99) => Math.max(lo, Math.min(hi, n));
const curve = (x: number, k: number) => 1 - Math.exp(-Math.max(0, x) * k);

/** Piecewise-linear map from a 1–10 match rating to a 1–99 card score. */
export function ratingToScore(r: number): number {
  const pts: [number, number][] = [
    [1, 5],
    [3, 20],
    [5, 38],
    [6, 52],
    [7, 68],
    [8, 81],
    [9, 92],
    [10, 99],
  ];
  if (r <= pts[0]![0]) return pts[0]![1];
  for (let i = 1; i < pts.length; i++) {
    const [x1, y1] = pts[i]!;
    const [x0, y0] = pts[i - 1]!;
    if (r <= x1) return y0 + ((r - x0) / (x1 - x0)) * (y1 - y0);
  }
  return 99;
}

const shrink = (raw: number, n: number, k = 4) => 50 + (raw - 50) * (n / (n + k));

export function computeAttributes(p: PlayerProfile): Attributes | null {
  if (p.apps === 0) return null;
  const n = p.apps;
  const gpa = p.goals / n;
  const apa = p.assists / n;
  const gapa = p.ga / n;
  const motmRate = p.motm / n;

  const FIN = 28 + 71 * curve(gpa, 1.7);
  const CRE = 28 + 71 * curve(apa, 2.3);
  const IMP = 0.6 * (22 + 77 * curve(motmRate, 4)) + 0.4 * (25 + 74 * curve(gapa, 1.2));

  let CON: number;
  if (p.rating.rated >= 2 && p.rating.sevenPlusPct !== null) {
    const spread = p.rating.stdDev ?? 1;
    CON = 30 + 69 * (0.65 * p.rating.sevenPlusPct + 0.35 * Math.max(0, 1 - spread / 2));
  } else {
    CON = 30 + 60 * (p.hauls.contributedIn / n);
  }

  const recent = p.form.slice(0, 5);
  const recentGA = recent.length ? recent.reduce((a, t) => a + t.goals + t.assists, 0) / recent.length : 0;
  const FRM =
    p.rating.last5 !== null
      ? ratingToScore(p.rating.last5) + Math.min(8, recentGA * 6) - 2
      : 30 + 69 * curve(recentGA, 1.3);

  const close = p.timeline.filter(
    (t) => t.result !== null && Math.abs((t.goalsFor ?? 0) - (t.goalsAgainst ?? 0)) <= 1,
  );
  let CLU: number;
  if (close.length > 0) {
    const r = mean(close.filter((t) => t.rating !== null).map((t) => t.rating as number));
    const out = close.reduce((a, t) => a + t.goals + t.assists, 0) / close.length;
    CLU = (r !== null ? 0.6 * ratingToScore(r) : 0.6 * 55) + 0.4 * (25 + 74 * curve(out, 1.4));
  } else {
    CLU = 0.5 * FIN + 0.5 * IMP;
  }

  const shrunk = (x: number) => Math.round(clamp(shrink(x, n)));
  return {
    FIN: shrunk(FIN),
    CRE: shrunk(CRE),
    IMP: shrunk(IMP),
    CON: shrunk(CON),
    FRM: Math.round(clamp(shrink(FRM, Math.min(n, 5), 2))),
    CLU: Math.round(clamp(shrink(CLU, close.length || 1))),
  };
}

const WEIGHTS: Record<PositionGroup, Record<AttributeKey | "RAT", number>> = {
  ATT: { RAT: 0.38, FIN: 0.22, CRE: 0.1, IMP: 0.12, CON: 0.08, FRM: 0.05, CLU: 0.05 },
  MID: { RAT: 0.38, FIN: 0.1, CRE: 0.2, IMP: 0.12, CON: 0.1, FRM: 0.05, CLU: 0.05 },
  DEF: { RAT: 0.52, FIN: 0.04, CRE: 0.07, IMP: 0.14, CON: 0.15, FRM: 0.04, CLU: 0.04 },
  GK: { RAT: 0.6, FIN: 0.0, CRE: 0.02, IMP: 0.16, CON: 0.16, FRM: 0.03, CLU: 0.03 },
  ANY: { RAT: 0.42, FIN: 0.14, CRE: 0.14, IMP: 0.12, CON: 0.1, FRM: 0.04, CLU: 0.04 },
};

export function computeOverall(p: PlayerProfile, attrs: Attributes | null, position: string): number | null {
  if (!attrs) return null;
  const w = WEIGHTS[positionGroup(position)];
  let total = 0;
  let weight = 0;
  if (p.rating.avg !== null) {
    total += w.RAT * shrink(ratingToScore(p.rating.avg), p.rating.rated, 3);
    weight += w.RAT;
  }
  for (const k of ATTRIBUTE_KEYS) {
    total += w[k] * attrs[k];
    weight += w[k];
  }
  return Math.round(clamp(total / weight));
}

export interface CardTier {
  id: "grassroots" | "academy" | "firstteam" | "elite" | "worldclass" | "panenka";
  name: string;
  min: number;
}

export const CARD_TIERS: CardTier[] = [
  { id: "panenka", name: "Panenka", min: 90 },
  { id: "worldclass", name: "World Class", min: 84 },
  { id: "elite", name: "Elite", min: 77 },
  { id: "firstteam", name: "First Team", min: 69 },
  { id: "academy", name: "Academy", min: 60 },
  { id: "grassroots", name: "Grassroots", min: 0 },
];

export function cardTier(ovr: number | null): CardTier {
  if (ovr === null) return CARD_TIERS[CARD_TIERS.length - 1]!;
  return CARD_TIERS.find((t) => ovr >= t.min)!;
}

const PAIR_ARCHETYPES: Record<string, { name: string; line: string }> = {
  "FIN+CRE": { name: "Complete Forward", line: "Scores them, makes them, does both on the same afternoon." },
  "FIN+IMP": { name: "Talisman", line: "When the team needs a goal, the ball finds them." },
  "FIN+CON": { name: "Clinical Machine", line: "Week in, week out, the chances go in." },
  "FIN+FRM": { name: "Hot-Streak Hitman", line: "Riding a wave of goals right now." },
  "FIN+CLU": { name: "Big-Game Assassin", line: "Saves the goals for the tight ones." },
  "CRE+IMP": { name: "Conductor", line: "Sets the tempo and takes the plaudits." },
  "CRE+CON": { name: "Metronome Maestro", line: "Reliable supply line, match after match." },
  "CRE+FRM": { name: "Creative Spark", line: "The final ball has never looked sharper." },
  "CRE+CLU": { name: "Decisive Architect", line: "Designs the winner when it matters." },
  "IMP+CON": { name: "Lighthouse", line: "The steady light everyone plays off." },
  "IMP+FRM": { name: "Man of the Moment", line: "Collecting awards faster than anyone." },
  "IMP+CLU": { name: "Hero Ball", line: "Lives for the moments that decide matches." },
  "CON+FRM": { name: "Steady Climber", line: "Consistent and still trending up." },
  "CON+CLU": { name: "Ice Veins", line: "Never rattled, never below par." },
  "FRM+CLU": { name: "Rising Closer", line: "Peaking at exactly the right time." },
};

export function archetype(attrs: Attributes | null): { name: string; line: string; keys: [AttributeKey, AttributeKey] } | null {
  if (!attrs) return null;
  const order = ATTRIBUTE_KEYS.slice().sort((a, b) => attrs[b] - attrs[a] || ATTRIBUTE_KEYS.indexOf(a) - ATTRIBUTE_KEYS.indexOf(b));
  const [a, b] = [order[0]!, order[1]!];
  const key = ATTRIBUTE_KEYS.indexOf(a) < ATTRIBUTE_KEYS.indexOf(b) ? `${a}+${b}` : `${b}+${a}`;
  const found = PAIR_ARCHETYPES[key]!;
  return { ...found, keys: [a, b] };
}

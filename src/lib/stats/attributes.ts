/**
 * Card attributes, overall rating (OVR), card tier and archetype.
 *
 * Seven attributes on a 1–99 scale, each derived from match data:
 *   FIN  Finishing    goals per appearance
 *   CRE  Creativity   assists per appearance
 *   DEF  Defending    clean sheets, goals conceded and rating while on the pitch
 *   IMP  Impact       man-of-the-match rate blended with role-adjusted output
 *   CON  Consistency  share of good ratings and rating spread
 *   FRM  Form         last-5 rating and recent role-adjusted output
 *   CLU  Clutch       rating and role-adjusted output in one-goal games
 *
 * Fairness rules:
 *   - Output (goals + assists) is judged against what is normal for the
 *     position, so one assist from a centre-back counts like several from a striker.
 *   - Each card shows the six attributes that matter for the role: defensive
 *     roles show DEF instead of FIN.
 *   - OVR weights are set per position, and defensive roles lean on rating,
 *     consistency and DEF rather than goals.
 *
 * Small samples are shrunk toward 50 so one great match cannot produce a 99.
 */
import type { PlayerProfile } from "./profile";
import { mean } from "./profile";

export type AttributeKey = "FIN" | "CRE" | "DEF" | "IMP" | "CON" | "FRM" | "CLU";
export type Attributes = Record<AttributeKey, number>;

export const ATTRIBUTE_META: Record<AttributeKey, { name: string; blurb: string }> = {
  FIN: { name: "Finishing", blurb: "Goals per appearance" },
  CRE: { name: "Creativity", blurb: "Assists per appearance" },
  DEF: { name: "Defending", blurb: "Clean sheets, goals conceded and rating while on the pitch" },
  IMP: { name: "Impact", blurb: "Man of the Match rate and output measured against the role" },
  CON: { name: "Consistency", blurb: "How often they play well and how tight the ratings are" },
  FRM: { name: "Form", blurb: "Last five ratings and recent output for the role" },
  CLU: { name: "Clutch", blurb: "Rating and output in one-goal games" },
};

/** Every attribute, in display order. */
export const ALL_ATTRIBUTE_KEYS: AttributeKey[] = ["FIN", "CRE", "DEF", "IMP", "CON", "FRM", "CLU"];
/** The attacking card layout (kept for callers that need a fixed six). */
export const ATTRIBUTE_KEYS: AttributeKey[] = ["FIN", "CRE", "IMP", "CON", "FRM", "CLU"];
const DEFENSIVE_CARD_KEYS: AttributeKey[] = ["DEF", "CRE", "IMP", "CON", "FRM", "CLU"];

export type PositionGroup = "ATT" | "MID" | "DEF" | "GK" | "ANY";

export function positionGroup(position: string): PositionGroup {
  if (["ST", "LW", "RW"].includes(position)) return "ATT";
  if (["CAM", "CM", "CDM"].includes(position)) return "MID";
  if (["CB", "LB", "RB"].includes(position)) return "DEF";
  if (position === "GK") return "GK";
  return "ANY";
}

const DEFENSIVE_ROLES = new Set(["GK", "CB", "LB", "RB", "CDM"]);

/** The six attributes printed on a player's card for their position. */
export function cardKeys(position: string): AttributeKey[] {
  return DEFENSIVE_ROLES.has(position) ? DEFENSIVE_CARD_KEYS : ATTRIBUTE_KEYS;
}

/**
 * Typical goals and assists per appearance for each position. Output is scored
 * relative to these, so every role is measured against its own job.
 */
export const ROLE_EXPECTATION: Record<string, { goals: number; assists: number }> = {
  ST: { goals: 0.55, assists: 0.2 },
  LW: { goals: 0.35, assists: 0.3 },
  RW: { goals: 0.35, assists: 0.3 },
  CAM: { goals: 0.25, assists: 0.35 },
  CM: { goals: 0.12, assists: 0.2 },
  CDM: { goals: 0.05, assists: 0.1 },
  LB: { goals: 0.05, assists: 0.15 },
  RB: { goals: 0.05, assists: 0.15 },
  CB: { goals: 0.05, assists: 0.03 },
  GK: { goals: 0.0, assists: 0.01 },
  UNKNOWN: { goals: 0.25, assists: 0.2 },
};

const clamp = (n: number, lo = 1, hi = 99) => Math.max(lo, Math.min(hi, n));
const curve = (x: number, k: number) => 1 - Math.exp(-Math.max(0, x) * k);

/**
 * Piecewise-linear map from a 1–10 match rating to a 1–99 card score.
 * 6.0 (an ordinary, job-done game in most rating systems) lands near 58.
 */
export function ratingToScore(r: number): number {
  const pts: [number, number][] = [
    [1, 5],
    [3, 22],
    [5, 42],
    [6, 58],
    [6.5, 64],
    [7, 70],
    [8, 82],
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

/**
 * Score goal involvement against the role's normal rate.
 * Hitting the role's expectation ≈ 70; double it ≈ 88; none ≈ 40 (not 25),
 * because quiet games are normal for many roles.
 */
function roleOutputScore(goals: number, assists: number, games: number, position: string): number {
  if (games === 0) return 50;
  const exp = ROLE_EXPECTATION[position] ?? ROLE_EXPECTATION.UNKNOWN!;
  // A floor on the expectation stops tiny denominators (keepers) from exploding.
  const expected = Math.max(0.08, exp.goals + exp.assists);
  const ratio = (goals + assists) / games / expected;
  return 40 + 59 * curve(ratio, 1.2);
}

const shrink = (raw: number, n: number, k = 4) => 50 + (raw - 50) * (n / (n + k));

function defendingScore(p: PlayerProfile): number {
  const d = p.defence;
  const avg = p.rating.avg;
  const ratingPart = avg !== null ? ratingToScore(avg) : 55;
  if (d.games === 0 || d.concededPerApp === null || d.cleanSheetRate === null) return ratingPart;
  const cleanSheetPart = 35 + 64 * curve(d.cleanSheetRate, 2.5);
  // 0 conceded/game → 99, 1 → ~62, 2 → ~39
  const concededPart = 99 * Math.exp(-0.47 * d.concededPerApp);
  return 0.35 * cleanSheetPart + 0.3 * concededPart + 0.35 * ratingPart;
}

export function computeAttributes(p: PlayerProfile, position = "UNKNOWN"): Attributes | null {
  if (p.apps === 0) return null;
  const n = p.apps;
  const gpa = p.goals / n;
  const apa = p.assists / n;
  const motmRate = p.motm / n;
  const role = roleOutputScore(p.goals, p.assists, n, position);

  const FIN = 28 + 71 * curve(gpa, 1.7);
  const CRE = 28 + 71 * curve(apa, 2.3);
  const DEF = defendingScore(p);
  const IMP = 0.6 * (30 + 69 * curve(motmRate, 4)) + 0.4 * role;

  let CON: number;
  if (p.rating.rated >= 2 && p.rating.avg !== null) {
    // "Playing well" means at least a 6.5 or the player's own average, whichever is lower,
    // so a steady 6.5 defender isn't punished for a scale built around attackers.
    const ratings = p.timeline.filter((t) => t.rating !== null).map((t) => t.rating as number);
    const bar = Math.min(6.5, p.rating.avg);
    const goodShare = ratings.filter((r) => r >= bar).length / ratings.length;
    const spread = p.rating.stdDev ?? 1;
    CON = 30 + 69 * (0.55 * goodShare + 0.45 * Math.max(0, 1 - spread / 2));
  } else {
    CON = 30 + 60 * (p.hauls.contributedIn / n);
  }

  const recent = p.form.slice(0, 5);
  const recentRole = roleOutputScore(
    recent.reduce((a, t) => a + t.goals, 0),
    recent.reduce((a, t) => a + t.assists, 0),
    recent.length,
    position,
  );
  const FRM = p.rating.last5 !== null ? 0.75 * ratingToScore(p.rating.last5) + 0.25 * recentRole : recentRole;

  const close = p.timeline.filter(
    (t) => t.result !== null && Math.abs((t.goalsFor ?? 0) - (t.goalsAgainst ?? 0)) <= 1,
  );
  let CLU: number;
  if (close.length > 0) {
    const r = mean(close.filter((t) => t.rating !== null).map((t) => t.rating as number));
    const out = roleOutputScore(
      close.reduce((a, t) => a + t.goals, 0),
      close.reduce((a, t) => a + t.assists, 0),
      close.length,
      position,
    );
    CLU = (r !== null ? 0.65 * ratingToScore(r) : 0.65 * 55) + 0.35 * out;
  } else {
    CLU = 0.5 * IMP + 0.5 * (p.rating.avg !== null ? ratingToScore(p.rating.avg) : 50);
  }

  const shrunk = (x: number) => Math.round(clamp(shrink(x, n)));
  return {
    FIN: shrunk(FIN),
    CRE: shrunk(CRE),
    DEF: Math.round(clamp(shrink(DEF, p.defence.games || 1))),
    IMP: shrunk(IMP),
    CON: shrunk(CON),
    FRM: Math.round(clamp(shrink(FRM, Math.min(n, 5), 2))),
    CLU: Math.round(clamp(shrink(CLU, close.length || 1))),
  };
}

type Weights = Record<AttributeKey | "RAT", number>;
const w = (RAT: number, FIN: number, CRE: number, DEF: number, IMP: number, CON: number, FRM: number, CLU: number): Weights => ({
  RAT, FIN, CRE, DEF, IMP, CON, FRM, CLU,
});

/** OVR weights per position. Rows sum to 1. */
const WEIGHTS: Record<string, Weights> = {
  //        RAT   FIN   CRE   DEF   IMP   CON   FRM   CLU
  ST:  w(0.40, 0.20, 0.08, 0.00, 0.13, 0.09, 0.05, 0.05),
  LW:  w(0.40, 0.14, 0.14, 0.00, 0.13, 0.09, 0.05, 0.05),
  RW:  w(0.40, 0.14, 0.14, 0.00, 0.13, 0.09, 0.05, 0.05),
  CAM: w(0.42, 0.08, 0.18, 0.00, 0.13, 0.10, 0.05, 0.04),
  CM:  w(0.46, 0.04, 0.12, 0.04, 0.12, 0.13, 0.05, 0.04),
  CDM: w(0.47, 0.00, 0.06, 0.10, 0.12, 0.15, 0.05, 0.05),
  LB:  w(0.47, 0.00, 0.06, 0.12, 0.11, 0.15, 0.05, 0.04),
  RB:  w(0.47, 0.00, 0.06, 0.12, 0.11, 0.15, 0.05, 0.04),
  CB:  w(0.48, 0.00, 0.02, 0.15, 0.11, 0.15, 0.05, 0.04),
  GK:  w(0.50, 0.00, 0.00, 0.16, 0.11, 0.15, 0.04, 0.04),
  UNKNOWN: w(0.44, 0.10, 0.10, 0.04, 0.12, 0.11, 0.05, 0.04),
};

export function computeOverall(p: PlayerProfile, attrs: Attributes | null, position: string): number | null {
  if (!attrs) return null;
  const wt = WEIGHTS[position] ?? WEIGHTS.UNKNOWN!;
  let total = 0;
  let weight = 0;
  if (p.rating.avg !== null) {
    total += wt.RAT * shrink(ratingToScore(p.rating.avg), p.rating.rated, 3);
    weight += wt.RAT;
  }
  for (const k of ALL_ATTRIBUTE_KEYS) {
    total += wt[k] * attrs[k];
    weight += wt[k];
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
  "CRE+DEF": { name: "Ball-Playing Defender", line: "Stops it at one end, starts it at the other." },
  "DEF+IMP": { name: "Defensive Leader", line: "Organises, wins the big moments, takes the award." },
  "DEF+CON": { name: "Brick Wall", line: "Nothing gets through, and it never changes." },
  "DEF+FRM": { name: "Rising Rock", line: "The back line has never looked tighter." },
  "DEF+CLU": { name: "Last Line", line: "At their best when one goal decides it." },
};

export function archetype(
  attrs: Attributes | null,
  position = "UNKNOWN",
): { name: string; line: string; keys: [AttributeKey, AttributeKey] } | null {
  if (!attrs) return null;
  const keys = cardKeys(position);
  const order = keys.slice().sort((a, b) => attrs[b] - attrs[a] || ALL_ATTRIBUTE_KEYS.indexOf(a) - ALL_ATTRIBUTE_KEYS.indexOf(b));
  const [a, b] = [order[0]!, order[1]!];
  const key = ALL_ATTRIBUTE_KEYS.indexOf(a) < ALL_ATTRIBUTE_KEYS.indexOf(b) ? `${a}+${b}` : `${b}+${a}`;
  const found = PAIR_ARCHETYPES[key]!;
  return { ...found, keys: [a, b] };
}

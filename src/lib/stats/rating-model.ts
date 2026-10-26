/**
 * Squad-relative rating model (v3).
 *
 * Method, after the z-score approach used in professional scouting
 * (e.g. SkillCorner) and EA FC's position-weighted overall:
 *
 *  1. Each player gets nine per-game metrics (rating, goals, assists, MOTM,
 *     defending, points per game, consistency, form, clutch).
 *  2. Every metric is shrunk toward its group average by its own sample size
 *     (empirical Bayes), so 4 goals in 4 games isn't treated as proven.
 *  3. Metrics become z-scores *within the player's role group* (attackers vs
 *     attackers, defenders vs defenders), with group averages blended toward a
 *     reference baseline so small groups stay stable.
 *  4. Position weights combine the z-scores into one composite. Centre-backs
 *     and keepers use no goals or assists; CDMs are ~75% defending/rating and
 *     25% output; CMs balance both; attackers lean on goals and assists.
 *  5. Composites are re-standardised across the squad and mapped onto a
 *     FIFA-like scale: squad average ≈ 73, +1 SD ≈ 82, +2.5 SD ≈ 91.
 *
 * Pure: no I/O.
 */
import type { PlayerProfile } from "./profile";
import { mean } from "./profile";
import type { AttributeKey, Attributes } from "./attributes";

export type RoleGroup = "ATT" | "MID" | "DEF" | "GK";

/**
 * Comparison group for a position. CDMs sit with defenders: in eFootball their
 * match ratings run on the defensive scale (6.0 decent, 6.5 very solid, ~7.0 ceiling).
 */
export function roleGroup(position: string): RoleGroup {
  if (["ST", "LW", "RW"].includes(position)) return "ATT";
  if (["CB", "LB", "RB", "CDM"].includes(position)) return "DEF";
  if (position === "GK") return "GK";
  return "MID";
}

/**
 * Natural alternative positions for each card position, like a game card's
 * secondary positions. Players are rated at all of these and their best fit counts.
 * Alternatives never cross from attack into defence, so an attacker's ratings are
 * never judged on the defensive scale (and vice versa).
 */
export const COMPATIBLE_POSITIONS: Record<string, string[]> = {
  ST: ["CAM", "LW", "RW"],
  LW: ["RW", "ST", "CAM"],
  RW: ["LW", "ST", "CAM"],
  CAM: ["CM", "ST", "LW", "RW"],
  CM: ["CAM", "CDM"],
  CDM: ["CM", "CB"],
  CB: ["CDM"],
  LB: ["RB", "CB"],
  RB: ["LB", "CB"],
  GK: [],
  UNKNOWN: ["CM", "CAM", "ST"],
};

/** Card position first, then its natural alternatives, then any the user added. */
export function candidatePositions(position: string, extra: readonly string[] = []): string[] {
  const out = [position, ...(COMPATIBLE_POSITIONS[position] ?? []), ...extra];
  return [...new Set(out)].filter((p) => p in POSITION_WEIGHTS && p !== "UNKNOWN");
}

export type MetricKey = "rating" | "goals" | "assists" | "motm" | "defence" | "ppg" | "consistency" | "form" | "clutch";

export const METRIC_KEYS: MetricKey[] = ["rating", "goals", "assists", "motm", "defence", "ppg", "consistency", "form", "clutch"];

export const METRIC_META: Record<MetricKey, { label: string; side: "output" | "performance" | "defence" }> = {
  rating: { label: "Match rating", side: "performance" },
  goals: { label: "Goals per game", side: "output" },
  assists: { label: "Assists per game", side: "output" },
  motm: { label: "Man of the Match rate", side: "output" },
  defence: { label: "Goals conceded & clean sheets", side: "defence" },
  ppg: { label: "Points per game", side: "defence" },
  consistency: { label: "Consistency", side: "performance" },
  form: { label: "Form (last 5)", side: "performance" },
  clutch: { label: "Big moments (one-goal games)", side: "performance" },
};

/** How strongly each metric is pulled toward the average: "pseudo-games" of average evidence. */
const SHRINK_K: Record<MetricKey, number> = {
  rating: 4, goals: 6, assists: 6, motm: 8, defence: 5, ppg: 6, consistency: 5, form: 2, clutch: 4,
};

interface Stat { mean: number; sd: number }

/**
 * Reference baseline per role group, calibrated to eFootball mobile match ratings:
 * defensive roles average ~5.7 with 6.5 about two SDs above; attackers run higher
 * because goals lift their ratings; 9.0 is effectively the ceiling. Used to
 * stabilise averages when a group has few players, and as the whole model
 * when there is no squad to compare against.
 */
const REFERENCE: Record<RoleGroup, Record<MetricKey, Stat>> = {
  ATT: {
    rating: { mean: 6.1, sd: 0.35 }, goals: { mean: 0.4, sd: 0.22 }, assists: { mean: 0.18, sd: 0.12 },
    motm: { mean: 0.1, sd: 0.08 }, defence: { mean: -1.25, sd: 0.4 }, ppg: { mean: 1.6, sd: 0.35 },
    consistency: { mean: -0.75, sd: 0.2 }, form: { mean: 6.1, sd: 0.45 }, clutch: { mean: 6.1, sd: 0.45 },
  },
  MID: {
    rating: { mean: 5.9, sd: 0.3 }, goals: { mean: 0.1, sd: 0.1 }, assists: { mean: 0.14, sd: 0.1 },
    motm: { mean: 0.04, sd: 0.05 }, defence: { mean: -1.25, sd: 0.4 }, ppg: { mean: 1.6, sd: 0.35 },
    consistency: { mean: -0.6, sd: 0.18 }, form: { mean: 5.9, sd: 0.4 }, clutch: { mean: 5.9, sd: 0.4 },
  },
  DEF: {
    rating: { mean: 5.7, sd: 0.3 }, goals: { mean: 0.02, sd: 0.04 }, assists: { mean: 0.04, sd: 0.05 },
    motm: { mean: 0.02, sd: 0.04 }, defence: { mean: -1.25, sd: 0.4 }, ppg: { mean: 1.6, sd: 0.35 },
    consistency: { mean: -0.55, sd: 0.18 }, form: { mean: 5.7, sd: 0.4 }, clutch: { mean: 5.7, sd: 0.4 },
  },
  GK: {
    rating: { mean: 5.7, sd: 0.3 }, goals: { mean: 0, sd: 0.02 }, assists: { mean: 0, sd: 0.02 },
    motm: { mean: 0.02, sd: 0.04 }, defence: { mean: -1.25, sd: 0.4 }, ppg: { mean: 1.6, sd: 0.35 },
    consistency: { mean: -0.5, sd: 0.18 }, form: { mean: 5.7, sd: 0.4 }, clutch: { mean: 5.7, sd: 0.4 },
  },
};

type W = Record<MetricKey, number>;
const wts = (rating: number, goals: number, assists: number, motm: number, defence: number, ppg: number, consistency: number, form: number, clutch: number): W => ({
  rating, goals, assists, motm, defence, ppg, consistency, form, clutch,
});

/** OVR recipe per position. Each row sums to 1. */
export const POSITION_WEIGHTS: Record<string, W> = {
  //          rating goals assists motm  defence ppg   consis form  clutch
  ST:  wts(0.30, 0.30, 0.07, 0.13, 0.00, 0.04, 0.05, 0.07, 0.04),
  LW:  wts(0.30, 0.19, 0.17, 0.13, 0.00, 0.04, 0.05, 0.07, 0.05),
  RW:  wts(0.30, 0.19, 0.17, 0.13, 0.00, 0.04, 0.05, 0.07, 0.05),
  CAM: wts(0.30, 0.14, 0.22, 0.12, 0.00, 0.05, 0.05, 0.07, 0.05),
  CM:  wts(0.28, 0.12, 0.15, 0.10, 0.08, 0.07, 0.07, 0.08, 0.05),
  CDM: wts(0.30, 0.05, 0.09, 0.11, 0.18, 0.10, 0.08, 0.05, 0.04),
  LB:  wts(0.33, 0.02, 0.07, 0.06, 0.25, 0.10, 0.08, 0.05, 0.04),
  RB:  wts(0.33, 0.02, 0.07, 0.06, 0.25, 0.10, 0.08, 0.05, 0.04),
  CB:  wts(0.35, 0.00, 0.00, 0.05, 0.30, 0.10, 0.10, 0.05, 0.05),
  GK:  wts(0.35, 0.00, 0.00, 0.05, 0.33, 0.10, 0.09, 0.04, 0.04),
  UNKNOWN: wts(0.28, 0.12, 0.15, 0.10, 0.08, 0.07, 0.07, 0.08, 0.05),
};

interface Raw { n: number; v: number | null }

/** Per-game metric values and how many games each is based on. */
export function rawMetrics(p: PlayerProfile): Record<MetricKey, Raw> {
  const close = p.timeline.filter((t) => t.result !== null && Math.abs((t.goalsFor ?? 0) - (t.goalsAgainst ?? 0)) <= 1);
  const closeRated = close.filter((t) => t.rating !== null);
  const closeAvg = mean(closeRated.map((t) => t.rating as number));
  const closeGA = close.length ? close.reduce((a, t) => a + t.goals + t.assists, 0) / close.length : 0;
  const d = p.defence;
  return {
    rating: { n: p.rating.rated, v: p.rating.avg },
    goals: { n: p.apps, v: p.apps ? p.goals / p.apps : null },
    assists: { n: p.apps, v: p.apps ? p.assists / p.apps : null },
    motm: { n: p.apps, v: p.apps ? p.motm / p.apps : null },
    // Clean sheets help, goals conceded hurt; only games started or 60+ minutes count.
    defence: { n: d.games, v: d.games && d.concededPerApp !== null && d.cleanSheetRate !== null ? 1.5 * d.cleanSheetRate - d.concededPerApp : null },
    ppg: { n: p.record.known, v: p.record.ppg },
    consistency: { n: p.rating.rated, v: p.rating.rated >= 2 && p.rating.stdDev !== null ? -p.rating.stdDev : null },
    form: { n: Math.min(5, p.rating.rated), v: p.rating.last5 },
    clutch: { n: closeRated.length, v: closeAvg === null ? null : closeAvg + 0.3 * closeGA },
  };
}

export interface ModelMember {
  id: string;
  position: string;
  profile: PlayerProfile;
  /** Extra positions the player is used in (on top of the natural alternatives). */
  altPositions?: readonly string[];
}

export interface RatingModel {
  groups: Record<RoleGroup, Record<MetricKey, Stat>>;
  /** Re-standardisation of composites across the squad. */
  composite: Stat;
  attributes: Record<string, Stat>;
  squadSize: number;
}

const ELIGIBLE_APPS = 3;
const GROUP_PRIOR = 6; // pseudo-players of reference baseline mixed into each group

function blendStat(values: number[], ref: Stat): Stat {
  const n = values.length;
  if (n === 0) return ref;
  const m = values.reduce((a, b) => a + b, 0) / n;
  const sd = n > 1 ? Math.sqrt(values.reduce((a, x) => a + (x - m) ** 2, 0) / (n - 1)) : ref.sd;
  const wObs = n / (n + GROUP_PRIOR);
  return { mean: wObs * m + (1 - wObs) * ref.mean, sd: Math.max(ref.sd * 0.5, wObs * sd + (1 - wObs) * ref.sd) };
}

function zFor(raw: Raw, stat: Stat, k: number): number {
  if (raw.v === null || raw.n === 0) return 0;
  const shrunk = (raw.n * raw.v + k * stat.mean) / (raw.n + k);
  return Math.max(-3.5, Math.min(3.5, (shrunk - stat.mean) / stat.sd));
}

export interface ComponentZ {
  metric: MetricKey;
  label: string;
  weight: number;
  z: number;
  value: number | null;
  games: number;
}

/**
 * `position` picks the recipe (weights); `peerPosition` picks who the numbers are
 * compared against. They differ when rating a player at an alternative position:
 * the recipe changes, but the comparison stays with the peers whose rating scale
 * produced the numbers, so re-labelling a player can't game a lower baseline.
 */
function components(model: Pick<RatingModel, "groups">, p: PlayerProfile, position: string, peerPosition = position): ComponentZ[] {
  const g = model.groups[roleGroup(peerPosition)];
  const raw = rawMetrics(p);
  const w = POSITION_WEIGHTS[position] ?? POSITION_WEIGHTS.UNKNOWN!;
  return METRIC_KEYS.map((m) => ({
    metric: m,
    label: METRIC_META[m].label,
    weight: w[m],
    z: zFor(raw[m], g[m], SHRINK_K[m]),
    value: raw[m].v,
    games: raw[m].n,
  }));
}

/** Unit-variance composite of the weighted z-scores, pulled toward "unproven" for tiny samples. */
function compositeOf(comps: ComponentZ[], apps: number): number {
  const num = comps.reduce((a, c) => a + c.weight * c.z, 0);
  const den = Math.sqrt(comps.reduce((a, c) => a + c.weight ** 2, 0)) || 1;
  // Half-trust at 8 games: a hot streak has to be sustained to reach the top.
  const reliability = apps / (apps + 8);
  return reliability * (num / den) + (1 - reliability) * -0.6;
}

// ----- card attributes -----

function rawAttributes(model: Pick<RatingModel, "groups">, p: PlayerProfile, peerPosition: string): Record<AttributeKey, number> {
  const position = peerPosition;
  const raw = rawMetrics(p);
  const own = model.groups[roleGroup(position)];
  // Defending is measured squad-wide; the rest compare a player with their role group.
  // FIN and CRE use an absolute curve in ratePlayer.
  const pooled = (m: MetricKey) => {
    const gs = Object.values(model.groups);
    const meanAll = gs.reduce((a, s) => a + s[m].mean, 0) / gs.length;
    const sdAll = Math.sqrt(gs.reduce((a, s) => a + s[m].sd ** 2 + (s[m].mean - meanAll) ** 2, 0) / gs.length);
    return { mean: meanAll, sd: sdAll };
  };
  const z = (m: MetricKey, stat: Stat) => zFor(raw[m], stat, SHRINK_K[m]);
  return {
    FIN: 0,
    CRE: 0,
    DEF: 0.75 * z("defence", pooled("defence")) + 0.25 * z("rating", own.rating),
    IMP: 0.55 * z("motm", own.motm) + 0.45 * z("rating", own.rating),
    CON: 0.6 * z("consistency", own.consistency) + 0.4 * z("rating", own.rating),
    FRM: z("form", own.form),
    CLU: z("clutch", own.clutch),
  };
}

const ATTR_KEYS: AttributeKey[] = ["DEF", "IMP", "CON", "FRM", "CLU"];

export function buildRatingModel(members: ModelMember[]): RatingModel {
  const eligible = members.filter((m) => m.profile.apps >= ELIGIBLE_APPS);
  const groups = {} as RatingModel["groups"];
  for (const g of ["ATT", "MID", "DEF", "GK"] as RoleGroup[]) {
    const inGroup = eligible.filter((m) => roleGroup(m.position) === g);
    groups[g] = {} as Record<MetricKey, Stat>;
    for (const k of METRIC_KEYS) {
      const vals = inGroup
        .map((m) => rawMetrics(m.profile)[k])
        .filter((r) => r.v !== null && r.n >= 2)
        .map((r) => r.v as number);
      groups[g][k] = blendStat(vals, REFERENCE[g][k]);
    }
  }

  const prior = { mean: 0, sd: 1 };
  // Each player's composite at their best-fit position, matching how they're rated.
  const comps = eligible.map((m) =>
    Math.max(
      ...candidatePositions(m.position, m.altPositions).map((pos) =>
        compositeOf(components({ groups }, m.profile, pos, m.position), m.profile.apps),
      ),
    ),
  );
  const attrsRaw = eligible.map((m) => rawAttributes({ groups }, m.profile, m.position));
  const restandard = (xs: number[]): Stat => {
    const n = xs.length;
    if (n < 2) return prior;
    const m = xs.reduce((a, b) => a + b, 0) / n;
    const sd = Math.sqrt(xs.reduce((a, x) => a + (x - m) ** 2, 0) / (n - 1)) || 1;
    const w = n / (n + 4);
    return { mean: w * m, sd: w * sd + (1 - w) * 1 };
  };

  const attributes: Record<string, Stat> = {};
  for (const k of ATTR_KEYS) attributes[k] = restandard(attrsRaw.map((a) => a[k]));

  return { groups, composite: restandard(comps), attributes, squadSize: eligible.length };
}

/** Model built from the reference baseline only (no squad to compare against). */
export const REFERENCE_MODEL: RatingModel = buildRatingModel([]);

/** Map a standardised score onto the card scale with soft ends. */
const toScale = (z: number, centre: number, span: number, div: number) => centre + span * Math.tanh(z / div);

export interface PlayerRating {
  ovr: number | null;
  attrs: Attributes | null;
  /** Standardised overall score (0 = squad average). */
  z: number | null;
  breakdown: ComponentZ[];
}

export function ratePlayer(model: RatingModel, p: PlayerProfile, position: string, peerPosition = position): PlayerRating {
  if (p.apps === 0) return { ovr: null, attrs: null, z: null, breakdown: [] };
  const comps = components(model, p, position, peerPosition);
  const c = compositeOf(comps, p.apps);
  const z = (c - model.composite.mean) / model.composite.sd;
  const ovr = Math.round(Math.max(35, Math.min(99, toScale(z, 73, 24, 2.4))));

  const raw = rawAttributes(model, p, peerPosition);
  const reliability = p.apps / (p.apps + 3);
  const attrs = {} as Attributes;
  for (const k of ATTR_KEYS) {
    const s = model.attributes[k]!;
    const az = reliability * ((raw[k] - s.mean) / s.sd) + (1 - reliability) * -0.5;
    attrs[k] = Math.round(Math.max(30, Math.min(99, toScale(az, 70, 27, 2.2))));
  }
  // Finishing and creativity are skills, not relative standings: an absolute curve
  // on the sample-adjusted rate (0 per game ≈ 35, 0.7 goals per game ≈ 90).
  const rate = (count: number) => (count + 10 * 0.1) / (p.apps + 10);
  const skill = (perGame: number, k: number) => Math.round(Math.max(30, Math.min(99, 35 + 64 * (1 - Math.exp(-perGame * k)))));
  attrs.FIN = skill(rate(p.goals), 2.8);
  attrs.CRE = skill(rate(p.assists), 3.5);
  return { ovr, attrs, z: Math.round(z * 100) / 100, breakdown: comps.filter((x) => x.weight > 0) };
}

export interface PositionRating {
  position: string;
  ovr: number;
}

export interface BestFitRating extends PlayerRating {
  /** The position the overall is taken from. */
  position: string;
  /** Overall at every candidate position, best first. */
  byPosition: PositionRating[];
}

/**
 * Rate a player at their card position and every compatible / user-added position,
 * and take the best fit, as a game card shows its rating at its best position.
 */
export function rateBestPosition(model: RatingModel, p: PlayerProfile, position: string, extra: readonly string[] = []): BestFitRating {
  const candidates = candidatePositions(position, extra);
  if (candidates.length === 0) candidates.push(position);
  const rated = candidates.map((pos) => ({ pos, r: ratePlayer(model, p, pos, position) }));
  if (p.apps === 0) return { ...rated[0]!.r, position, byPosition: [] };
  // Ties keep the card position (listed first).
  const best = rated.reduce((a, b) => ((b.r.z ?? -99) > (a.r.z ?? -99) ? b : a));
  return {
    ...best.r,
    position: best.pos,
    byPosition: rated.map((x) => ({ position: x.pos, ovr: x.r.ovr! })).sort((a, b) => b.ovr - a.ovr),
  };
}

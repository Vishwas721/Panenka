/**
 * Season honours. A season is one calendar month (see `seasonOf` in ./profile).
 *
 * Ballon d'Or: the season's best player across all positions (see ./ballon-dor).
 * Squad awards go to whoever leads the squad that season (ties share):
 *   Golden Boot (goals), Playmaker (assists), MVP (Man of the Match awards),
 *   Best Rated (average rating, 5+ apps).
 * Individual honours go to anyone who reaches the bar that season:
 *   Talisman (5+ goals), Royalty (15+ goals, replaces Talisman),
 *   Star (3+ MOTM), Elite (6.8+ average, 6.5+ for defensive roles, 5+ apps).
 *
 * Pure: no I/O.
 */
import type { MatchRecord, PlayerProfile, SplitLine } from "./profile";
import { ballonDorRace } from "./ballon-dor";
import type { Rarity } from "./keywords";

export type HonourId = "ballon-dor" | "boot" | "playmaker" | "mvp" | "best-rated" | "talisman" | "royalty" | "star" | "elite";

export interface HonourDef {
  id: HonourId;
  name: string;
  description: string;
  kind: "squad" | "individual";
  rarity: Rarity;
}

export const HONOURS: HonourDef[] = [
  { id: "ballon-dor", name: "Ballon d'Or", description: "Best player of the season, rated fairly across every position", kind: "squad", rarity: "mythic" },
  { id: "boot", name: "Golden Boot", description: "Squad's top scorer in a season", kind: "squad", rarity: "legendary" },
  { id: "playmaker", name: "Playmaker", description: "Squad's top assister in a season", kind: "squad", rarity: "legendary" },
  { id: "mvp", name: "MVP", description: "Most Man of the Match awards in a season", kind: "squad", rarity: "legendary" },
  { id: "best-rated", name: "Best Rated", description: "Highest average rating in a season (5+ apps)", kind: "squad", rarity: "legendary" },
  { id: "royalty", name: "Royalty", description: "15+ goals in one season", kind: "individual", rarity: "legendary" },
  { id: "talisman", name: "Talisman", description: "5+ goals in one season", kind: "individual", rarity: "rare" },
  { id: "star", name: "Star", description: "3+ Man of the Match awards in one season", kind: "individual", rarity: "epic" },
  { id: "elite", name: "Elite", description: "6.8+ average in one season (6.5+ for defenders, keepers and DMs; 5+ apps)", kind: "individual", rarity: "epic" },
];

export const HONOUR_BY_ID = Object.fromEntries(HONOURS.map((h) => [h.id, h])) as Record<HonourId, HonourDef>;

const DEFENSIVE = new Set(["GK", "CB", "LB", "RB", "CDM"]);

export interface HonourMember {
  id: string;
  position: string;
  profile: PlayerProfile;
  /** Match records; needed for the Ballon d'Or, which re-rates each season on its own. */
  records?: MatchRecord[];
}

export interface HonourWinner {
  playerId: string;
  /** The stat that won it (Ballon d'Or score, goals, assists, MOTM count or average rating). */
  value: number;
}

export interface SeasonHonours {
  key: string;
  label: string;
  /** True for the season still being played. */
  current: boolean;
  awards: { id: HonourId; winners: HonourWinner[] }[];
}

export interface PlayerHonour {
  id: HonourId;
  seasonKey: string;
  seasonLabel: string;
  value: number;
  current: boolean;
}

function leaders(rows: { id: string; v: number | null }[]): HonourWinner[] {
  const valid = rows.filter((r): r is { id: string; v: number } => r.v !== null && r.v > 0);
  if (!valid.length) return [];
  const best = Math.max(...valid.map((r) => r.v));
  return valid.filter((r) => Math.abs(r.v - best) < 1e-9).map((r) => ({ playerId: r.id, value: r.v }));
}

/** Every season's honours, newest first. */
export function seasonHonours(members: HonourMember[], now: Date = new Date()): SeasonHonours[] {
  const currentKey = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  const labels = new Map<string, string>();
  for (const m of members) for (const s of m.profile.splits.season) labels.set(s.key, s.label);

  return [...labels.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([key, label]) => {
      const lines = members
        .map((m) => ({ m, l: m.profile.splits.season.find((s) => s.key === key) }))
        .filter((x): x is { m: HonourMember; l: SplitLine } => !!x.l);
      const pick = (f: (l: SplitLine, m: HonourMember) => number | null) => lines.map(({ m, l }) => ({ id: m.id, v: f(l, m) }));
      const reach = (f: (l: SplitLine, m: HonourMember) => number | null) =>
        pick(f).filter((r): r is { id: string; v: number } => r.v !== null).map((r) => ({ playerId: r.id, value: r.v }));
      const elite = (l: SplitLine, m: HonourMember) => (DEFENSIVE.has(m.position) ? 6.5 : 6.8);

      const withRecords = members.filter((m): m is HonourMember & { records: MatchRecord[] } => !!m.records);
      const race = withRecords.length ? ballonDorRace(withRecords, key) : null;
      const top = race?.entries.find((e) => e.eligible);
      const ballon = top ? race!.entries.filter((e) => e.eligible && e.score === top.score).map((e) => ({ playerId: e.playerId, value: e.score })) : [];

      const awards: SeasonHonours["awards"] = [
        { id: "ballon-dor", winners: ballon },
        { id: "boot", winners: leaders(pick((l) => l.goals)) },
        { id: "playmaker", winners: leaders(pick((l) => l.assists)) },
        { id: "mvp", winners: leaders(pick((l) => l.motm)) },
        { id: "best-rated", winners: leaders(pick((l) => (l.apps >= 5 ? l.avgRating : null))) },
        { id: "royalty", winners: reach((l) => (l.goals >= 15 ? l.goals : null)) },
        { id: "talisman", winners: reach((l) => (l.goals >= 5 && l.goals < 15 ? l.goals : null)) },
        { id: "star", winners: reach((l) => (l.motm >= 3 ? l.motm : null)) },
        { id: "elite", winners: reach((l, m) => (l.apps >= 5 && l.avgRating !== null && l.avgRating >= elite(l, m) ? l.avgRating : null)) },
      ];
      return { key, label, current: key === currentKey, awards: awards.filter((a) => a.winners.length > 0) };
    });
}

/** One player's honours across all seasons, newest first. */
export function honoursFor(seasons: SeasonHonours[], playerId: string): PlayerHonour[] {
  return seasons.flatMap((s) =>
    s.awards.flatMap((a) =>
      a.winners
        .filter((w) => w.playerId === playerId)
        .map((w) => ({ id: a.id, seasonKey: s.key, seasonLabel: s.label, value: w.value, current: s.current })),
    ),
  );
}

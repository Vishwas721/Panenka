/**
 * Ballon d'Or: the season's best player, whatever their position.
 *
 * Each season is rated on its own: profiles are rebuilt from that season's
 * matches only and run through the same position-fair rating model as the
 * overall (./rating-model). So a centre-back is judged on clean sheets, goals
 * conceded and match ratings against other defenders, a winger on goal
 * contributions against other wingers, a striker on goals against attackers.
 * The model's composite is standardised across the whole squad, which puts
 * every position on one scale, and it already discounts small samples.
 *
 * Points: the season composite on the card scale (squad-average season ≈ 73,
 * outstanding ≈ 90) plus up to +3 for body of work (apps vs the most-used player).
 * Eligibility: at least a third of the season's matches (minimum 3), as the
 * real award needs a full season, not a hot fortnight.
 *
 * Pure: no I/O.
 */
import { buildProfile, seasonOf, type MatchRecord, type PlayerProfile } from "./profile";
import { buildRatingModel, ratePlayer, type ComponentZ } from "./rating-model";

export interface BallonMember {
  id: string;
  position: string;
  records: MatchRecord[];
}

export interface BallonEntry {
  playerId: string;
  position: string;
  /** Ballon d'Or points: quality + body-of-work bonus. */
  score: number;
  /** Quality part only (position-fair season rating). */
  quality: number;
  apps: number;
  eligible: boolean;
  goals: number;
  assists: number;
  motm: number;
  avgRating: number | null;
  cleanSheets: number;
  /** The metrics that lifted the score most, strongest first. */
  strengths: string[];
}

export interface BallonRace {
  seasonKey: string;
  /** Distinct matches the squad played that season. */
  matches: number;
  minApps: number;
  /** Eligible players first, by score. */
  entries: BallonEntry[];
}

export const BALLON_SHARE = 1 / 3;
const VOLUME_BONUS = 3;

function strengths(breakdown: ComponentZ[]): string[] {
  return breakdown
    .filter((c) => c.weight > 0 && c.z > 0.3)
    .sort((a, b) => b.weight * b.z - a.weight * a.z)
    .slice(0, 3)
    .map((c) => c.label);
}

/** The Ballon d'Or race for one season. */
export function ballonDorRace(members: BallonMember[], seasonKey: string): BallonRace {
  const inSeason = members
    .map((m) => ({ m, records: m.records.filter((r) => seasonOf(r.date).key === seasonKey) }))
    .filter((x) => x.records.length > 0);
  const matches = new Set(inSeason.flatMap((x) => x.records.map((r) => r.matchId))).size;
  const minApps = Math.max(3, Math.ceil(matches * BALLON_SHARE));

  const profiles = inSeason.map((x) => ({ ...x, profile: buildProfile(x.records) as PlayerProfile }));
  const model = buildRatingModel(profiles.map((x) => ({ id: x.m.id, position: x.m.position, profile: x.profile })));

  const maxApps = Math.max(1, ...profiles.map((x) => x.profile.apps));
  const r1 = (x: number) => Math.round(x * 10) / 10;

  const entries: BallonEntry[] = profiles.map(({ m, profile }) => {
    const rated = ratePlayer(model, profile, m.position);
    const quality = 73 + 24 * Math.tanh((rated.z ?? -3) / 2.4);
    return {
      playerId: m.id,
      position: m.position,
      score: r1(quality + (VOLUME_BONUS * profile.apps) / maxApps),
      quality: r1(quality),
      apps: profile.apps,
      eligible: profile.apps >= minApps,
      goals: profile.goals,
      assists: profile.assists,
      motm: profile.motm,
      avgRating: profile.rating.avg,
      cleanSheets: profile.defence.cleanSheets,
      strengths: strengths(rated.breakdown),
    };
  });
  entries.sort((a, b) => Number(b.eligible) - Number(a.eligible) || b.score - a.score || b.apps - a.apps);
  return { seasonKey, matches, minApps, entries };
}

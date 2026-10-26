/**
 * Card attributes, overall rating (OVR), card tier and archetype.
 *
 * The numbers come from the squad-relative model in ./rating-model.ts:
 * every metric is compared with players in the same role group, small
 * samples are discounted, and each position has its own recipe.
 *
 *   FIN  Finishing    goals per game (squad-wide)
 *   CRE  Creativity   assists per game (squad-wide)
 *   DEF  Defending    clean sheets and goals conceded, plus rating
 *   IMP  Impact       Man of the Match rate and rating vs role peers
 *   CON  Consistency  rating spread and level vs role peers
 *   FRM  Form         last-5 rating vs role peers
 *   CLU  Clutch       rating and output in one-goal games vs role peers
 */
import type { PlayerProfile } from "./profile";
import { ratePlayer, REFERENCE_MODEL, type RatingModel } from "./rating-model";

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

/** Attributes for one player. Pass the squad model for squad-relative numbers. */
export function computeAttributes(p: PlayerProfile, position = "UNKNOWN", model: RatingModel = REFERENCE_MODEL): Attributes | null {
  return ratePlayer(model, p, position).attrs;
}

/** Overall for one player. `attrs` is accepted for API compatibility; the model recomputes from the profile. */
export function computeOverall(
  p: PlayerProfile,
  _attrs: Attributes | null,
  position: string,
  model: RatingModel = REFERENCE_MODEL,
): number | null {
  return ratePlayer(model, p, position).ovr;
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
  "IMP+FRM": { name: "Driving Force", line: "Influential, and playing their best football right now." },
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

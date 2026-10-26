/**
 * Keyword engine.
 *
 * Keywords are titles a player earns from their numbers. Three kinds:
 *   - Ladders: one metric, many thresholds, each with its own name.
 *   - Feats: one-off conditions (a debut goal, a perfect 10 with a hat-trick…).
 *   - Dynamic: generated per opponent, competition, season, month or weekday,
 *     so the pool grows with every new fixture logged.
 *
 * Pure: evaluation only reads a PlayerProfile and derived attributes.
 */
import type { PlayerProfile, TimelinePoint } from "./profile";
import { ALL_ATTRIBUTE_KEYS, cardKeys, type AttributeKey, type Attributes, archetype } from "./attributes";

export type Rarity = "common" | "rare" | "epic" | "legendary" | "mythic";
export const RARITIES: Rarity[] = ["common", "rare", "epic", "legendary", "mythic"];
export const rarityRank = (r: Rarity) => RARITIES.indexOf(r);

export type Family =
  | "goals" | "assists" | "ga" | "apps" | "motm" | "hauls" | "streaks" | "rating"
  | "rates" | "results" | "minutes" | "bench" | "venue" | "opponents" | "career"
  | "clutch" | "calendar" | "attributes" | "archetype" | "feat" | "squad" | "rivalry"
  | "competition" | "season" | "month" | "defence";

export const FAMILY_LABELS: Record<Family, string> = {
  goals: "Goalscoring",
  assists: "Creation",
  ga: "Involvement",
  apps: "Appearances",
  motm: "Man of the Match",
  hauls: "Hauls",
  streaks: "Streaks",
  rating: "Ratings",
  rates: "Efficiency",
  results: "Winning",
  minutes: "Minutes",
  bench: "Bench & Starts",
  venue: "Home & Away",
  opponents: "Opponents",
  career: "Career",
  clutch: "Clutch",
  calendar: "Calendar",
  attributes: "Attributes",
  archetype: "Archetypes",
  feat: "Feats",
  squad: "Squad Honours",
  rivalry: "Rivalries",
  competition: "Competitions",
  season: "Season Awards",
  month: "Monthly Awards",
  defence: "Defending",
};

export interface KeywordDef {
  id: string;
  name: string;
  description: string;
  family: Family;
  rarity: Rarity;
}

export interface Keyword extends KeywordDef {
  dynamic?: boolean;
}

export interface KeywordProgress {
  keyword: KeywordDef;
  value: number;
  target: number;
  pct: number;
  lowerIsBetter?: boolean;
}

export interface KeywordContext {
  profile: PlayerProfile;
  attrs: Attributes | null;
  ovr: number | null;
  /** Player position; picks the card attributes and archetype. */
  position?: string;
  /** Extra squad-relative keywords computed elsewhere (see squadKeywords). */
  squad?: Keyword[];
}

// ---------------------------------------------------------------------------
// Ladders
// ---------------------------------------------------------------------------

interface Ladder {
  id: string;
  family: Family;
  describe: (t: number) => string;
  metric: (c: KeywordContext) => number | null;
  steps: [number, string][];
  lowerIsBetter?: boolean;
}

const autoRarity = (i: number, n: number): Rarity => {
  if (n <= 1) return "rare";
  const f = i / (n - 1);
  if (f <= 0.2) return "common";
  if (f <= 0.45) return "rare";
  if (f <= 0.7) return "epic";
  if (f <= 0.88) return "legendary";
  return "mythic";
};

const pct = (n: number) => `${Math.round(n * 100)}%`;
const p = (c: KeywordContext) => c.profile;
const gate = (ok: boolean, v: number | null | undefined) => (ok && v !== null && v !== undefined ? v : null);

const LADDERS: Ladder[] = [
  {
    id: "goals", family: "goals", describe: (t) => `Score ${t} career goal${t === 1 ? "" : "s"}`,
    metric: (c) => p(c).goals,
    steps: [[1, "Off the Mark"], [3, "Finding the Net"], [5, "Handful"], [10, "Double Digits"], [15, "Goal Getter"], [20, "Twenty Club"], [25, "Quarter Century"], [30, "Sharpshooter"], [40, "Fox in the Box"], [50, "Half-Ton"], [60, "Prolific"], [75, "Diamond Boots"], [100, "Centurion"], [125, "Net Buster"], [150, "Goal Machine"], [200, "Double Centurion"], [250, "Record Breaker"], [300, "Triple Ton"], [400, "Immortal Finisher"], [500, "Five Hundred Club"], [600, "Living Legend"], [700, "Goal Deity"], [800, "Beyond Records"], [900, "Mythic Marksman"], [1000, "The Thousand"]],
  },
  {
    id: "assists", family: "assists", describe: (t) => `Provide ${t} career assist${t === 1 ? "" : "s"}`,
    metric: (c) => p(c).assists,
    steps: [[1, "First Feed"], [3, "Provider"], [5, "Supply Line"], [10, "Creator"], [15, "Key Passer"], [20, "Playmaker"], [25, "Silver Service"], [30, "Through-Ball Artist"], [40, "Vision"], [50, "Half-Century Creator"], [75, "Puppet Master"], [100, "Assist Centurion"], [150, "Architect Supreme"], [200, "Grand Orchestrator"], [250, "Assist Royalty"], [300, "Eternal Provider"], [400, "The Oracle"], [500, "Assist Immortal"]],
  },
  {
    id: "ga", family: "ga", describe: (t) => `Reach ${t} goal involvements (G+A)`,
    metric: (c) => p(c).ga,
    steps: [[5, "Involved"], [10, "Influencer"], [25, "Difference Maker"], [50, "Main Character"], [75, "Engine Room"], [100, "Hundred Involvements"], [150, "Franchise Player"], [200, "Cornerstone"], [300, "Generational"], [500, "Era Definer"], [750, "Untouchable"], [1000, "Totality"]],
  },
  {
    id: "apps", family: "apps", describe: (t) => `Make ${t} appearance${t === 1 ? "" : "s"}`,
    metric: (c) => p(c).apps,
    steps: [[1, "Debutant"], [5, "Squad Player"], [10, "Regular"], [25, "Mainstay"], [50, "Fifty Up"], [75, "Veteran"], [100, "Hundred Caps"], [150, "Club Stalwart"], [200, "Iron Will"], [250, "Loyal Servant"], [300, "Club Icon"], [400, "Lifer"], [500, "Monument"], [750, "Eternal"], [1000, "Thousand Caps"]],
  },
  {
    id: "motm", family: "motm", describe: (t) => `Win Man of the Match ${t} time${t === 1 ? "" : "s"}`,
    metric: (c) => p(c).motm,
    steps: [[1, "Star Turn"], [3, "Spotlight"], [5, "Headliner"], [10, "Award Magnet"], [15, "Crowd Favourite"], [20, "Showstopper"], [25, "Main Event"], [30, "Trophy Cabinet"], [40, "Matchday King"], [50, "Fifty Stars"], [75, "Constellation"], [100, "Hundred Stars"], [150, "Galaxy"], [200, "Supernova"]],
  },
  {
    id: "braces", family: "hauls", describe: (t) => `Score exactly twice in ${t} match${t === 1 ? "" : "es"}`,
    metric: (c) => p(c).hauls.goals.two,
    steps: [[1, "Brace"], [3, "Doubled Up"], [5, "Twice as Nice"], [10, "Brace Master"], [20, "Double Trouble"], [30, "Twin Engines"], [50, "Brace Royalty"]],
  },
  {
    id: "hattricks", family: "hauls", describe: (t) => `Score 3+ goals in ${t} match${t === 1 ? "" : "es"}`,
    metric: (c) => p(c).hauls.goals.three + p(c).hauls.goals.four + p(c).hauls.goals.fivePlus,
    steps: [[1, "Hat-Trick Hero"], [2, "Two Match Balls"], [3, "Hat Collector"], [5, "Hat Stand"], [10, "Milliner"], [15, "Hat-Trick King"], [25, "Ball Hoarder"], [50, "Hat Emperor"]],
  },
  {
    id: "pokers", family: "hauls", describe: (t) => `Score 4+ goals in ${t} match${t === 1 ? "" : "es"}`,
    metric: (c) => p(c).hauls.goals.four + p(c).hauls.goals.fivePlus,
    steps: [[1, "Poker Face"], [3, "Full House"], [5, "Four Horseman"], [10, "Royal Flush"]],
  },
  {
    id: "fivers", family: "hauls", describe: (t) => `Score 5+ goals in ${t} match${t === 1 ? "" : "es"}`,
    metric: (c) => p(c).hauls.goals.fivePlus,
    steps: [[1, "Glorious Five"], [3, "Handful of Glory"], [5, "Galactic Haul"]],
  },
  {
    id: "assist-braces", family: "hauls", describe: (t) => `Make 2+ assists in ${t} match${t === 1 ? "" : "es"}`,
    metric: (c) => p(c).hauls.assists.two + p(c).hauls.assists.three + p(c).hauls.assists.fourPlus,
    steps: [[1, "Double Feed"], [3, "Twin Creator"], [5, "Generous"], [10, "Gift Giver"], [20, "Santa Boots"], [30, "Philanthropist"]],
  },
  {
    id: "assist-hattricks", family: "hauls", describe: (t) => `Make 3+ assists in ${t} match${t === 1 ? "" : "es"}`,
    metric: (c) => p(c).hauls.assists.three + p(c).hauls.assists.fourPlus,
    steps: [[1, "Assist Hat-Trick"], [3, "Silver Platter"], [5, "Gift Hat"], [10, "Assist Overlord"]],
  },
  {
    id: "full-package", family: "hauls", describe: (t) => `Score and assist in the same match ${t} time${t === 1 ? "" : "s"}`,
    metric: (c) => p(c).hauls.fullPackage,
    steps: [[1, "Full Package"], [5, "Two-Way Threat"], [10, "Swiss Army Knife"], [25, "Do-It-All"], [50, "Complete Game"], [100, "Everything Everywhere"]],
  },
  {
    id: "ga-hauls", family: "hauls", describe: (t) => `Hit 3+ G+A in ${t} match${t === 1 ? "" : "es"}`,
    metric: (c) => p(c).hauls.gaHauls,
    steps: [[1, "Triple Involvement"], [3, "Haul Hunter"], [5, "Big Game Hunter"], [10, "Haul of Fame"], [25, "Avalanche"]],
  },
  {
    id: "scoring-streak", family: "streaks", describe: (t) => `Score in ${t} consecutive appearances`,
    metric: (c) => p(c).streaks.scoring.best,
    steps: [[2, "Back-to-Back"], [3, "Hat-Trick of Games"], [4, "On a Roll"], [5, "Red Hot"], [6, "Unstoppable"], [7, "Seventh Heaven"], [8, "Inferno"], [10, "Ten in a Row"], [12, "Relentless"], [15, "Eternal Flame"], [20, "Streak Immortal"]],
  },
  {
    id: "assist-streak", family: "streaks", describe: (t) => `Assist in ${t} consecutive appearances`,
    metric: (c) => p(c).streaks.assisting.best,
    steps: [[2, "Repeat Provider"], [3, "Feeding Frenzy"], [4, "Assist Run"], [5, "Supply Chain"], [6, "Creative Surge"], [8, "Assist Avalanche"], [10, "Never-Ending Supply"]],
  },
  {
    id: "ga-streak", family: "streaks", describe: (t) => `Register G+A in ${t} consecutive appearances`,
    metric: (c) => p(c).streaks.contributing.best,
    steps: [[3, "Involved Again"], [4, "Always There"], [5, "Ever-Present"], [6, "Unmissable"], [8, "Constant Threat"], [10, "Ten Straight"], [12, "Machine Mode"], [15, "Untameable"], [20, "Twenty Straight"], [25, "Perpetual Motion"]],
  },
  {
    id: "motm-streak", family: "streaks", describe: (t) => `Win Man of the Match ${t} games running`,
    metric: (c) => p(c).streaks.motm.best,
    steps: [[2, "Back-to-Back Star"], [3, "Triple Crown"], [4, "Four-Peat"], [5, "Dynasty Run"], [7, "Seven Stars"], [10, "Untouchable Run"]],
  },
  {
    id: "rating7-streak", family: "streaks", describe: (t) => `Rate 7.0+ in ${t} consecutive rated games`,
    metric: (c) => p(c).streaks.rating7.best,
    steps: [[3, "Solid Run"], [5, "Dependable"], [7, "Reliable Seven"], [10, "Clockwork"], [15, "Unshakeable"], [20, "Rock of Ages"], [30, "Never Below Seven"]],
  },
  {
    id: "rating8-streak", family: "streaks", describe: (t) => `Rate 8.0+ in ${t} consecutive rated games`,
    metric: (c) => p(c).streaks.rating8.best,
    steps: [[2, "Purple Patch"], [3, "Elite Run"], [5, "Golden Spell"], [7, "Peak Era"], [10, "Ascendant"]],
  },
  {
    id: "unbeaten-streak", family: "results", describe: (t) => `Go ${t} appearances without losing`,
    metric: (c) => p(c).streaks.unbeaten.best,
    steps: [[3, "Lucky Charm"], [5, "Unbeaten Five"], [8, "Good Omen"], [10, "Ten Unbeaten"], [15, "Invincible Spell"], [20, "Fortress Mentality"], [30, "Invincible"], [50, "Fifty Unbeaten"]],
  },
  {
    id: "win-streak", family: "results", describe: (t) => `Win ${t} appearances in a row`,
    metric: (c) => p(c).streaks.winning.best,
    steps: [[3, "Winning Habit"], [5, "Five-Win Spree"], [7, "Seven Straight"], [10, "Ten-Win Machine"], [15, "Juggernaut"], [20, "Dynasty"]],
  },
  {
    id: "avg-rating", family: "rating", describe: (t) => `Average ${t.toFixed(1)}+ across at least 5 rated games`,
    metric: (c) => gate(p(c).rating.rated >= 5, p(c).rating.avg),
    steps: [[6.0, "Squad Level"], [6.3, "Solid Pro"], [6.5, "Dependable Pro"], [6.8, "Above Par"], [7.0, "Seven Club"], [7.2, "Quality Operator"], [7.4, "Standout"], [7.5, "Top Performer"], [7.6, "Class Act"], [7.8, "Elite Operator"], [8.0, "Eight Club"], [8.2, "World-Class Average"], [8.5, "Phenomenon"], [8.8, "Generational Talent"], [9.0, "Nine Club"], [9.3, "Beyond Elite"], [9.5, "Perfection Adjacent"]],
  },
  {
    id: "peak-rating", family: "rating", describe: (t) => `Post a ${t.toFixed(1)}+ match rating`,
    metric: (c) => p(c).rating.best,
    steps: [[7, "Good Day"], [7.5, "Great Day"], [8, "Statement Game"], [8.5, "Masterclass"], [9, "Virtuoso"], [9.5, "Transcendent"], [10, "Perfect 10"]],
  },
  {
    id: "nines", family: "rating", describe: (t) => `Rate 9.0+ in ${t} match${t === 1 ? "" : "es"}`,
    metric: (c) => p(c).rating.ninePlus,
    steps: [[1, "Nine-Point Night"], [3, "Repeat Virtuoso"], [5, "Virtuoso Collection"], [10, "Nine Machine"], [20, "Masterpiece Gallery"], [50, "The Louvre"]],
  },
  {
    id: "tens", family: "rating", describe: (t) => `Earn a perfect 10 ${t} time${t === 1 ? "" : "s"}`,
    metric: (c) => p(c).rating.perfectTens,
    steps: [[1, "Flawless"], [2, "Twice Perfect"], [3, "Perfection Trilogy"], [5, "Perfect Hand"], [10, "Perfection Itself"]],
  },
  {
    id: "eights", family: "rating", describe: (t) => `Rate 8.0+ in ${t} match${t === 1 ? "" : "es"}`,
    metric: (c) => p(c).rating.eightPlus,
    steps: [[1, "First Eight"], [5, "Eight Collector"], [10, "Eight Specialist"], [25, "Eight Factory"], [50, "Elite Habit"], [100, "Hundred Eights"]],
  },
  {
    id: "gpa", family: "rates", describe: (t) => `Average ${t} goals per appearance (5+ apps)`,
    metric: (c) => gate(p(c).apps >= 5, p(c).perApp?.goals),
    steps: [[0.2, "Chips In"], [0.3, "Regular Scorer"], [0.4, "Reliable Finisher"], [0.5, "Every Other Game"], [0.6, "Lethal"], [0.7, "Deadly"], [0.8, "Assassin"], [0.9, "Near Goal-a-Game"], [1.0, "Goal-a-Game"], [1.2, "Beyond a Goal"], [1.5, "Video Game Numbers"], [2.0, "Cheat Code"]],
  },
  {
    id: "apa", family: "rates", describe: (t) => `Average ${t} assists per appearance (5+ apps)`,
    metric: (c) => gate(p(c).apps >= 5, p(c).perApp?.assists),
    steps: [[0.15, "Supplier"], [0.2, "Feeder"], [0.3, "Chance Merchant"], [0.4, "Assist Machine"], [0.5, "Assist Every Other"], [0.6, "Serial Creator"], [0.75, "Creator Supreme"], [1.0, "Assist-a-Game"]],
  },
  {
    id: "gapa", family: "rates", describe: (t) => `Average ${t} G+A per appearance (5+ apps)`,
    metric: (c) => gate(p(c).apps >= 5, p(c).perApp?.ga),
    steps: [[0.3, "Contributor"], [0.5, "Big Contributor"], [0.75, "Influence Engine"], [1.0, "G/A Per Game"], [1.25, "Hyper Involved"], [1.5, "Stat Stuffer"], [2.0, "Two a Game"], [2.5, "Absurd Output"], [3.0, "Broken Game"]],
  },
  {
    id: "motm-rate", family: "rates", describe: (t) => `Win Man of the Match in ${pct(t)} of games (5+ apps)`,
    metric: (c) => gate(p(c).apps >= 5, p(c).perApp?.motm),
    steps: [[0.1, "Occasional Star"], [0.15, "Regular Star"], [0.2, "One in Five"], [0.25, "One in Four"], [0.33, "One in Three"], [0.4, "Star Machine"], [0.5, "Every Other Week"], [0.66, "Main Character Energy"], [0.75, "Award Hog"]],
  },
  {
    id: "win-rate", family: "results", describe: (t) => `Win ${pct(t)} of appearances with a known score (5+)`,
    metric: (c) => gate(p(c).record.known >= 5, p(c).record.winRate),
    steps: [[0.4, "Competitive"], [0.5, "Winner"], [0.6, "Serial Winner"], [0.7, "Winning Mentality"], [0.75, "Winning DNA"], [0.8, "Talisman of Victory"], [0.9, "Born Winner"], [1.0, "Perfect Record"]],
  },
  {
    id: "wins", family: "results", describe: (t) => `Win ${t} appearance${t === 1 ? "" : "s"}`,
    metric: (c) => p(c).record.wins,
    steps: [[1, "First Win"], [5, "Winning Start"], [10, "Ten Wins"], [25, "Habitual Winner"], [50, "Fifty Wins"], [100, "Century of Wins"], [200, "Win Machine"]],
  },
  {
    id: "minutes", family: "minutes", describe: (t) => `Play ${t.toLocaleString("en")} recorded minutes`,
    metric: (c) => p(c).minutes,
    steps: [[90, "Full Ninety"], [500, "Five Hundred Minutes"], [1000, "Thousand Minutes"], [2500, "Workhorse"], [5000, "Marathon Runner"], [10000, "Ten Thousand Minutes"], [20000, "Ironman"], [30000, "Perpetual Engine"], [50000, "Timeless"]],
  },
  {
    id: "mins-per-goal", family: "rates", lowerIsBetter: true, describe: (t) => `Score every ${t} minutes or better (3+ goals)`,
    metric: (c) => gate(p(c).goals >= 3, p(c).minutesPerGoal),
    steps: [[300, "Patient Finisher"], [200, "Every Couple of Games"], [150, "Goal Threat"], [120, "Regular Threat"], [100, "Sub-100"], [90, "Goal Every Ninety"], [75, "Lightning"], [60, "Hour Hand"], [45, "Half-Time Habit"], [30, "Blink and Miss"]],
  },
  {
    id: "sub-goals", family: "bench", describe: (t) => `Score ${t} goal${t === 1 ? "" : "s"} off the bench`,
    metric: (c) => p(c).superSub.goals,
    steps: [[1, "Impact Sub"], [3, "Super Sub"], [5, "Bench Weapon"], [10, "Secret Weapon"], [20, "Super-Sub Legend"]],
  },
  {
    id: "sub-apps", family: "bench", describe: (t) => `Come off the bench ${t} times`,
    metric: (c) => p(c).subApps,
    steps: [[5, "Ready Off the Bench"], [10, "Twelfth Man"], [25, "Bench Specialist"], [50, "Eternal Sub"]],
  },
  {
    id: "sub-motm", family: "bench", describe: (t) => `Win Man of the Match as a sub ${t} time${t === 1 ? "" : "s"}`,
    metric: (c) => p(c).superSub.motm,
    steps: [[1, "Bench to Hero"], [3, "Super-Sub Star"], [5, "Game Changer"]],
  },
  {
    id: "starts", family: "bench", describe: (t) => `Start ${t} matches`,
    metric: (c) => p(c).starts,
    steps: [[10, "Starter"], [25, "First Choice"], [50, "Undroppable"], [100, "Hundred Starts"], [200, "Automatic Pick"], [300, "First Name on the Sheet"], [500, "Permanent Fixture"]],
  },
  {
    id: "home-goals", family: "venue", describe: (t) => `Score ${t} home goals`,
    metric: (c) => p(c).splits.venue.find((v) => v.key === "HOME")?.goals ?? 0,
    steps: [[5, "Home Comforts"], [10, "Home Hero"], [25, "Fortress Builder"], [50, "Home Legend"], [100, "Owner of the Ground"]],
  },
  {
    id: "away-goals", family: "venue", describe: (t) => `Score ${t} away goals`,
    metric: (c) => p(c).splits.venue.find((v) => v.key === "AWAY")?.goals ?? 0,
    steps: [[5, "Road Tripper"], [10, "Road Warrior"], [25, "Away-Day Specialist"], [50, "Hostile Territory King"], [100, "Globetrotter"]],
  },
  {
    id: "opp-scored", family: "opponents", describe: (t) => `Score against ${t} different opponents`,
    metric: (c) => p(c).distinct.opponentsScoredAgainst,
    steps: [[3, "Spreading It Around"], [5, "Equal Opportunity"], [10, "Nobody's Safe"], [15, "Serial Victimiser"], [20, "League Terror"], [30, "Everyone's Problem"], [50, "Universal Threat"]],
  },
  {
    id: "opp-faced", family: "opponents", describe: (t) => `Face ${t} different opponents`,
    metric: (c) => p(c).distinct.opponents,
    steps: [[5, "Well Travelled"], [10, "Seen It All"], [20, "Experienced"], [30, "Worldly"], [50, "Encyclopaedic"], [75, "Atlas"], [100, "Hundred Foes"]],
  },
  {
    id: "competitions", family: "career", describe: (t) => `Appear in ${t} different competitions`,
    metric: (c) => p(c).distinct.competitions,
    steps: [[2, "Multi-Front"], [3, "Treble Chaser"], [5, "Cup Specialist"], [8, "Every Competition"]],
  },
  {
    id: "seasons", family: "career", describe: (t) => `Appear across ${t} seasons`,
    metric: (c) => p(c).distinct.seasons,
    steps: [[2, "Second Season"], [3, "Three Seasons"], [5, "Long Server"], [8, "An Era"], [10, "Decade Player"], [15, "Legacy"]],
  },
  {
    id: "involvement", family: "ga", describe: (t) => `Be involved in ${pct(t)} of team goals (5+ scored apps)`,
    metric: (c) => gate(p(c).record.known >= 5, p(c).teamShare.involvement),
    steps: [[0.2, "Key Cog"], [0.3, "Focal Point"], [0.4, "Main Outlet"], [0.5, "Half the Team"], [0.6, "One-Man Team"], [0.75, "The Whole Team"]],
  },
  {
    id: "shine-score", family: "rating", describe: (t) => `Score and rate 8.0+ in ${t} match${t === 1 ? "" : "es"}`,
    metric: (c) => p(c).timeline.filter((t) => t.goals > 0 && (t.rating ?? 0) >= 8).length,
    steps: [[1, "Scored & Shone"], [5, "Statement Scorer"], [10, "Star Striker"], [25, "Showtime Regular"]],
  },
  {
    id: "match-winners", family: "clutch", describe: (t) => `Score in ${t} one-goal win${t === 1 ? "" : "s"}`,
    metric: (c) => p(c).record.matchWinners,
    steps: [[1, "Match Winner"], [3, "Decider"], [5, "Clutch Gene"], [10, "Points Machine"], [20, "Kingmaker"], [30, "Destiny"]],
  },
  {
    id: "draw-scorer", family: "clutch", describe: (t) => `Score in ${t} draw${t === 1 ? "" : "s"}`,
    metric: (c) => p(c).record.drawScorer,
    steps: [[1, "Point Saver"], [5, "Rescue Act"], [10, "Never Say Die"]],
  },
  {
    id: "loss-goals", family: "clutch", describe: (t) => `Score ${t} goal${t === 1 ? "" : "s"} in defeats`,
    metric: (c) => p(c).record.consolationGoals,
    steps: [[1, "Consolation"], [5, "Lone Fighter"], [10, "Defiant"], [25, "Last Stand"]],
  },
  {
    id: "bounce-backs", family: "clutch", describe: (t) => `Improve your rating by 2+ from the previous game ${t} time${t === 1 ? "" : "s"}`,
    metric: (c) => p(c).bounceBacks,
    steps: [[1, "Bounce Back"], [5, "Resilient"], [10, "Phoenix"], [20, "Unbreakable Spirit"]],
  },
  {
    id: "weekend-goals", family: "calendar", describe: (t) => `Score ${t} goals on Saturdays and Sundays`,
    metric: (c) => p(c).weekendGoals,
    steps: [[5, "Weekend Warrior"], [10, "Saturday Specialist"], [25, "Weekend Royalty"], [50, "Matchday Regular"], [100, "Weekend Legend"]],
  },
  {
    id: "midweek-goals", family: "calendar", describe: (t) => `Score ${t} goals Monday–Friday`,
    metric: (c) => p(c).midweekGoals,
    steps: [[3, "Midweek Magic"], [5, "Under the Lights"], [10, "Floodlight Hero"], [25, "European Nights"], [50, "Midweek Monarch"]],
  },
  {
    id: "goal-months", family: "calendar", describe: (t) => `Score in ${t} different calendar months`,
    metric: (c) => p(c).distinct.monthsWithGoal,
    steps: [[3, "Seasonal"], [6, "Half-Year Scorer"], [12, "Year-Round"], [24, "Two Calendars"], [36, "Evergreen"]],
  },
  {
    id: "month-goals", family: "calendar", describe: (t) => `Score ${t} goals in a single month`,
    metric: (c) => p(c).bests.monthGoals,
    steps: [[3, "Good Month"], [5, "Big Month"], [7, "Monster Month"], [10, "Month of Dreams"], [15, "Calendar Destroyer"]],
  },
  {
    id: "season-goals", family: "career", describe: (t) => `Score ${t} goals in one season`,
    metric: (c) => p(c).bests.seasonGoals,
    steps: [[5, "Season Starter"], [10, "Ten-Goal Season"], [15, "Fifteen-Goal Season"], [20, "Twenty-Goal Season"], [25, "Prolific Campaign"], [30, "Thirty-Goal Season"], [40, "Historic Season"], [50, "Fifty-Goal Season"]],
  },
  {
    id: "season-assists", family: "career", describe: (t) => `Provide ${t} assists in one season`,
    metric: (c) => p(c).bests.seasonAssists,
    steps: [[5, "Season Supplier"], [10, "Double-Digit Creator"], [15, "Assist Campaign"], [20, "Twenty-Assist Season"], [25, "Creative Peak"], [30, "Assist Record Season"]],
  },
  {
    id: "season-motm", family: "career", describe: (t) => `Win ${t} Man of the Match awards in one season`,
    metric: (c) => p(c).bests.seasonMotm,
    steps: [[3, "Season Star"], [5, "Season Headliner"], [10, "Season MVP Form"], [15, "Season of Stars"]],
  },
  {
    id: "big-wins", family: "results", describe: (t) => `Win by 4+ goals ${t} time${t === 1 ? "" : "s"}`,
    metric: (c) => p(c).bigWins,
    steps: [[1, "Rout"], [3, "Demolition Crew"], [5, "Wrecking Ball"], [10, "Annihilator"]],
  },
  {
    id: "thrillers", family: "results", describe: (t) => `Play in ${t} match${t === 1 ? "" : "es"} with 6+ total goals`,
    metric: (c) => p(c).thrillers,
    steps: [[1, "Thriller"], [5, "Entertainer"], [10, "Box Office"]],
  },
  {
    id: "silent-maestro", family: "rating", describe: (t) => `Rate 9.0+ without a goal or assist ${t} time${t === 1 ? "" : "s"}`,
    metric: (c) => p(c).silentMaestro,
    steps: [[1, "Silent Maestro"], [3, "Unsung Hero"], [5, "Invisible Genius"]],
  },
  {
    id: "clean-sheets", family: "defence", describe: (t) => `Keep ${t} clean sheet${t === 1 ? "" : "s"} (started or 60+ minutes)`,
    metric: (c) => p(c).defence.cleanSheets,
    steps: [[1, "Shut Out"], [3, "Clean Hands"], [5, "Padlock"], [10, "Ten Shutouts"], [15, "Iron Curtain"], [25, "Fortress"], [50, "The Vault"], [100, "Hundred Shutouts"]],
  },
  {
    id: "clean-sheet-streak", family: "defence", describe: (t) => `Keep ${t} clean sheets in a row`,
    metric: (c) => p(c).streaks.cleanSheet.best,
    steps: [[2, "Back-to-Back Shutouts"], [3, "Locked Down"], [5, "Impenetrable"], [8, "No Way Through"], [12, "Untouchable Defence"]],
  },
  {
    id: "clean-sheet-rate", family: "defence", describe: (t) => `Keep a clean sheet in ${pct(t)} of games (5+ games)`,
    metric: (c) => gate(p(c).defence.games >= 5, p(c).defence.cleanSheetRate),
    steps: [[0.2, "Tight at the Back"], [0.3, "Hard to Break"], [0.4, "Miserly"], [0.5, "Every Other Shutout"], [0.65, "Shutdown Specialist"], [0.8, "Brick by Brick"]],
  },
  {
    id: "low-conceded", family: "defence", lowerIsBetter: true, describe: (t) => `Concede ${t} or fewer per game on average (5+ games)`,
    metric: (c) => gate(p(c).defence.games >= 5, p(c).defence.concededPerApp),
    steps: [[1.5, "Holding Firm"], [1.2, "Organised"], [1.0, "One-a-Game Max"], [0.8, "Stingy"], [0.6, "Watertight"], [0.4, "Airtight"], [0.25, "Impassable"]],
  },
  {
    id: "defender-goals", family: "defence", describe: (t) => `Score ${t} goal${t === 1 ? "" : "s"} as a defender or keeper`,
    metric: (c) => (["CB", "LB", "RB", "GK"].includes(c.position ?? "") ? p(c).goals : null),
    steps: [[1, "Up from the Back"], [3, "Set-Piece Threat"], [5, "Goalscoring Defender"], [10, "Defender? Striker."], [20, "Libero Legend"]],
  },
  {
    id: "defender-assists", family: "defence", describe: (t) => `Provide ${t} assist${t === 1 ? "" : "s"} as a defender or keeper`,
    metric: (c) => (["CB", "LB", "RB", "GK"].includes(c.position ?? "") ? p(c).assists : null),
    steps: [[1, "Overlap"], [3, "Attacking Full-Back"], [5, "Wing-Back Supreme"], [10, "Playmaking Defender"], [20, "Total Footballer"]],
  },
  {
    id: "ovr", family: "attributes", describe: (t) => `Reach ${t} overall`,
    metric: (c) => c.ovr,
    steps: [[60, "Academy Graduate"], [65, "Rotation Option"], [70, "First-Teamer"], [75, "Key Player"], [80, "Elite"], [85, "World Class"], [90, "Panenka Tier"], [95, "Ballon d'Or Shortlist"], [99, "Perfect Player"]],
  },
];

const ATTRIBUTE_LADDER_NAMES: Record<AttributeKey, [string, string, string]> = {
  FIN: ["Sharp", "Clinical", "Lethal Finisher"],
  DEF: ["Solid", "Rock", "Brick Wall"],
  CRE: ["Imaginative", "Visionary", "Genius Passer"],
  IMP: ["Influential", "Game Changer", "Talismanic"],
  CON: ["Steady", "Metronome", "Machine"],
  FRM: ["Warming Up", "In Form", "On Fire"],
  CLU: ["Composed", "Clutch", "Ice Cold"],
};

for (const k of ALL_ATTRIBUTE_KEYS) {
  const names = ATTRIBUTE_LADDER_NAMES[k];
  LADDERS.push({
    id: `attr-${k.toLowerCase()}`,
    family: "attributes",
    describe: (t) => `Reach ${t} ${k}`,
    metric: (c) => c.attrs?.[k] ?? null,
    steps: [[70, names[0]], [80, names[1]], [90, names[2]]],
  });
}

const ladderDefs = (l: Ladder): KeywordDef[] =>
  l.steps.map(([t, name], i) => ({
    id: `${l.id}:${t}`,
    name,
    description: l.describe(t),
    family: l.family,
    rarity: autoRarity(i, l.steps.length),
  }));

// ---------------------------------------------------------------------------
// Feats
// ---------------------------------------------------------------------------

interface Feat extends KeywordDef {
  test: (c: KeywordContext) => boolean;
}

const tl = (c: KeywordContext) => c.profile.timeline;
const anyMatch = (c: KeywordContext, f: (t: TimelinePoint) => boolean) => tl(c).some(f);
const venueLine = (c: KeywordContext, k: string) => c.profile.splits.venue.find((v) => v.key === k);

const FEATS: Feat[] = [
  { id: "feat:debut-goal", name: "Debut Goal", description: "Score on your first appearance", family: "feat", rarity: "rare", test: (c) => (tl(c)[0]?.goals ?? 0) > 0 },
  { id: "feat:debut-star", name: "Debut Star", description: "Win Man of the Match on debut", family: "feat", rarity: "epic", test: (c) => tl(c)[0]?.motm ?? false },
  { id: "feat:dream-debut", name: "Dream Debut", description: "Rate 8.0+ on debut", family: "feat", rarity: "rare", test: (c) => (tl(c)[0]?.rating ?? 0) >= 8 },
  { id: "feat:instant-impact", name: "Instant Impact", description: "Score within your first three appearances", family: "feat", rarity: "common", test: (c) => tl(c).slice(0, 3).some((t) => t.goals > 0) },
  { id: "feat:late-bloomer", name: "Late Bloomer", description: "First goal arrives after 10+ appearances", family: "feat", rarity: "rare", test: (c) => tl(c).findIndex((t) => t.goals > 0) >= 10 },
  { id: "feat:hattrick-star", name: "Hat-Trick & Star", description: "Hat-trick and Man of the Match in one game", family: "feat", rarity: "epic", test: (c) => anyMatch(c, (t) => t.goals >= 3 && t.motm) },
  { id: "feat:double-double", name: "Double Double", description: "2+ goals and 2+ assists in one game", family: "feat", rarity: "epic", test: (c) => anyMatch(c, (t) => t.goals >= 2 && t.assists >= 2) },
  { id: "feat:perfect-storm", name: "Perfect Storm", description: "A 10 rating, a goal and Man of the Match together", family: "feat", rarity: "mythic", test: (c) => anyMatch(c, (t) => (t.rating ?? 0) >= 10 && t.goals > 0 && t.motm) },
  { id: "feat:five-involvements", name: "One-Man Show", description: "5+ goal involvements in a single match", family: "feat", rarity: "legendary", test: (c) => anyMatch(c, (t) => t.goals + t.assists >= 5) },
  { id: "feat:sub-hattrick", name: "Bench Hat-Trick", description: "Score a hat-trick after coming on as a sub", family: "feat", rarity: "legendary", test: (c) => anyMatch(c, (t) => !t.started && t.goals >= 3) },
  { id: "feat:redemption", name: "Redemption Arc", description: "Win Man of the Match straight after a sub-6 rating", family: "feat", rarity: "epic", test: (c) => tl(c).some((t, i) => i > 0 && t.motm && (tl(c)[i - 1]!.rating ?? 10) < 6) },
  { id: "feat:lone-winner", name: "Lone Winner", description: "Score the only goal in a 1–0 win", family: "feat", rarity: "rare", test: (c) => anyMatch(c, (t) => t.goalsFor === 1 && t.goalsAgainst === 0 && t.goals === 1) },
  { id: "feat:carried", name: "Carried the Team", description: "Score every one of your team's goals in a 3+ goal win", family: "feat", rarity: "legendary", test: (c) => anyMatch(c, (t) => t.result === "W" && (t.goalsFor ?? 0) >= 3 && t.goals === t.goalsFor) },
  { id: "feat:seven-goal-scorer", name: "Goal Fest", description: "Score in a match with 7+ total goals", family: "feat", rarity: "rare", test: (c) => anyMatch(c, (t) => t.goals > 0 && (t.goalsFor ?? 0) + (t.goalsAgainst ?? 0) >= 7) },
  { id: "feat:boxing-day", name: "Boxing Day Hero", description: "Score on 26 December", family: "calendar", rarity: "epic", test: (c) => anyMatch(c, (t) => t.goals > 0 && t.date.slice(5, 10) === "12-26") },
  { id: "feat:new-year", name: "New Year, New Goal", description: "Score on 1 January", family: "calendar", rarity: "epic", test: (c) => anyMatch(c, (t) => t.goals > 0 && t.date.slice(5, 10) === "01-01") },
  { id: "feat:friday-lights", name: "Friday Night Lights", description: "Score on a Friday", family: "calendar", rarity: "common", test: (c) => anyMatch(c, (t) => t.goals > 0 && new Date(t.date).getUTCDay() === 5) },
  { id: "feat:rollercoaster", name: "Rollercoaster", description: "Rating spread of 1.5+ across 8+ rated games", family: "rating", rarity: "rare", test: (c) => c.profile.rating.rated >= 8 && (c.profile.rating.stdDev ?? 0) >= 1.5 },
  { id: "feat:metronome", name: "Metronomic", description: "Rating spread of 0.4 or less across 8+ rated games", family: "rating", rarity: "epic", test: (c) => c.profile.rating.rated >= 8 && (c.profile.rating.stdDev ?? 9) <= 0.4 },
  { id: "feat:slow-burner", name: "Slow Burner", description: "Ratings trending upward across 8+ rated games", family: "rating", rarity: "rare", test: (c) => c.profile.rating.rated >= 8 && (c.profile.rating.trend ?? 0) >= 0.05 },
  { id: "feat:on-fire", name: "Currently On Fire", description: "Scored in each of the last 3+ appearances", family: "streaks", rarity: "epic", test: (c) => c.profile.streaks.scoring.current >= 3 },
  { id: "feat:hot-hand", name: "Hot Hand", description: "G+A in each of the last 5+ appearances", family: "streaks", rarity: "epic", test: (c) => c.profile.streaks.contributing.current >= 5 },
  { id: "feat:purple-now", name: "Peaking", description: "Last-5 average at least 0.5 above career average", family: "rating", rarity: "rare", test: (c) => c.profile.rating.rated >= 8 && (c.profile.rating.last5 ?? 0) - (c.profile.rating.avg ?? 99) >= 0.5 },
  { id: "feat:cold-spell", name: "Cold Spell", description: "No goal or assist in the last 5+ appearances", family: "streaks", rarity: "common", test: (c) => c.profile.streaks.blank.current >= 5 },
  { id: "feat:big-game-temperament", name: "Winner's Temperament", description: "Average 8.0+ in wins (3+ rated wins)", family: "results", rarity: "epic", test: (c) => tl(c).filter((t) => t.result === "W" && t.rating !== null).length >= 3 && (c.profile.record.ratingByResult.W ?? 0) >= 8 },
  { id: "feat:leader-in-defeat", name: "Leader in Defeat", description: "Average 7.0+ in losses (3+ rated losses)", family: "results", rarity: "epic", test: (c) => tl(c).filter((t) => t.result === "L" && t.rating !== null).length >= 3 && (c.profile.record.ratingByResult.L ?? 0) >= 7 },
  { id: "feat:fortress-keeper", name: "Fortress Keeper", description: "3+ Man of the Match awards at home", family: "venue", rarity: "rare", test: (c) => (venueLine(c, "HOME")?.motm ?? 0) >= 3 },
  { id: "feat:away-hero", name: "Away-Day Hero", description: "3+ Man of the Match awards away", family: "venue", rarity: "rare", test: (c) => (venueLine(c, "AWAY")?.motm ?? 0) >= 3 },
  { id: "feat:home-bird", name: "Home Bird", description: "Home average 0.7+ above away (3+ of each)", family: "venue", rarity: "common", test: (c) => { const h = venueLine(c, "HOME"); const a = venueLine(c, "AWAY"); return !!h && !!a && h.apps >= 3 && a.apps >= 3 && (h.avgRating ?? 0) - (a.avgRating ?? 99) >= 0.7; } },
  { id: "feat:road-runner", name: "Road Runner", description: "Away average 0.7+ above home (3+ of each)", family: "venue", rarity: "rare", test: (c) => { const h = venueLine(c, "HOME"); const a = venueLine(c, "AWAY"); return !!h && !!a && h.apps >= 3 && a.apps >= 3 && (a.avgRating ?? 0) - (h.avgRating ?? 99) >= 0.7; } },
  { id: "feat:iron-ninety", name: "Iron Ninety", description: "Play the full 90 in 10+ matches", family: "minutes", rarity: "rare", test: (c) => tl(c).filter((t) => (t.minutes ?? 0) >= 90).length >= 10 },
  { id: "feat:all-rounder", name: "All-Rounder", description: "FIN, CRE and IMP all 65+", family: "attributes", rarity: "epic", test: (c) => !!c.attrs && c.attrs.FIN >= 65 && c.attrs.CRE >= 65 && c.attrs.IMP >= 65 },
  { id: "feat:specialist", name: "Specialist", description: "One attribute 85+, every other 60 or below", family: "attributes", rarity: "epic", test: (c) => { if (!c.attrs) return false; const v = cardKeys(c.position ?? "UNKNOWN").map((k) => c.attrs![k]).sort((a, b) => b - a); return v[0]! >= 85 && v[1]! <= 60; } },
  { id: "feat:balanced", name: "Balanced Profile", description: "All six attributes within 10 points (8+ apps)", family: "attributes", rarity: "rare", test: (c) => { if (!c.attrs || c.profile.apps < 8) return false; const v = cardKeys(c.position ?? "UNKNOWN").map((k) => c.attrs![k]); return Math.max(...v) - Math.min(...v) <= 10; } },
  { id: "feat:pure-scorer", name: "Pure Scorer", description: "10+ goals with assists at most a fifth of that", family: "goals", rarity: "rare", test: (c) => c.profile.goals >= 10 && c.profile.assists <= c.profile.goals / 5 },
  { id: "feat:pure-creator", name: "Pure Creator", description: "10+ assists with goals at most a fifth of that", family: "assists", rarity: "rare", test: (c) => c.profile.assists >= 10 && c.profile.goals <= c.profile.assists / 5 },
  { id: "feat:twin-threat", name: "Twin Threat", description: "10+ goals and assists within two of each other", family: "ga", rarity: "epic", test: (c) => c.profile.goals >= 10 && Math.abs(c.profile.goals - c.profile.assists) <= 2 },
  { id: "feat:no-bad-days", name: "No Bad Days", description: "10+ rated games without dropping below 6.0", family: "rating", rarity: "legendary", test: (c) => c.profile.rating.rated >= 10 && (c.profile.rating.worst ?? 0) >= 6 },
  { id: "feat:ever-improving", name: "Ever-Improving", description: "Each season's average higher than the last (3+ seasons)", family: "career", rarity: "legendary", test: (c) => { const s = c.profile.splits.season.filter((x) => x.avgRating !== null).sort((a, b) => a.key.localeCompare(b.key)); return s.length >= 3 && s.every((x, i) => i === 0 || (x.avgRating as number) > (s[i - 1]!.avgRating as number)); } },
];

// ---------------------------------------------------------------------------
// Archetypes as keywords
// ---------------------------------------------------------------------------

const ARCHETYPE_NAMES = [
  "Complete Forward", "Talisman", "Clinical Machine", "Hot-Streak Hitman", "Big-Game Assassin",
  "Conductor", "Metronome Maestro", "Creative Spark", "Decisive Architect", "Lighthouse",
  "Driving Force", "Hero Ball", "Steady Climber", "Ice Veins", "Rising Closer",
  "Ball-Playing Defender", "Defensive Leader", "Brick Wall", "Rising Rock", "Last Line",
];
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const ARCHETYPE_DEFS: KeywordDef[] = ARCHETYPE_NAMES.map((name) => ({
  id: `archetype:${slug(name)}`,
  name,
  description: `Play-style archetype from your two strongest attributes (5+ apps)`,
  family: "archetype",
  rarity: "epic",
}));

// ---------------------------------------------------------------------------
// Dynamic templates (shown in the codex; instantiated per entity)
// ---------------------------------------------------------------------------

export interface DynamicTemplate {
  id: string;
  pattern: string;
  description: string;
  family: Family;
  rarity: Rarity;
  squad?: boolean;
}

export const DYNAMIC_TEMPLATES: DynamicTemplate[] = [
  { id: "opp-tormentor", pattern: "{Opponent} Tormentor", description: "3+ goals against one opponent", family: "rivalry", rarity: "rare" },
  { id: "opp-nemesis", pattern: "{Opponent} Nemesis", description: "5+ goals against one opponent", family: "rivalry", rarity: "epic" },
  { id: "opp-executioner", pattern: "{Opponent} Executioner", description: "10+ goals against one opponent", family: "rivalry", rarity: "legendary" },
  { id: "opp-unbeaten", pattern: "Never Lost to {Opponent}", description: "3+ meetings, zero defeats", family: "rivalry", rarity: "rare" },
  { id: "opp-specialist", pattern: "{Opponent} Specialist", description: "8.0+ average against one opponent (2+ meetings)", family: "rivalry", rarity: "epic" },
  { id: "opp-showman", pattern: "{Opponent} Showman", description: "2+ Man of the Match awards against one opponent", family: "rivalry", rarity: "epic" },
  { id: "comp-talisman", pattern: "{Competition} Talisman", description: "5+ goals in one competition", family: "competition", rarity: "rare" },
  { id: "comp-royalty", pattern: "{Competition} Royalty", description: "15+ goals in one competition", family: "competition", rarity: "legendary" },
  { id: "comp-star", pattern: "{Competition} Star", description: "3+ Man of the Match awards in one competition", family: "competition", rarity: "epic" },
  { id: "comp-elite", pattern: "{Competition} Elite", description: "7.5+ average in one competition (5+ apps)", family: "competition", rarity: "epic" },
  { id: "day-specialist", pattern: "{Weekday} Specialist", description: "5+ goals on one weekday, 40%+ of your total", family: "calendar", rarity: "rare" },
  { id: "season-boot", pattern: "{Season} Golden Boot", description: "Squad's top scorer in a season", family: "season", rarity: "legendary", squad: true },
  { id: "season-playmaker", pattern: "{Season} Playmaker", description: "Squad's top assister in a season", family: "season", rarity: "legendary", squad: true },
  { id: "season-mvp", pattern: "{Season} MVP", description: "Most Man of the Match awards in a season", family: "season", rarity: "legendary", squad: true },
  { id: "season-best-rated", pattern: "{Season} Best Rated", description: "Highest average in a season (5+ rated apps)", family: "season", rarity: "legendary", squad: true },
  { id: "month-potm", pattern: "{Month} Player of the Month", description: "Squad's best average in a month (2+ rated apps)", family: "month", rarity: "epic", squad: true },
  { id: "month-scorer", pattern: "{Month} Top Scorer", description: "Squad's top scorer in a month", family: "month", rarity: "rare", squad: true },
  { id: "squad-top-scorer", pattern: "Squad Top Scorer", description: "Most goals in the squad", family: "squad", rarity: "legendary", squad: true },
  { id: "squad-top-creator", pattern: "Squad Top Creator", description: "Most assists in the squad", family: "squad", rarity: "legendary", squad: true },
  { id: "squad-highest-rated", pattern: "Highest Rated", description: "Best average rating in the squad (5+ rated apps)", family: "squad", rarity: "legendary", squad: true },
  { id: "squad-motm-king", pattern: "MOTM King", description: "Most Man of the Match awards in the squad", family: "squad", rarity: "legendary", squad: true },
  { id: "squad-number-one", pattern: "Squad No. 1", description: "Highest overall in the squad", family: "squad", rarity: "mythic", squad: true },
  { id: "squad-most-capped", pattern: "Most Capped", description: "Most appearances in the squad", family: "squad", rarity: "epic", squad: true },
  { id: "squad-form", pattern: "Form Player", description: "Best last-5 average in the squad (5+ rated apps)", family: "squad", rarity: "epic", squad: true },
];

// ---------------------------------------------------------------------------
// Catalogue
// ---------------------------------------------------------------------------

export const KEYWORD_CATALOGUE: KeywordDef[] = [
  ...LADDERS.flatMap(ladderDefs),
  ...FEATS.map(({ test: _t, ...d }) => d),
  ...ARCHETYPE_DEFS,
];

// ---------------------------------------------------------------------------
// Evaluation
// ---------------------------------------------------------------------------

function dynamicKeywords(c: KeywordContext): Keyword[] {
  const out: Keyword[] = [];
  const add = (tpl: string, key: string, name: string) => {
    const t = DYNAMIC_TEMPLATES.find((x) => x.id === tpl)!;
    out.push({ id: `${tpl}:${slug(key)}`, name, description: t.description, family: t.family, rarity: t.rarity, dynamic: true });
  };
  for (const o of c.profile.splits.opponent) {
    if (o.goals >= 10) add("opp-executioner", o.key, `${o.label} Executioner`);
    else if (o.goals >= 5) add("opp-nemesis", o.key, `${o.label} Nemesis`);
    else if (o.goals >= 3) add("opp-tormentor", o.key, `${o.label} Tormentor`);
    if (o.apps >= 3 && o.losses === 0 && o.wins + o.draws === o.apps) add("opp-unbeaten", o.key, `Never Lost to ${o.label}`);
    if (o.apps >= 2 && (o.avgRating ?? 0) >= 8) add("opp-specialist", o.key, `${o.label} Specialist`);
    if (o.motm >= 2) add("opp-showman", o.key, `${o.label} Showman`);
  }
  for (const comp of c.profile.splits.competition) {
    if (comp.key === "none") continue;
    if (comp.goals >= 15) add("comp-royalty", comp.key, `${comp.label} Royalty`);
    else if (comp.goals >= 5) add("comp-talisman", comp.key, `${comp.label} Talisman`);
    if (comp.motm >= 3) add("comp-star", comp.key, `${comp.label} Star`);
    if (comp.apps >= 5 && (comp.avgRating ?? 0) >= 7.5) add("comp-elite", comp.key, `${comp.label} Elite`);
  }
  for (const d of c.profile.splits.weekday) {
    if (d.goals >= 5 && c.profile.goals > 0 && d.goals / c.profile.goals >= 0.4) add("day-specialist", d.key, `${d.label} Specialist`);
  }
  return out;
}

export interface KeywordResult {
  unlocked: Keyword[];
  /** Highest unlocked keyword per ladder plus every feat/dynamic, best first. */
  signature: Keyword[];
  next: KeywordProgress[];
  counts: Record<Rarity, number>;
}

export function evaluateKeywords(c: KeywordContext): KeywordResult {
  const unlocked: Keyword[] = [];
  const signature: Keyword[] = [];
  const next: KeywordProgress[] = [];

  if (c.profile.apps === 0) {
    return { unlocked, signature, next: [], counts: { common: 0, rare: 0, epic: 0, legendary: 0, mythic: 0 } };
  }

  for (const l of LADDERS) {
    const v = l.metric(c);
    const defs = ladderDefs(l);
    let topIdx = -1;
    let nextIdx = -1;
    for (let i = 0; i < l.steps.length; i++) {
      const t = l.steps[i]![0];
      const ok = v !== null && (l.lowerIsBetter ? v <= t : v >= t - 1e-9);
      if (ok) {
        unlocked.push(defs[i]!);
        topIdx = i;
      } else if (nextIdx === -1) nextIdx = i;
    }
    if (topIdx !== -1) signature.push(defs[topIdx]!);
    if (nextIdx !== -1 && v !== null) {
      const target = l.steps[nextIdx]![0];
      const progress = l.lowerIsBetter ? Math.min(1, target / Math.max(v, 1e-9)) : Math.min(1, v / target);
      next.push({ keyword: defs[nextIdx]!, value: v, target, pct: progress, lowerIsBetter: l.lowerIsBetter });
    }
  }

  for (const f of FEATS) {
    if (f.test(c)) {
      const { test: _t, ...d } = f;
      unlocked.push(d);
      signature.push(d);
    }
  }

  if (c.profile.apps >= 5) {
    const a = archetype(c.attrs, c.position);
    const def = a && ARCHETYPE_DEFS.find((d) => d.name === a.name);
    if (def) {
      unlocked.push(def);
      signature.push(def);
    }
  }

  for (const k of [...dynamicKeywords(c), ...(c.squad ?? [])]) {
    unlocked.push(k);
    signature.push(k);
  }

  signature.sort((a, b) => rarityRank(b.rarity) - rarityRank(a.rarity));
  next.sort((a, b) => b.pct - a.pct);

  const counts = { common: 0, rare: 0, epic: 0, legendary: 0, mythic: 0 } as Record<Rarity, number>;
  for (const k of unlocked) counts[k.rarity]++;

  return { unlocked, signature, next: next.filter((n) => n.pct > 0).slice(0, 8), counts };
}

// ---------------------------------------------------------------------------
// Squad-relative keywords
// ---------------------------------------------------------------------------

export interface SquadMember {
  id: string;
  profile: PlayerProfile;
  ovr: number | null;
}

/** Award squad-relative honours. Ties share the honour. */
export function squadKeywords(members: SquadMember[]): Map<string, Keyword[]> {
  const out = new Map<string, Keyword[]>();
  const give = (ids: string[], tpl: string, key: string, name: string) => {
    const t = DYNAMIC_TEMPLATES.find((x) => x.id === tpl)!;
    for (const id of ids) {
      const list = out.get(id) ?? [];
      list.push({ id: `${tpl}:${slug(key)}`, name, description: t.description, family: t.family, rarity: t.rarity, dynamic: true });
      out.set(id, list);
    }
  };
  const leaders = (vals: [string, number | null][], min = 0.0001) => {
    const valid = vals.filter((v): v is [string, number] => v[1] !== null && v[1] >= min);
    if (!valid.length) return [];
    const best = Math.max(...valid.map((v) => v[1]));
    return valid.filter((v) => Math.abs(v[1] - best) < 1e-9).map((v) => v[0]);
  };
  const active = members.filter((m) => m.profile.apps > 0);
  if (active.length < 2) return out;

  give(leaders(active.map((m) => [m.id, m.profile.goals])), "squad-top-scorer", "all", "Squad Top Scorer");
  give(leaders(active.map((m) => [m.id, m.profile.assists])), "squad-top-creator", "all", "Squad Top Creator");
  give(leaders(active.map((m) => [m.id, m.profile.motm])), "squad-motm-king", "all", "MOTM King");
  give(leaders(active.map((m) => [m.id, m.profile.apps])), "squad-most-capped", "all", "Most Capped");
  give(leaders(active.map((m) => [m.id, m.ovr])), "squad-number-one", "all", "Squad No. 1");
  give(leaders(active.map((m) => [m.id, m.profile.rating.rated >= 5 ? m.profile.rating.avg : null])), "squad-highest-rated", "all", "Highest Rated");
  give(leaders(active.map((m) => [m.id, m.profile.rating.rated >= 5 ? m.profile.rating.last5 : null])), "squad-form", "all", "Form Player");

  const seasons = new Set(active.flatMap((m) => m.profile.splits.season.map((s) => s.key)));
  for (const s of seasons) {
    const line = (m: SquadMember) => m.profile.splits.season.find((x) => x.key === s);
    const label = active.map(line).find(Boolean)!.label;
    give(leaders(active.map((m) => [m.id, line(m)?.goals ?? null])), "season-boot", s, `${label} Golden Boot`);
    give(leaders(active.map((m) => [m.id, line(m)?.assists ?? null])), "season-playmaker", s, `${label} Playmaker`);
    give(leaders(active.map((m) => [m.id, line(m)?.motm ?? null])), "season-mvp", s, `${label} MVP`);
    give(
      leaders(active.map((m) => { const l = line(m); return [m.id, l && l.apps >= 5 ? l.avgRating : null]; })),
      "season-best-rated", s, `${label} Best Rated`,
    );
  }

  const months = new Set(active.flatMap((m) => m.profile.splits.month.map((s) => s.key)));
  for (const mo of months) {
    const line = (m: SquadMember) => m.profile.splits.month.find((x) => x.key === mo);
    const label = active.map(line).find(Boolean)!.label;
    give(
      leaders(active.map((m) => { const l = line(m); return [m.id, l && l.apps >= 2 ? l.avgRating : null]; })),
      "month-potm", mo, `${label} Player of the Month`,
    );
    give(leaders(active.map((m) => [m.id, line(m)?.goals ?? null])), "month-scorer", mo, `${label} Top Scorer`);
  }
  return out;
}

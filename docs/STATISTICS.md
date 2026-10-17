# Statistical Definitions

All statistics in Panenka are derived from match-level performance records. No manually maintained totals.

## Core Metrics

### Appearances
Count of `PlayerMatchPerformance` records where:
- `appearanceStatus` is `STARTED` or `SUBSTITUTE_USED`
- The associated `Match.status` is `COMPLETED`

### Goals
Sum of `goals` from performances in completed matches where the player appeared (started or was a used substitute).

### Assists
Sum of `assists` from performances in completed matches where the player appeared.

### Goal Contributions
`goals + assists` (computed, never stored separately).

## Rate Metrics

### Goals per Appearance
`goals / appearances` when `appearances > 0`; otherwise `null` (displayed as "—").

### Assists per Appearance
`assists / appearances` when `appearances > 0`; otherwise `null`.

### Goal Contributions per Appearance
`(goals + assists) / appearances` when `appearances > 0`; otherwise `null`.

All rates are displayed to 2 decimal places. Sorting and comparison use unrounded values.

## Rate-Based Rankings

A player is eligible for rate-based rankings only when their appearances meet or exceed the **minimum appearance threshold** (configurable, default: 3).

When no player qualifies, the UI shows "Insufficient data".

## Tiebreak Order
1. Primary metric (descending)
2. More appearances (descending)
3. Fewer minutes played total, if known (ascending)
4. Player full name (alphabetical, ascending)

## Goal Breakdown Categories
Counted per match (exact goals in a single match):
- **Single-goal match**: exactly 1 goal
- **Brace**: exactly 2 goals
- **Hat-trick**: exactly 3 goals
- **Four-goal match**: exactly 4 goals
- **Five-or-more**: 5+ goals

## Assist Breakdown Categories
Counted per match:
- **Single-assist match**: exactly 1 assist
- **Two-assist match**: exactly 2 assists
- **Three-assist match**: exactly 3 assists
- **Four-or-more assists**: 4+ assists

## Recent Form
The last 5 completed appearances ordered by match date descending, then match creation order descending.
- If fewer than 3 appearances → "Insufficient data"
- Always shows sample size (e.g., "Last 3 of 3 appearances")

## Known Limitations (V1)
- Own goals are not tracked; goals only count goals scored by the player
- Minutes played are optional (null when unknown)
- No expected goals (xG) or advanced metrics
- Historical aggregate imports create synthetic match records

## Per-match inputs (V2)

Each performance now records four core inputs plus context:

| Input | Field | Rule |
| --- | --- | --- |
| Rating | `rating` | 1.0–10.0, one decimal, optional |
| Goals | `goals` | integer ≥ 0 |
| Assists | `assists` | integer ≥ 0 |
| Man of the Match | `isMotm` | at most one player per match |

Players who did not appear cannot have any of these. Team score is read from the player's perspective: for `AWAY` fixtures `scoreAway` is "ours"; `HOME` and `NEUTRAL` use `scoreHome`.

## Advanced profile (`src/lib/stats/profile.ts`)

Built from completed appearances, oldest first:

- **Ratings**: average, median, best/worst, spread (population std dev), last-5 and last-10 averages, trend (least-squares slope over the last 15 rated games), share of 7.0+ games, counts of 8+, 9+, perfect 10s, sub-6, and a distribution by whole number.
- **Output**: per appearance, per 90 (only from games with minutes, once ≥ 90 minutes), minutes per goal and per G+A.
- **Results with the player**: W/D/L, win rate, points per game, average rating and goals by result, one-goal winners scored in, goals in draws and defeats, wins by 4+, 6+ goal thrillers.
- **Team share**: (goals + assists) ÷ team goals across games with a known score.
- **Hauls**: exact goal and assist counts per match, goal + assist in the same game, 3+ G+A games, blanks.
- **Streaks** (current and best): scoring, assisting, G+A, blank, MOTM, 7.0+ rated, 8.0+ rated, unbeaten, winning.
- **Splits**: venue, starter/sub, competition, season (from the competition, else July–June), opponent, month, weekday.
- **Records**: top five by match score (`rating×10 + goals×9 + assists×6 + MOTM×8`, rating defaults to 6.2 when missing), firsts, personal bests per match/month/season, bounce-backs (+2 on the previous rated game), 9+ games without G+A.

## Card attributes and OVR (`src/lib/stats/attributes.ts`)

Six attributes on 1–99, each shrunk toward 50 by `n / (n + 4)` so small samples can't spike:

| Key | Name | Source |
| --- | --- | --- |
| FIN | Finishing | goals per appearance |
| CRE | Creativity | assists per appearance |
| IMP | Impact | 60% MOTM rate, 40% G+A rate |
| CON | Consistency | 65% share of 7.0+ games, 35% tightness of spread |
| FRM | Form | last-5 rating plus recent G+A |
| CLU | Clutch | rating and G+A in games decided by ≤ 1 goal |

**OVR** blends the average rating (mapped piecewise: 6.0→52, 7.0→68, 8.0→81, 9.0→92, 10→99) with the attributes, weighted by position group (attackers lean on FIN, midfielders on CRE, defenders and keepers on rating, IMP and CON).

**Tiers**: Grassroots < 60 ≤ Academy < 69 ≤ First Team < 77 ≤ Elite < 84 ≤ World Class < 90 ≤ Panenka.

**Archetype**: named from the two strongest attributes (15 combinations).

## Keywords (`src/lib/stats/keywords.ts`)

509 fixed keywords plus 24 dynamic templates:

- **Ladders**: one metric, many named thresholds (goals, assists, apps, MOTM, hauls, streaks, average/peak rating, efficiency rates, win rate, minutes, bench impact, home/away, opponents, seasons, calendar, attributes, OVR). Rarity rises along each ladder: common → rare → epic → legendary → mythic.
- **Feats**: one-off conditions (debut goal, hat-trick + MOTM, perfect storm, redemption arc, no bad days…).
- **Archetypes**: the player's play-style title after 5+ apps.
- **Dynamic**: minted per opponent (Tormentor/Nemesis/Executioner, Never Lost to X…), competition, weekday, and squad-relative honours per season and month (Golden Boot, Playmaker, MVP, Best Rated, Player of the Month, Top Scorer) plus all-time squad leaders. Ties share honours. Archived players are excluded from squad honours.

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

## Overall rating (OVR) — squad-relative model (`src/lib/stats/rating-model.ts`)

Modelled on how scouting departments compare players (z-scores within a position group, combined into a composite and re-standardised; e.g. SkillCorner) and on EA FC's position-weighted overall.

1. **Nine per-game metrics**: match rating, goals, assists, MOTM rate, defending (`1.5 × clean-sheet rate − goals conceded per game`, games started or 60+ minutes), points per game, consistency (−rating spread), form (last-5 rating), clutch (rating + 0.3 × G+A in one-goal games).
2. **Sample-size adjustment**: each metric is shrunk toward its group average by `k` pseudo-games (rating 4, goals/assists 6, MOTM 8, defending 5, PPG 6, consistency 5, form 2, clutch 4).
3. **Role groups**: attackers (ST, LW, RW), midfielders (CAM, CM), defenders & DMs (CB, LB, RB, CDM), keepers. Each metric becomes a z-score against the player's own group. Group averages blend toward an eFootball-calibrated baseline (6 pseudo-players) so small groups stay stable. Defensive roles centre on a 5.7 rating, so 6.0 is decent and 6.5 is very solid, as in eFootball.
4. **Position recipes** (weights sum to 1):

| Pos | Rating | Goals | Assists | MOTM | Defending | PPG | Consistency | Form | Clutch |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ST | .30 | .30 | .07 | .13 | – | .04 | .05 | .07 | .04 |
| LW/RW | .30 | .19 | .17 | .13 | – | .04 | .05 | .07 | .05 |
| CAM | .30 | .14 | .22 | .12 | – | .05 | .05 | .07 | .05 |
| CM | .28 | .12 | .15 | .10 | .08 | .07 | .07 | .08 | .05 |
| CDM | .30 | .05 | .09 | .11 | .18 | .10 | .08 | .05 | .04 |
| LB/RB | .33 | .02 | .07 | .06 | .25 | .10 | .08 | .05 | .04 |
| CB | .35 | – | – | .05 | .30 | .10 | .10 | .05 | .05 |
| GK | .35 | – | – | .05 | .33 | .10 | .09 | .04 | .04 |

   CDM is 25% output (goals, assists, MOTM) and 75% rating/defending; CB and GK use no goals or assists.
5. **Composite** = Σ w·z / √Σw², pulled toward −0.6 ("unproven") by `apps / (apps + 8)` so a hot streak has to be sustained.
6. **Scale**: composites are re-standardised across players with 3+ games, then `OVR = 73 + 24·tanh(z / 2.4)`: squad average ≈ 73, +1 SD ≈ 82, +2.5 SD ≈ 92, floor 35, cap 99.

7. **Best-fit position**: game cards list one position, but players are often used elsewhere (a CF played at CAM). Each player is rated at their card position, its natural alternatives (ST↔CAM/LW/RW, LW/RW↔ST/CAM, CAM↔CM/ST/wings, CM↔CAM/CDM, CDM↔CM/CB, CB↔CDM, LB/RB↔other full-back/CB) and any "also plays" positions set on the player. The overall is the best of these. Only the recipe changes between positions: numbers are always compared with the peer group of the card position, so re-labelling can't game a softer baseline, and attackers are never judged on the defensive scale unless you add a defensive position yourself.

The player page shows this breakdown under "How the overall is built", plus the rating at every candidate position.

## Card attributes

| Key | Name | Source |
| --- | --- | --- |
| FIN | Finishing | absolute curve on sample-adjusted goals per game: `35 + 64·(1 − e^(−2.8·rate))`, rate = (goals + 1) / (apps + 10) |
| CRE | Creativity | same with assists, steepness 3.5 |
| DEF | Defending | 75% defending metric (squad-wide) + 25% rating vs role peers |
| IMP | Impact | 55% MOTM rate + 45% rating, vs role peers |
| CON | Consistency | 60% rating spread + 40% rating, vs role peers |
| FRM | Form | last-5 rating vs role peers |
| CLU | Clutch | rating and G+A in one-goal games vs role peers |

Relative attributes are re-standardised across the squad and mapped with `70 + 27·tanh(z / 2.2)`. GK, CB, LB, RB and CDM cards show DEF in place of FIN.

**Rating colours** follow eFootball bands: < 5.5 red, 5.5 amber, 6.0 neutral, 6.5 green, 7.0 teal, 8.0 orchid, 9.0 gold.

**Tiers**: Grassroots < 60 ≤ Academy < 69 ≤ First Team < 77 ≤ Elite < 84 ≤ World Class < 90 ≤ Panenka.

**Archetype**: named from the two strongest card attributes (20 combinations, including defender types such as Brick Wall and Ball-Playing Defender).

## Keywords (`src/lib/stats/keywords.ts`)

Fixed keywords (see the Codex for the live count) plus 24 dynamic templates:

- **Ladders**: one metric, many named thresholds (goals, assists, apps, MOTM, clean sheets, goals conceded, defender goals/assists, hauls, streaks, average/peak rating, efficiency rates, win rate, minutes, bench impact, home/away, opponents, seasons, calendar, attributes, OVR). Rarity rises along each ladder: common → rare → epic → legendary → mythic.
- **Feats**: one-off conditions (debut goal, hat-trick + MOTM, perfect storm, redemption arc, no bad days…).
- **Archetypes**: the player's play-style title after 5+ apps.
- **Dynamic**: minted per opponent (Tormentor/Nemesis/Executioner, Never Lost to X…), competition, weekday, and squad-relative honours per season and month (Golden Boot, Playmaker, MVP, Best Rated, Player of the Month, Top Scorer) plus all-time squad leaders. Ties share honours. Archived players are excluded from squad honours.

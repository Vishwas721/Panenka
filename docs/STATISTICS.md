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

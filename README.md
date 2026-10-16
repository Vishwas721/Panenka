# Panenka

> **Football Statistics, Elevated.**  
> A premium, local-first football (soccer) statistics tracker and analytics workspace designed for players, coaches, and sports data enthusiasts. Single-user, fully private, running on a local PostgreSQL database with Model Context Protocol (MCP) support for AI agents.

[![Verification](https://img.shields.io/badge/verification-passing-brightgreen)](#verification)
[![Tests](https://img.shields.io/badge/tests-109%20passing-brightgreen)](#testing)
[![Next.js](https://img.shields.io/badge/Next.js-14.2-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.4-teal)](https://www.prisma.io/)
[![MCP](https://img.shields.io/badge/MCP-1.6-purple)](https://modelcontextprotocol.io/)

---

## Table of Contents
- [Product Overview](#product-overview)
- [Key Features](#key-features)
- [Theme Engine](#theme-engine)
- [Architecture & Tech Stack](#architecture--tech-stack)
- [Quick Start](#quick-start)
- [Available Scripts](#available-scripts)
- [Database & Seed Data](#database--seed-data)
- [Model Context Protocol (MCP) Integration](#model-context-protocol-mcp-integration)
- [Statistical Definitions & Tiebreaking](#statistical-definitions--tiebreaking)
- [Verification & Quality Assurance](#verification--quality-assurance)

---

## Product Overview

Panenka is an independent football analytics application built from scratch to track and evaluate individual match performances, goal contributions, and per-appearance efficiency rates.

- **Brand Configuration**: The application brand name, tagline, and wordmark live strictly in [`src/config/brand.ts`](file:///c:/Panenka/src/config/brand.ts), ensuring zero hardcoding throughout components and pages.
- **Architectural Import Boundaries**: Enforced via ESLint rules — UI components and MCP tool handlers interface strictly with the central service layer ([`src/server/services/`](file:///c:/Panenka/src/server/services/)), never querying the Prisma ORM directly.
- **Pure Statistical Computations**: All derived metrics and milestone aggregations are computed using pure mathematical functions ([`src/lib/stats/`](file:///c:/Panenka/src/lib/stats/)) with 100% test coverage.

---

## Key Features

### 1. Analytics Dashboard (`/`)
- **Executive Metric Cards**: Registered, active, and archived players, completed matches, total goals, assists, and combined goal contributions ($G+A$).
- **Leaderboard Highlights**: Dedicated spotlights for Top Scorer, Top Assister, Most Goal Contributions, and Best Goals/App rate (with configurable minimum appearances threshold, default 3).
- **Interactive Recharts Visualization**: Horizontal bar chart comparing top players across Goals, Assists, or Total Contributions, featuring exact-value tooltips and an accessible data table toggle.
- **Recent Activity**: Live feeds of recent match results, scorers, and newly registered squad members.

### 2. Player Management (`/players`)
- **Squad Directory**: Searchable, filterable, and sortable directory supporting player position badges, squad numbers, nationalities, preferred foot, and avatar fallbacks.
- **Duplicate Prevention**: Case- and whitespace-insensitive name collision checks scoped to the player's team.
- **Safe Lifecycle Management**: Soft-archive capabilities for players with historical match records. Permanent hard-delete is strictly guarded and only permitted for players with zero logged appearances.

### 3. Match Logging (`/matches`, `/matches/new`, `/matches/[id]/edit`)
- **Fixture Management**: Track opponents, competition, match venue (Home/Away/Neutral), venue names, date, and final scorelines.
- **Transactional Performance Logging**: Rapid keyboard-friendly roster entry to log appearance status (`STARTED`, `SUBSTITUTE_USED`, `UNUSED_SUBSTITUTE`, `DID_NOT_PLAY`), minutes played ($0-130$), goals, and assists.
- **Atomic Persistence**: Matches and all corresponding player performances are committed in an all-or-nothing Prisma transaction (`$transaction`).
- **Live Score Validation**: Non-blocking contextual alert warning if logged player goals exceed the team's final recorded score.

### 4. Goal & Assist Breakdown (`/breakdown`)
- **Signature Milestones**:
  - **Hat-trick Kings**: Highlights players with single-match outputs of 3, 4, or 5+ goals.
  - **Brace Masters**: Ranks players by occurrences of exactly 2 goals in a match.
  - **Assists per Appearance**: Rates playmaking efficiency with an interactive minimum appearances threshold filter.
- **Milestone Matrix**: Searchable and paginated table tracking Single-goal, Brace, Hat-trick, 4-Goal, 5+ Goal games, along with single and multi-assist performances.
- **Match Drill-Down Dialogs**: Clicking on any player or milestone badge opens an interactive modal listing the exact historical matches behind the milestone.

### 5. Player Profile (`/players/[id]`)
- **Player Dossier**: Career totals, per-appearance scoring and assist rates, preferred foot, team, and squad number.
- **Match-by-Match Visual Chart**: Compact bar chart visualizing scoring and assist output across fixtures.
- **Recent Form Evaluation**: Evaluates performance over the last 5 appearances. Automatically guards against false precision by displaying "Insufficient data" when fewer than 3 appearances are recorded.
- **Full Historical Log**: Chronological table of appearances, minutes played, opposing clubs, and scorelines.

### 6. Player Comparison (`/compare`)
- **Head-to-Head Analysis**: Select 2 or 3 players via an interactive picker to compare metrics side-by-side.
- **Grouped Comparison Chart**: Visual Recharts comparison across appearances, goals, assists, and rates.
- **Tactical Efficiency Callout**: Plain-language analytical breakdown distinguishing cumulative volume from per-appearance rate efficiency.
- **Sample Size & Disparity Warnings**: Highlights eligibility threshold shortfalls ($< 3$ matches) or exposure disparities (appearance gaps $\ge 5$ or ratio $\ge 2.0\times$).

---

## Theme Engine

Panenka features a custom, tokenized 3-theme design system powered by `next-themes` and CSS custom variables:

1. **Touchline** *(Default)*: Stadium floodlights, midnight graphite (`#0B1118`), tactical borders, and electric lime accent (`#84CC16`).
2. **Matchday**: Match programme aesthetic with warm ivory background (`#FDFBF7`) and forest pitch green (`#15803D`).
3. **Champions**: Elite European night aesthetic with deep obsidian black (`#050505`) and metallic gold (`#F59E0B`).

> **Accessibility Assurance**: All three themes are rigorously verified against WCAG AA color contrast guidelines ($\ge 4.5:1$ for body typography, $\ge 3.0:1$ for UI controls) through automated unit tests (`tests/unit/contrast.test.ts`).

---

## Architecture & Tech Stack

```
Panenka/
├── src/
│   ├── app/            # Next.js App Router (pages and server actions)
│   ├── components/     # UI components grouped by feature (dashboard, players, matches, breakdown, compare)
│   ├── config/         # brand.ts (Single source of truth) and env.ts (Zod validation)
│   ├── lib/
│   │   ├── stats/      # Pure statistical calculation functions (no I/O, 100% unit tested)
│   │   └── validation/ # Shared Zod schemas (player, match, performance)
│   └── server/
│       ├── db/         # Prisma client singleton
│       └── services/   # Central application service layer (player, match, stats, competition)
├── mcp/                # Model Context Protocol server (stdio transport, read-only tools)
├── prisma/             # Schema, migrations, and demo seed script
├── tests/              # Unit, integration, and MCP test suites
└── docs/               # Architecture, decisions log, statistics definitions, progress tracker
```

- **Frontend**: Next.js 14 App Router, React 18, Tailwind CSS, shadcn/ui (Radix primitives), Lucide React, Recharts.
- **Backend & Database**: Next.js Server Actions, PostgreSQL 16 (Docker Compose), Prisma ORM 6.4.
- **Type Safety & Validation**: Strict TypeScript (`noUncheckedIndexedAccess: true`), Zod.
- **Protocol**: Model Context Protocol (MCP) SDK 1.6.1 for Claude Code and Google Antigravity.
- **Testing**: Vitest 3.2.

---

## Quick Start

### 1. Prerequisites
- **Node.js**: $\ge 22.0.0$ ([`.nvmrc`](file:///c:/Panenka/.nvmrc))
- **pnpm**: $\ge 9.0.0$
- **Docker Desktop**: Running locally
- **Git**

### 2. Setup & Installation
```powershell
# Clone the repository
git clone https://github.com/Vishwas721/Panenka.git
cd Panenka

# Install dependencies with pnpm
pnpm install

# Copy environment configuration
cp .env.example .env

# Start the PostgreSQL 16 container (binds to 127.0.0.1:5434)
pnpm db:up

# Run Prisma database migrations
pnpm db:migrate

# Seed reproducible fictional demo dataset
pnpm db:seed

# Start the development server
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000) to open Panenka.

---

## Available Scripts

| Script | Description |
| --- | --- |
| `pnpm dev` | Starts the Next.js development server on `http://localhost:3000` |
| `pnpm build` | Compiles an optimized production build with static route analysis |
| `pnpm start` | Runs the compiled production server |
| `pnpm verify` | Runs the full verification pipeline: `lint`, `typecheck`, `test`, `build` |
| `pnpm test` | Runs the complete Vitest test suite (109 tests across 9 suites) |
| `pnpm lint` | Runs Next.js ESLint with architectural boundary rules |
| `pnpm typecheck` | Runs `tsc --noEmit` under strict TypeScript |
| `pnpm db:up` | Starts the PostgreSQL Docker container on port `5434` |
| `pnpm db:down` | Stops the PostgreSQL container |
| `pnpm db:migrate` | Applies Prisma migrations to the local database |
| `pnpm db:seed` | Populates the database with demo players, competitions, and matches |
| `pnpm db:reset-demo` | Removes demo records without affecting custom user entries |
| `pnpm mcp:start` | Launches the read-only Panenka MCP server on `stdio` |
| `pnpm mcp:inspect` | Opens the official interactive MCP Inspector web UI |

---

## Database & Seed Data

- **Database Port**: Panenka uses port `5434` on `127.0.0.1` (`postgresql://postgres:postgres@127.0.0.1:5434/panenka?schema=public`) to prevent conflicts with local PostgreSQL instances on port 5432 or other Docker containers.
- **Fictional Demo Data**: The seed script (`prisma/seed.ts`) generates realistic, fictional football clubs (e.g. *Metropolis Athletic*, *Riverside United*), competitions (*Premier Division*, *Super Cup*), and players across all positions with authentic match distributions (including hat-tricks, braces, and multi-assist games).

---

## Model Context Protocol (MCP) Integration

Panenka includes a built-in read-only MCP server connecting local AI assistants (Claude Code, Google Antigravity) directly to the database.

See the complete guide in [`docs/MCP_SETUP.md`](file:///c:/Panenka/docs/MCP_SETUP.md).

### Registered Tools
1. `get_dashboard_summary`: High-level metrics, leaderboards, and recent activity.
2. `search_players`: Filter players by name query, position, or team.
3. `get_player_profile`: Full player dossier, career totals, milestones, and match log.
4. `get_goal_assist_breakdown`: Milestone rankings (Hat-trick Kings, Brace Masters, Assist rates).
5. `compare_players`: Head-to-head comparison with volume vs. rate tactical notes.
6. `get_recent_matches`: Fixture results, scorelines, venues, and goalscorers.

### Claude Code Setup
```bash
claude mcp add panenka -- pnpm mcp:start
```

### Google Antigravity Setup
Add the server entry to `~/.gemini/config/mcp_config.json` (or on Windows: `C:\Users\<username>\.gemini\config\mcp_config.json`):
```json
{
  "mcpServers": {
    "panenka": {
      "command": "cmd",
      "args": ["/c", "pnpm", "--dir", "C:/Panenka", "mcp:start"],
      "env": {
        "DATABASE_URL": "postgresql://postgres:postgres@127.0.0.1:5434/panenka?schema=public"
      }
    }
  }
}
```
Or manage it directly in the Antigravity UI under **Additional Options (...) > MCP Servers**.

---

## Statistical Definitions & Tiebreaking

See [`docs/STATISTICS.md`](file:///c:/Panenka/docs/STATISTICS.md) for full statistical specifications.

- **Appearances**: Count of appearances where `appearanceStatus` is `STARTED` or `SUBSTITUTE_USED` in a `COMPLETED` match.
- **Goal Contributions**: Computed dynamically as $\text{Goals} + \text{Assists}$. Never stored as duplicate aggregate columns.
- **Rates**: Computed as $\frac{\text{Metric}}{\text{Appearances}}$. Returns `null` ("—") when appearances are 0 to prevent division by zero.
- **Deterministic Tiebreaking**:
  1. Primary metric (descending)
  2. Higher appearances (descending)
  3. Fewer minutes played total (ascending; null sorted last)
  4. Alphabetical by player full name (ascending)

---

## Verification & Quality Assurance

Panenka maintains an unbroken green test suite across all development phases:

```powershell
pnpm verify
```

```
✔ ESLint: 0 warnings, 0 errors (architectural import boundaries verified)
✔ TypeScript: 0 errors (strict mode + noUncheckedIndexedAccess)
✔ Vitest: 109 / 109 passing across 9 test files
  - src/lib/stats/stats.test.ts (42 tests)
  - tests/mcp/server.test.ts (19 tests)
  - tests/unit/contrast.test.ts (12 tests)
  - tests/unit/components.test.ts (11 tests)
  - src/server/services/services.test.ts (8 tests)
  - tests/unit/player-actions.test.ts (7 tests)
  - tests/unit/phase3.test.ts (4 tests)
  - tests/unit/matches.test.ts (4 tests)
  - tests/unit/dashboard.test.ts (2 tests)
✔ Next.js Build: 9/9 routes statically & dynamically compiled
```

---

## License

Private repository. Copyright © 2026. All rights reserved.

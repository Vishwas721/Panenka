# Panenka — Agent Context

## Overview
Panenka is a local football (soccer) statistics application. Single-user, no authentication in V1.

## Architecture
- **Next.js App Router** with strict TypeScript
- **PostgreSQL** via Docker Compose (port 5433)
- **Prisma ORM** for schema, migrations, queries
- **MCP Server** (stdio, read-only) for Claude Code / Antigravity integration

## Folder Map
```
src/
  app/            → Routes and pages (thin, no business logic)
  components/     → UI components (feature-grouped)
  config/         → brand.ts and app configuration
  server/
    services/     → Application services (shared by web + MCP)
    db/           → Prisma client and query helpers
  lib/
    stats/        → Pure statistical functions (no I/O)
    validation/   → Zod schemas
mcp/              → MCP server entry, tool definitions, tests
prisma/           → Schema, migrations, seed
tests/            → Unit, integration, e2e
docs/             → Setup, statistics, decisions, progress
```

## Key Commands
```bash
pnpm dev              # Start dev server (port 3000)
pnpm db:up            # Start PostgreSQL Docker container
pnpm db:migrate       # Run Prisma migrations
pnpm db:seed          # Seed demo data
pnpm db:reset-demo    # Remove demo data only
pnpm test             # Run Vitest unit/integration tests
pnpm test:e2e         # Run Playwright e2e tests
pnpm lint             # ESLint
pnpm typecheck        # TypeScript type checking
pnpm build            # Production build
pnpm mcp:start        # Start MCP server (stdio)
pnpm mcp:inspect      # MCP Inspector
pnpm verify           # Run all checks (lint, typecheck, test, build)
```

## Database
- PostgreSQL 16 via Docker Compose
- Port: 5433 (to avoid conflict with local Postgres on 5432)
- Connection: see `.env.example`
- All timestamps in UTC (`timestamptz`)
- Stable cuid primary keys

## Statistical Definitions
See `docs/STATISTICS.md` for complete definitions.

## Coding Conventions
- Brand name defined in `src/config/brand.ts` only
- No hardcoded statistics in UI
- No business logic in components or pages
- Components import from services, never from Prisma directly
- Pure stats functions in `src/lib/stats/` with full unit test coverage
- Zod validation shared between forms, server actions, and MCP
- All derived metrics computed from match-level performance records
- Semantic CSS custom properties for theming (no hardcoded colors)
- Tabular numerals for all statistics display

## Git Rules
- Work directly on `main` (trunk-based)
- Conventional Commits: `feat:`, `fix:`, `test:`, `refactor:`, `docs:`, `chore:`, `style:`, `build:`
- Small, logical commits; push after every commit
- Never force-push or rewrite published history
- Never commit secrets (`.env`, credentials)
- Keep repo green after every commit

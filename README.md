# Panenka

A premium football (soccer) statistics tracker. Local-first, single-user application for managing players, recording match performances, and analyzing goal/assist statistics.

## Prerequisites

- **Node.js** 22.x ([`.nvmrc`](./.nvmrc))
- **pnpm** 12.x
- **Docker Desktop** (for PostgreSQL)
- **Git**

## Quick Start

```bash
# 1. Clone and install
git clone https://github.com/Vishwas721/Panenka.git
cd Panenka
pnpm install

# 2. Set up environment
cp .env.example .env

# 3. Start the database
pnpm db:up

# 4. Run migrations and seed
pnpm db:migrate
pnpm db:seed

# 5. Start the dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Production build |
| `pnpm db:up` | Start PostgreSQL container |
| `pnpm db:down` | Stop PostgreSQL container |
| `pnpm db:migrate` | Run Prisma migrations |
| `pnpm db:seed` | Seed demo data |
| `pnpm db:reset-demo` | Remove demo data only |
| `pnpm test` | Run unit/integration tests |
| `pnpm test:e2e` | Run Playwright e2e tests |
| `pnpm lint` | Lint with ESLint |
| `pnpm typecheck` | TypeScript type check |
| `pnpm verify` | Run all checks |
| `pnpm mcp:start` | Start MCP server (stdio) |
| `pnpm mcp:inspect` | Open MCP Inspector |

## Architecture

See [AGENTS.md](./AGENTS.md) for the full architecture overview.

## Statistics

See [docs/STATISTICS.md](./docs/STATISTICS.md) for statistical definitions.

## Known Limitations (V1)

- Single-user, no authentication
- Own goals not tracked
- No xG or advanced metrics
- Local-only (no cloud sync)

## License

Private. All rights reserved.

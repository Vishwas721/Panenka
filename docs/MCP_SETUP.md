# Panenka Model Context Protocol (MCP) Setup Guide

This guide details how to configure and connect AI agent clients—specifically **Claude Code** and **Google Antigravity**—to the Panenka MCP Server.

---

## 1. Overview & Security Architecture

Panenka exposes a **read-only** Model Context Protocol (MCP) server adhering to Section 13 of the project specification.

- **Transport**: Standard Input/Output (`StdioServerTransport`).
- **Role**: Read-only statistical access. Zero write or mutation tools (`create`, `update`, `delete`, `reset`, or `seed`) are registered.
- **Validation**: Strict parameter validation using shared Zod schemas.
- **Data Source**: Application service layer querying the local PostgreSQL database via Prisma ORM.
- **Output**: Agent-optimized, dense Markdown and structured summaries.

---

## 2. Prerequisites

1. **Node.js**: Version 22.0.0 or higher.
2. **pnpm**: Version 9.0 or higher.
3. **Database**: The Panenka PostgreSQL container must be running and migrated:
   ```bash
   pnpm db:up
   pnpm db:migrate
   pnpm db:seed
   ```
4. Verify server tests pass:
   ```bash
   pnpm test tests/mcp/server.test.ts
   ```

---

## 3. Client Configuration

### A. Claude Code Configuration

Add the `panenka` server configuration to your global Claude Code settings file (`~/.claude.json` on macOS/Linux or `%USERPROFILE%\.claude.json` on Windows):

```json
{
  "mcpServers": {
    "panenka": {
      "command": "pnpm",
      "args": ["mcp:start"],
      "cwd": "c:\\Panenka"
    }
  }
}
```

*Alternative configuration using `npx tsx` directly:*
```json
{
  "mcpServers": {
    "panenka": {
      "command": "npx",
      "args": ["tsx", "mcp/server.ts"],
      "cwd": "c:\\Panenka",
      "env": {
        "NODE_ENV": "development",
        "DATABASE_URL": "postgresql://postgres:postgres@localhost:5434/panenka?schema=public"
      }
    }
  }
}
```

*Or add via the Claude Code CLI:*
```bash
claude mcp add panenka pnpm mcp:start --cwd c:\Panenka
```

---

### B. Google Antigravity Configuration

In Google Antigravity, configure the MCP server in your workspace or global MCP settings file (`~/.gemini/antigravity/mcpSettings.json` or `%USERPROFILE%\.gemini\antigravity\mcpSettings.json`):

```json
{
  "mcpServers": {
    "panenka": {
      "command": "pnpm",
      "args": ["mcp:start"],
      "cwd": "c:\\Panenka"
    }
  }
}
```

If specifying custom environment variables:
```json
{
  "mcpServers": {
    "panenka": {
      "command": "pnpm",
      "args": ["mcp:start"],
      "cwd": "c:\\Panenka",
      "env": {
        "DATABASE_URL": "postgresql://postgres:postgres@localhost:5434/panenka?schema=public",
        "MIN_APPEARANCES_FOR_RATE": "3"
      }
    }
  }
}
```

---

## 4. Verification & Testing

### Interactive Testing with MCP Inspector

You can inspect all tool definitions, test arguments, and inspect live responses in your browser using the official MCP Inspector:

```bash
pnpm mcp:inspect
```

This launches the inspector web UI (typically at `http://localhost:5173`) where you can interactively invoke each tool.

### Automated Test Suite

Run the full MCP test suite using Vitest (verifies tool listing, read-only safety, argument validation, and execution against the database):

```bash
pnpm test tests/mcp/server.test.ts
```

---

## 5. Available Tools Reference

The Panenka MCP server exposes 6 read-only statistical tools:

| Tool Name | Description | Key Parameters |
| :--- | :--- | :--- |
| `get_dashboard_summary` | High-level statistics: total players (active/archived), completed matches, overall goals/assists/contributions, top scorers, top assisters, and recent matches. | None |
| `search_players` | Search registered players with basic stats (apps, goals, assists, G+A, G/app, A/app). | `query` (string), `position` (enum), `team` (string), `limit` (number, default: 10) |
| `get_player_profile` | Detailed player dossier: personal info, career stats, minutes, rates, goal milestone breakdown (braces, hat-tricks), assist breakdown, recent form, and match-by-match history. | `playerId` (string, required) |
| `get_goal_assist_breakdown` | Signature breakdown: Hat-trick Kings (3+ goals), Brace Masters (2 goals), Assists per appearance rankings, and comprehensive breakdown table. | `position` (enum), `competitionId` (string), `team` (string), `minAppearances` (number), `sortBy` (string), `sortOrder` ("asc"\|"desc"), `page` (number), `pageSize` (number) |
| `compare_players` | Head-to-head statistical comparison between 2 or 3 players with side-by-side tables, category leaders, and sample size / appearance disparity alerts. | `playerIds` (array of 2–3 strings, required) |
| `get_recent_matches` | Recent match list with match metadata, scores, venue, status, competition, and goalscorers. | `limit` (number, default: 5), `status` ("SCHEDULED"\|"COMPLETED"\|"ABANDONED") |

---

## 6. Example Agent Invocations

### Prompt 1: High-Level Pulse
> *"What is the current state of our squad in Panenka? Who is the top scorer and what is our total goal tally?"*
- Client invokes `get_dashboard_summary()` and receives totals, rates, and top leaderboards.

### Prompt 2: Player Scouting / Search
> *"Find all strikers registered in the system with their goal statistics."*
- Client invokes `search_players({ position: "ST", limit: 10 })`.

### Prompt 3: Head-to-Head Comparison
> *"Compare Marcus Sterling and David Kim. Who is more productive in front of goal?"*
- Client searches for the player IDs via `search_players`, then calls `compare_players({ playerIds: [id1, id2] })`.
- Receives side-by-side metric table, category leaders, and sample size disparity assessment.

---

## 7. Troubleshooting

### Stdio Transport Protocol Integrity
All stdout output from the process is strictly reserved for JSON-RPC messages. All debug logs, connection notices, and startup banners in Panenka MCP Server are explicitly written to `stderr` (`console.error`). If your client hangs during startup, ensure no custom wrapper or script writes plain text to `stdout`.

### Database Connection
Ensure the Docker PostgreSQL container is active on port `5434`:
```bash
docker ps
```
If the container is stopped:
```bash
pnpm db:up
```

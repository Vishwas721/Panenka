# Decisions Log

Architectural and design decisions for Panenka.

| # | Date | Context | Decision | Reason |
|---|------|---------|----------|--------|
| 1 | 2026-10-16 | Local Postgres on port 5432 and Docker container on 5433 conflict | Use port 5434 for Docker PostgreSQL | Avoids port conflicts with existing local PostgreSQL and other Docker containers |
| 2 | 2026-10-16 | Package manager choice | Use pnpm (v12.8.1) consistently | Already installed, faster than npm, strict dependency resolution |
| 3 | 2026-10-16 | No authentication in V1 | Single-user local app, no auth | Intentional for V1; service layer is structured to support auth later |
| 4 | 2026-10-16 | Own goals not tracked in V1 | Goals count only goals scored, not own goals | Simplifies V1; documented as known limitation |
| 5 | 2026-10-16 | Minutes default to null, not 90 | Unknown minutes stored as null | Avoids false precision; 90 minutes is an assumption |

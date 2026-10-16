import { z } from "zod";
import { positionEnum } from "@/lib/validation/player";
import { matchStatusEnum } from "@/lib/validation/match";
import {
  getDashboardSummary,
  getPlayers,
  getPlayerById,
  getGoalAssistBreakdown,
  comparePlayers,
  getMatches,
} from "@/server/services";
import {
  McpError,
  ErrorCode,
  type Tool,
  type CallToolResult,
} from "@modelcontextprotocol/sdk/types.js";

// ============================================================================
// Schemas
// ============================================================================

export const getDashboardSummarySchema = z.object({});

export const searchPlayersSchema = z.object({
  query: z
    .string()
    .optional()
    .describe("Search term matching player full name or display name"),
  position: positionEnum.optional().describe("Filter by player position"),
  team: z.string().optional().describe("Filter by team name"),
  limit: z
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
    .default(10)
    .describe("Maximum number of players to return (default: 10)"),
});

export const getPlayerProfileSchema = z.object({
  playerId: z
    .string()
    .min(1, "playerId is required")
    .describe("The unique ID (CUID) of the player"),
});

export const getGoalAssistBreakdownSchema = z.object({
  position: positionEnum.optional().describe("Filter by player position"),
  competitionId: z.string().optional().describe("Filter by competition ID"),
  team: z.string().optional().describe("Filter by team name"),
  minAppearances: z
    .number()
    .int()
    .min(0)
    .optional()
    .describe("Minimum appearances threshold for rate calculations"),
  sortBy: z
    .string()
    .optional()
    .describe(
      "Sort column (goals, assists, appearances, braces, hatTricks, singleGoalMatches, etc.)",
    ),
  sortOrder: z
    .enum(["asc", "desc"])
    .optional()
    .default("desc")
    .describe("Sort direction: 'asc' or 'desc' (default: 'desc')"),
  page: z
    .number()
    .int()
    .min(1)
    .optional()
    .default(1)
    .describe("Page number (1-indexed)"),
  pageSize: z
    .number()
    .int()
    .min(1)
    .max(50)
    .optional()
    .default(10)
    .describe("Number of items per page (default: 10)"),
});

export const comparePlayersSchema = z.object({
  playerIds: z
    .array(z.string().min(1, "Player ID cannot be empty"))
    .min(2, "Must provide at least 2 player IDs to compare")
    .max(3, "Cannot compare more than 3 players at once")
    .describe("Array of 2 or 3 player IDs to compare"),
});

export const getRecentMatchesSchema = z.object({
  limit: z
    .number()
    .int()
    .min(1)
    .max(50)
    .optional()
    .default(5)
    .describe("Maximum number of matches to return (default: 5)"),
  status: matchStatusEnum
    .optional()
    .describe("Filter by match status: SCHEDULED, COMPLETED, or ABANDONED"),
});

// ============================================================================
// Tool Declarations
// ============================================================================

export const MCP_TOOLS: Tool[] = [
  {
    name: "get_dashboard_summary",
    description:
      "Get high-level Panenka statistics including registered/active/archived player totals, completed match count, aggregate goals/assists/contributions, top scorer, top assister, most contributions, best goals per appearance, and recent activity.",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "search_players",
    description:
      "Search registered players with basic statistics including appearances, goals, assists, and contributions. Supports filtering by name query, position, and team.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search term matching player full name or display name",
        },
        position: {
          type: "string",
          enum: [
            "GK",
            "CB",
            "LB",
            "RB",
            "CDM",
            "CM",
            "CAM",
            "LW",
            "RW",
            "ST",
            "UNKNOWN",
          ],
          description: "Filter by player position",
        },
        team: {
          type: "string",
          description: "Filter by team name",
        },
        limit: {
          type: "number",
          description: "Maximum number of players to return (default: 10)",
        },
      },
    },
  },
  {
    name: "get_player_profile",
    description:
      "Retrieve comprehensive player profile including core statistics, rate metrics, milestone breakdowns (braces, hat-tricks, multi-assists), recent form, and match performance history.",
    inputSchema: {
      type: "object",
      properties: {
        playerId: {
          type: "string",
          description: "The unique ID (CUID) of the player",
        },
      },
      required: ["playerId"],
    },
  },
  {
    name: "get_goal_assist_breakdown",
    description:
      "Get milestone rankings (Hat-trick Kings, Brace Masters, Assists per appearance) and the full player breakdown table with single/multi goal and assist counts.",
    inputSchema: {
      type: "object",
      properties: {
        position: {
          type: "string",
          enum: [
            "GK",
            "CB",
            "LB",
            "RB",
            "CDM",
            "CM",
            "CAM",
            "LW",
            "RW",
            "ST",
            "UNKNOWN",
          ],
          description: "Filter by player position",
        },
        competitionId: {
          type: "string",
          description: "Filter by competition ID",
        },
        team: {
          type: "string",
          description: "Filter by team name",
        },
        minAppearances: {
          type: "number",
          description: "Minimum appearances threshold for rate calculations",
        },
        sortBy: {
          type: "string",
          description:
            "Sort column (goals, assists, appearances, braces, hatTricks, singleGoalMatches, etc.)",
        },
        sortOrder: {
          type: "string",
          enum: ["asc", "desc"],
          description: "Sort direction: 'asc' or 'desc' (default: 'desc')",
        },
        page: {
          type: "number",
          description: "Page number (1-indexed)",
        },
        pageSize: {
          type: "number",
          description: "Number of items per page (default: 10)",
        },
      },
    },
  },
  {
    name: "compare_players",
    description:
      "Conduct a head-to-head statistical comparison between 2 or 3 players. Includes side-by-side metrics, category leaders, recent form, and sample size / appearance disparity notes.",
    inputSchema: {
      type: "object",
      properties: {
        playerIds: {
          type: "array",
          items: { type: "string" },
          minItems: 2,
          maxItems: 3,
          description: "Array of 2 or 3 player IDs to compare",
        },
      },
      required: ["playerIds"],
    },
  },
  {
    name: "get_recent_matches",
    description:
      "Retrieve recent matches with match details, scores, competition, and goalscorers.",
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          description: "Maximum number of matches to return (default: 5)",
        },
        status: {
          type: "string",
          enum: ["SCHEDULED", "COMPLETED", "ABANDONED"],
          description: "Filter by match status",
        },
      },
    },
  },
];

// ============================================================================
// Formatting Helpers
// ============================================================================

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "-";
  const d = new Date(date);
  return isNaN(d.getTime()) ? "-" : d.toISOString().split("T")[0]!;
}

function formatRate(value: number | null | undefined): string {
  if (value === null || value === undefined) return "N/A";
  return value.toFixed(2);
}

// ============================================================================
// Tool Execution Handlers
// ============================================================================

export async function executeGetDashboardSummary(): Promise<CallToolResult> {
  const summary = await getDashboardSummary();

  const lines: string[] = [
    "# Panenka Statistics Dashboard Summary",
    "",
    "## Overall Metrics",
    `- **Registered Players**: ${summary.totalPlayers.registered} (${summary.totalPlayers.active} active, ${summary.totalPlayers.archived} archived)`,
    `- **Completed Matches**: ${summary.totalMatches}`,
    `- **Total Goals**: ${summary.totalGoals}`,
    `- **Total Assists**: ${summary.totalAssists}`,
    `- **Total Goal Contributions (G+A)**: ${summary.totalContributions}`,
    "",
    "## Leaderboard Highlights",
  ];

  if (summary.leaderboard.topScorer[0]) {
    const s = summary.leaderboard.topScorer[0];
    lines.push(
      `- **Top Scorer**: ${s.fullName} (${s.value} goals in ${s.appearances} apps, ${formatRate(s.stats.goalsPerAppearance)} G/App)`,
    );
  }
  if (summary.leaderboard.topAssister[0]) {
    const a = summary.leaderboard.topAssister[0];
    lines.push(
      `- **Top Assister**: ${a.fullName} (${a.value} assists in ${a.appearances} apps, ${formatRate(a.stats.assistsPerAppearance)} A/App)`,
    );
  }
  if (summary.leaderboard.mostContributions[0]) {
    const c = summary.leaderboard.mostContributions[0];
    lines.push(
      `- **Most Goal Contributions**: ${c.fullName} (${c.value} G+A in ${c.appearances} apps [${c.stats.goals}G, ${c.stats.assists}A])`,
    );
  }
  if (summary.bestGoalsPerAppearance) {
    const b = summary.bestGoalsPerAppearance;
    lines.push(
      `- **Best Goals Per Appearance**: ${b.player.fullName} (${formatRate(b.rate)} G/App, ${b.goals} goals in ${b.appearances} apps)`,
    );
  }

  if (summary.leaderboard.topScorer.length > 0) {
    lines.push(
      "",
      "### Top Scorers",
      "| Rank | Player | Pos | Team | Goals | Apps | G/App |",
      "| --- | --- | --- | --- | --- | --- | --- |",
    );
    summary.leaderboard.topScorer.slice(0, 5).forEach((entry, idx) => {
      lines.push(
        `| ${idx + 1} | ${entry.fullName} | ${entry.position} | ${entry.team ?? "-"} | ${entry.value} | ${entry.appearances} | ${formatRate(entry.stats.goalsPerAppearance)} |`,
      );
    });
  }

  if (summary.leaderboard.topAssister.length > 0) {
    lines.push(
      "",
      "### Top Assisters",
      "| Rank | Player | Pos | Team | Assists | Apps | A/App |",
      "| --- | --- | --- | --- | --- | --- | --- |",
    );
    summary.leaderboard.topAssister.slice(0, 5).forEach((entry, idx) => {
      lines.push(
        `| ${idx + 1} | ${entry.fullName} | ${entry.position} | ${entry.team ?? "-"} | ${entry.value} | ${entry.appearances} | ${formatRate(entry.stats.assistsPerAppearance)} |`,
      );
    });
  }

  if (summary.recentActivity.recentMatches.length > 0) {
    lines.push(
      "",
      "### Recent Matches",
      "| Date | Opponent | Score | Venue | Status | Scorers |",
      "| --- | --- | --- | --- | --- | --- |",
    );
    for (const m of summary.recentActivity.recentMatches) {
      const score =
        m.scoreHome !== null && m.scoreAway !== null
          ? `${m.scoreHome} - ${m.scoreAway}`
          : "-";
      const scorers =
        m.performances
          ?.filter((p) => p.goals > 0)
          .map((p) => `${p.player.displayName ?? p.player.fullName} (${p.goals})`)
          .join(", ") || "None";
      lines.push(
        `| ${formatDate(m.date)} | ${m.opponent} | ${score} | ${m.venue ?? "-"} | ${m.status} | ${scorers} |`,
      );
    }
  }

  return {
    content: [{ type: "text", text: lines.join("\n") }],
  };
}

export async function executeSearchPlayers(
  args: z.infer<typeof searchPlayersSchema>,
): Promise<CallToolResult> {
  const result = await getPlayers({
    search: args.query,
    position: args.position,
    team: args.team,
    pageSize: args.limit ?? 10,
    page: 1,
  });

  const lines: string[] = [
    "# Player Search Results",
    "",
    `Found ${result.total} player(s) (showing ${result.data.length}):`,
    "",
  ];

  if (result.data.length === 0) {
    lines.push("No matching players found.");
  } else {
    lines.push(
      "| ID | Name | Pos | Team | Apps | Goals | Assists | G+A | G/App | A/App |",
      "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |",
    );
    for (const p of result.data) {
      lines.push(
        `| ${p.id} | ${p.fullName}${p.displayName ? ` (${p.displayName})` : ""} | ${p.position} | ${p.team ?? "-"} | ${p.stats.appearances} | ${p.stats.goals} | ${p.stats.assists} | ${p.stats.goalContributions} | ${formatRate(p.stats.goalsPerAppearance)} | ${formatRate(p.stats.assistsPerAppearance)} |`,
      );
    }
  }

  return {
    content: [{ type: "text", text: lines.join("\n") }],
  };
}

export async function executeGetPlayerProfile(
  args: z.infer<typeof getPlayerProfileSchema>,
): Promise<CallToolResult> {
  const player = await getPlayerById(args.playerId);
  if (!player) {
    return {
      content: [
        {
          type: "text",
          text: `Player with ID "${args.playerId}" was not found.`,
        },
      ],
      isError: true,
    };
  }

  const started = player.matches.filter(
    (m) => m.appearanceStatus === "STARTED",
  ).length;
  const sub = player.matches.filter(
    (m) => m.appearanceStatus === "SUBSTITUTE_USED",
  ).length;
  const unused = player.matches.filter(
    (m) =>
      m.appearanceStatus === "UNUSED_SUBSTITUTE" ||
      m.appearanceStatus === "DID_NOT_PLAY",
  ).length;

  const hasMinutes = player.matches.some((m) => m.minutesPlayed !== null);
  const totalMinutes = hasMinutes
    ? player.matches.reduce((sum, m) => sum + (m.minutesPlayed ?? 0), 0)
    : null;
  const minutesPerGoal =
    hasMinutes && totalMinutes && player.stats.goals > 0
      ? (totalMinutes / player.stats.goals).toFixed(1)
      : null;
  const minutesPerAssist =
    hasMinutes && totalMinutes && player.stats.assists > 0
      ? (totalMinutes / player.stats.assists).toFixed(1)
      : null;
  const minutesPerContribution =
    hasMinutes && totalMinutes && player.stats.goalContributions > 0
      ? (totalMinutes / player.stats.goalContributions).toFixed(1)
      : null;

  const totalMultiGoals =
    player.goalBreakdown.braces +
    player.goalBreakdown.hatTricks +
    player.goalBreakdown.fourGoalMatches +
    player.goalBreakdown.fiveOrMoreGoalMatches;

  const totalMultiAssists =
    player.assistBreakdown.twoAssistMatches +
    player.assistBreakdown.threeAssistMatches +
    player.assistBreakdown.fourOrMoreAssistMatches;

  const recentGoalsPerApp =
    player.recentForm.sampleSize > 0
      ? (player.recentForm.goals / player.recentForm.sampleSize).toFixed(2)
      : "0.00";
  const recentAssistsPerApp =
    player.recentForm.sampleSize > 0
      ? (player.recentForm.assists / player.recentForm.sampleSize).toFixed(2)
      : "0.00";

  const lines: string[] = [
    `# Player Profile: ${player.fullName}${player.displayName ? ` ("${player.displayName}")` : ""}`,
    "",
    "## Personal & Squad Details",
    `- **ID**: ${player.id}`,
    `- **Position**: ${player.position}`,
    `- **Team**: ${player.team ?? "Unassigned"}`,
    `- **Squad Number**: ${player.squadNumber ?? "None"}`,
    `- **Preferred Foot**: ${player.preferredFoot}`,
    `- **Nationality**: ${player.nationality ?? "Not specified"}`,
    `- **Status**: ${player.archivedAt ? `Archived on ${formatDate(player.archivedAt)}` : "Active"}`,
    "",
    "## Career Performance Statistics",
    `- **Appearances**: ${player.stats.appearances} (${started} started, ${sub} substitute, ${unused} unused)`,
    `- **Total Minutes**: ${totalMinutes !== null ? totalMinutes : "N/A"}`,
    `- **Goals**: ${player.stats.goals} (${formatRate(player.stats.goalsPerAppearance)} per app${minutesPerGoal ? `, ${minutesPerGoal} mins/goal` : ""})`,
    `- **Assists**: ${player.stats.assists} (${formatRate(player.stats.assistsPerAppearance)} per app${minutesPerAssist ? `, ${minutesPerAssist} mins/assist` : ""})`,
    `- **Goal Contributions**: ${player.stats.goalContributions} (${formatRate(player.stats.contributionsPerAppearance)} per app${minutesPerContribution ? `, ${minutesPerContribution} mins/contribution` : ""})`,
    "",
    "## Goal Milestone Breakdown",
    `- **1-Goal Matches**: ${player.goalBreakdown.singleGoalMatches}`,
    `- **Braces (2 Goals)**: ${player.goalBreakdown.braces}`,
    `- **Hat-Tricks (3 Goals)**: ${player.goalBreakdown.hatTricks}`,
    `- **4-Goal Matches**: ${player.goalBreakdown.fourGoalMatches}`,
    `- **5+ Goal Matches**: ${player.goalBreakdown.fiveOrMoreGoalMatches}`,
    `- **Total Multi-Goal Matches**: ${totalMultiGoals}`,
    "",
    "## Assist Milestone Breakdown",
    `- **1-Assist Matches**: ${player.assistBreakdown.singleAssistMatches}`,
    `- **2-Assist Matches**: ${player.assistBreakdown.twoAssistMatches}`,
    `- **3-Assist Matches**: ${player.assistBreakdown.threeAssistMatches}`,
    `- **4+ Assist Matches**: ${player.assistBreakdown.fourOrMoreAssistMatches}`,
    `- **Total Multi-Assist Matches**: ${totalMultiAssists}`,
    "",
    `## Recent Form (Last ${player.recentForm.sampleSize} Appearances)`,
    `- **Goals**: ${player.recentForm.goals} (${recentGoalsPerApp} per app)`,
    `- **Assists**: ${player.recentForm.assists} (${recentAssistsPerApp} per app)`,
    `- **Goal Contributions**: ${player.recentForm.goalContributions}`,
    "",
    `## Match History (${player.matches.length} Total Matches)`,
  ];

  if (player.matches.length === 0) {
    lines.push("No match records found.");
  } else {
    lines.push(
      "| Date | Opponent | Score | Venue | Status | Min | Goals | Assists | Appearance |",
      "| --- | --- | --- | --- | --- | --- | --- | --- | --- |",
    );
    for (const m of player.matches) {
      const score =
        m.match.scoreHome !== null && m.match.scoreAway !== null
          ? `${m.match.scoreHome} - ${m.match.scoreAway}`
          : "-";
      lines.push(
        `| ${formatDate(m.match.date)} | ${m.match.opponent} | ${score} | ${m.match.venue ?? "-"} | ${m.match.status} | ${m.minutesPlayed ?? "-"} | ${m.goals} | ${m.assists} | ${m.appearanceStatus} |`,
      );
    }
  }

  return {
    content: [{ type: "text", text: lines.join("\n") }],
  };
}

export async function executeGetGoalAssistBreakdown(
  args: z.infer<typeof getGoalAssistBreakdownSchema>,
): Promise<CallToolResult> {
  const result = await getGoalAssistBreakdown({
    position: args.position,
    competitionId: args.competitionId,
    team: args.team,
    minAppearances: args.minAppearances,
    sortBy: args.sortBy,
    sortOrder: args.sortOrder,
    page: args.page,
    pageSize: args.pageSize,
  });

  const lines: string[] = [
    "# Goal & Assist Breakdown",
    "",
    "## Hat-Trick Kings (3+ Goals in a Single Match)",
  ];

  if (result.hatTrickKings.length === 0) {
    lines.push("No players with hat-tricks found under current filters.");
  } else {
    lines.push(
      "| Player | Pos | Team | Hat-Tricks (3) | 4-Goal | 5+ Goal | Total Multi | Apps | Total Goals |",
      "| --- | --- | --- | --- | --- | --- | --- | --- | --- |",
    );
    for (const k of result.hatTrickKings) {
      lines.push(
        `| ${k.player.fullName} | ${k.player.position} | ${k.player.team ?? "-"} | ${k.hatTricks} | ${k.fourGoalMatches} | ${k.fiveOrMoreGoalMatches} | ${k.totalMultiGoalMatches} | ${k.appearances} | ${k.goals} |`,
      );
    }
  }

  lines.push("", "## Brace Masters (2 Goals in a Single Match)");
  if (result.braceMasters.length === 0) {
    lines.push("No players with braces found under current filters.");
  } else {
    lines.push(
      "| Player | Pos | Team | Braces | Apps | Total Goals |",
      "| --- | --- | --- | --- | --- | --- |",
    );
    for (const b of result.braceMasters) {
      lines.push(
        `| ${b.player.fullName} | ${b.player.position} | ${b.player.team ?? "-"} | ${b.braces} | ${b.appearances} | ${b.goals} |`,
      );
    }
  }

  lines.push("", "## Assists Per Appearance Leaders (Rate Ranking)");
  if (result.assistsRanking.length === 0) {
    lines.push("No qualifying players for assist rate rankings.");
  } else {
    lines.push(
      "| Player | Pos | Team | Assists/App | Total Assists | Apps | 1-Ast Matches | 2+ Ast Matches |",
      "| --- | --- | --- | --- | --- | --- | --- | --- |",
    );
    for (const a of result.assistsRanking) {
      const multi =
        a.breakdown.twoAssistMatches +
        a.breakdown.threeAssistMatches +
        a.breakdown.fourOrMoreAssistMatches;
      lines.push(
        `| ${a.player.fullName} | ${a.player.position} | ${a.player.team ?? "-"} | ${formatRate(a.assistsPerAppearance)} | ${a.assists} | ${a.appearances} | ${a.breakdown.singleAssistMatches} | ${multi} |`,
      );
    }
  }

  lines.push(
    "",
    `## Breakdown Table (Page ${result.table.page} of ${result.table.totalPages}, Total Players: ${result.table.total})`,
    "| Player | Pos | Team | Apps | Goals | Solo (1G) | Braces (2G) | Hat-Tricks+ | Assists | 1 Ast | Multi-Ast | G+A |",
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |",
  );

  for (const row of result.table.data) {
    const hatTricksPlus =
      row.goalBreakdown.hatTricks +
      row.goalBreakdown.fourGoalMatches +
      row.goalBreakdown.fiveOrMoreGoalMatches;
    const multiAssists =
      row.assistBreakdown.twoAssistMatches +
      row.assistBreakdown.threeAssistMatches +
      row.assistBreakdown.fourOrMoreAssistMatches;
    lines.push(
      `| ${row.player.fullName} | ${row.player.position} | ${row.player.team ?? "-"} | ${row.stats.appearances} | ${row.stats.goals} | ${row.goalBreakdown.singleGoalMatches} | ${row.goalBreakdown.braces} | ${hatTricksPlus} | ${row.stats.assists} | ${row.assistBreakdown.singleAssistMatches} | ${multiAssists} | ${row.stats.goalContributions} |`,
    );
  }

  return {
    content: [{ type: "text", text: lines.join("\n") }],
  };
}

export async function executeComparePlayers(
  args: z.infer<typeof comparePlayersSchema>,
): Promise<CallToolResult> {
  try {
    const comparison = await comparePlayers(args.playerIds);
    const { players, comparison: leaders } = comparison;

    const names = players.map((p) => p.player.fullName).join(" vs ");
    const lines: string[] = [
      `# Head-to-Head Comparison: ${names}`,
      "",
      "## Overview & Key Metrics",
    ];

    const headers = ["Metric", ...players.map((p) => p.player.fullName), "Leader"];
    lines.push(`| ${headers.join(" | ")} |`);
    lines.push(`| ${headers.map(() => "---").join(" | ")} |`);

    const getLeaderName = (leaderId: string | null): string => {
      if (!leaderId) return "Tie / None";
      const p = players.find((x) => x.player.id === leaderId);
      return p ? p.player.fullName : "N/A";
    };

    lines.push(
      `| Position | ${players.map((p) => p.player.position).join(" | ")} | - |`,
    );
    lines.push(
      `| Team | ${players.map((p) => p.player.team ?? "-").join(" | ")} | - |`,
    );
    lines.push(
      `| Preferred Foot | ${players.map((p) => p.player.preferredFoot).join(" | ")} | - |`,
    );
    lines.push(
      `| Appearances | ${players.map((p) => p.stats.appearances).join(" | ")} | ${getLeaderName(leaders.appearances.maxPlayerId)} |`,
    );
    lines.push(
      `| Total Minutes | ${players.map((p) => p.totalMinutes ?? "-").join(" | ")} | - |`,
    );
    lines.push(
      `| Goals | ${players.map((p) => p.stats.goals).join(" | ")} | ${getLeaderName(leaders.goals.maxPlayerId)} |`,
    );
    lines.push(
      `| Assists | ${players.map((p) => p.stats.assists).join(" | ")} | ${getLeaderName(leaders.assists.maxPlayerId)} |`,
    );
    lines.push(
      `| Goal Contributions | ${players.map((p) => p.stats.goalContributions).join(" | ")} | ${getLeaderName(leaders.contributions.maxPlayerId)} |`,
    );
    lines.push(
      `| Goals / Appearance | ${players.map((p) => formatRate(p.stats.goalsPerAppearance)).join(" | ")} | ${getLeaderName(leaders.goalsPerAppearance.maxPlayerId)} |`,
    );
    lines.push(
      `| Assists / Appearance | ${players.map((p) => formatRate(p.stats.assistsPerAppearance)).join(" | ")} | ${getLeaderName(leaders.assistsPerAppearance.maxPlayerId)} |`,
    );
    lines.push(
      `| Braces (2 Goals) | ${players.map((p) => p.goalBreakdown.braces).join(" | ")} | - |`,
    );
    lines.push(
      `| Hat-Tricks (3+ Goals) | ${players.map((p) => p.goalBreakdown.hatTricks + p.goalBreakdown.fourGoalMatches + p.goalBreakdown.fiveOrMoreGoalMatches).join(" | ")} | - |`,
    );
    lines.push(
      `| Multi-Assist Matches | ${players.map((p) => p.assistBreakdown.twoAssistMatches + p.assistBreakdown.threeAssistMatches + p.assistBreakdown.fourOrMoreAssistMatches).join(" | ")} | - |`,
    );
    lines.push(
      `| Recent Form (Last 5 G/A) | ${players.map((p) => `${p.recentForm.goals}G / ${p.recentForm.assists}A in ${p.recentForm.sampleSize} apps`).join(" | ")} | - |`,
    );

    lines.push("", "## Analysis Notes & Sample Size Assessment");

    const minThreshold = 3;
    const lowSamplePlayers = players.filter(
      (p) => p.stats.appearances < minThreshold,
    );
    const appearances = players.map((p) => p.stats.appearances);
    const minApps = Math.min(...appearances);
    const maxApps = Math.max(...appearances);
    const diff = maxApps - minApps;
    const ratio = minApps > 0 ? maxApps / minApps : maxApps > 0 ? 99 : 1;
    const hasDisparity = diff >= 5 || (minApps > 0 && ratio >= 2.0);

    if (lowSamplePlayers.length > 0) {
      lines.push(
        `- ⚠️ **Sample Size Notice**: ${lowSamplePlayers.map((p) => p.player.fullName).join(", ")} has fewer than ${minThreshold} appearances. Per-appearance rate metrics may be volatile or unrepresentative.`,
      );
    }
    if (hasDisparity) {
      lines.push(
        `- ⚠️ **Exposure Disparity Detected**: Appearance difference is ${diff} matches (ranging from ${minApps} to ${maxApps} apps, ratio: ${ratio.toFixed(1)}x). Rate metrics and raw totals should be evaluated with this volume difference in mind.`,
      );
    }
    if (lowSamplePlayers.length === 0 && !hasDisparity) {
      lines.push(
        "- ✅ **Balanced Sample Size**: All compared players meet the eligibility threshold and have comparable appearance exposure for robust head-to-head analysis.",
      );
    }

    const leadersSummary: string[] = [];
    if (leaders.goals.maxPlayerId) {
      leadersSummary.push(
        `**Goals**: ${getLeaderName(leaders.goals.maxPlayerId)} (${leaders.goals.values[leaders.goals.maxPlayerId]})`,
      );
    }
    if (leaders.assists.maxPlayerId) {
      leadersSummary.push(
        `**Assists**: ${getLeaderName(leaders.assists.maxPlayerId)} (${leaders.assists.values[leaders.assists.maxPlayerId]})`,
      );
    }
    if (leaders.contributions.maxPlayerId) {
      leadersSummary.push(
        `**Total Contributions**: ${getLeaderName(leaders.contributions.maxPlayerId)} (${leaders.contributions.values[leaders.contributions.maxPlayerId]})`,
      );
    }
    if (leaders.goalsPerAppearance.maxPlayerId) {
      leadersSummary.push(
        `**Goals/App Rate**: ${getLeaderName(leaders.goalsPerAppearance.maxPlayerId)} (${formatRate(leaders.goalsPerAppearance.values[leaders.goalsPerAppearance.maxPlayerId])})`,
      );
    }
    if (leadersSummary.length > 0) {
      lines.push("", "### Category Leaders Summary", `- ${leadersSummary.join("\n- ")}`);
    }

    return {
      content: [{ type: "text", text: lines.join("\n") }],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error comparing players: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
}

export async function executeGetRecentMatches(
  args: z.infer<typeof getRecentMatchesSchema>,
): Promise<CallToolResult> {
  const result = await getMatches({
    status: args.status,
    pageSize: args.limit ?? 5,
    page: 1,
  });

  const lines: string[] = [
    `# Recent Matches (Showing ${result.data.length} of ${result.total} total matches)`,
    "",
  ];

  if (result.data.length === 0) {
    lines.push("No matches found matching the criteria.");
  } else {
    lines.push(
      "| Date | Opponent | Team | Venue | Score | Status | Competition | Key Scorers |",
      "| --- | --- | --- | --- | --- | --- | --- | --- |",
    );
    for (const m of result.data) {
      const score =
        m.scoreHome !== null && m.scoreAway !== null
          ? `${m.scoreHome} - ${m.scoreAway}`
          : "-";
      const scorers =
        m.summary.scorers.length > 0
          ? m.summary.scorers
              .map((s) => `${s.displayName ?? s.fullName} (${s.goals})`)
              .join(", ")
          : "None";
      lines.push(
        `| ${formatDate(m.date)} | ${m.opponent} | ${m.team ?? "-"} | ${m.venue ?? "-"} | ${score} | ${m.status} | ${m.competition?.name ?? "-"} | ${scorers} |`,
      );
    }

    lines.push("", "## Match Details & Aggregates");
    for (const m of result.data) {
      const score =
        m.scoreHome !== null && m.scoreAway !== null
          ? `${m.scoreHome} - ${m.scoreAway}`
          : "Pending";
      lines.push(
        `### ${formatDate(m.date)}: vs ${m.opponent} (${score})`,
        `- **Status**: ${m.status} | **Venue**: ${m.venue ?? "N/A"}${m.venueName ? ` (${m.venueName})` : ""}`,
        `- **Competition**: ${m.competition ? `${m.competition.name}${m.competition.season ? ` (${m.competition.season})` : ""}` : "Friendly / Non-league"}`,
        `- **Squad Appearances**: ${m.summary.appearancesCount} | **Total Goals**: ${m.summary.totalGoals} | **Total Assists**: ${m.summary.totalAssists}`,
      );
      if (m.summary.scorers.length > 0) {
        lines.push(
          `- **Goalscorers**: ${m.summary.scorers.map((s) => `${s.fullName}: ${s.goals}`).join(", ")}`,
        );
      }
      lines.push("");
    }
  }

  return {
    content: [{ type: "text", text: lines.join("\n") }],
  };
}

// ============================================================================
// Tool Dispatcher
// ============================================================================

export async function handleToolCall(
  name: string,
  args: unknown,
): Promise<CallToolResult> {
  try {
    switch (name) {
      case "get_dashboard_summary": {
        const parsed = getDashboardSummarySchema.safeParse(args ?? {});
        if (!parsed.success) {
          return {
            content: [
              {
                type: "text",
                text: `Invalid parameters for get_dashboard_summary: ${parsed.error.issues.map((i) => i.message).join(", ")}`,
              },
            ],
            isError: true,
          };
        }
        return await executeGetDashboardSummary();
      }

      case "search_players": {
        const parsed = searchPlayersSchema.safeParse(args ?? {});
        if (!parsed.success) {
          return {
            content: [
              {
                type: "text",
                text: `Invalid parameters for search_players: ${parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ")}`,
              },
            ],
            isError: true,
          };
        }
        return await executeSearchPlayers(parsed.data);
      }

      case "get_player_profile": {
        const parsed = getPlayerProfileSchema.safeParse(args ?? {});
        if (!parsed.success) {
          return {
            content: [
              {
                type: "text",
                text: `Invalid parameters for get_player_profile: ${parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ")}`,
              },
            ],
            isError: true,
          };
        }
        return await executeGetPlayerProfile(parsed.data);
      }

      case "get_goal_assist_breakdown": {
        const parsed = getGoalAssistBreakdownSchema.safeParse(args ?? {});
        if (!parsed.success) {
          return {
            content: [
              {
                type: "text",
                text: `Invalid parameters for get_goal_assist_breakdown: ${parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ")}`,
              },
            ],
            isError: true,
          };
        }
        return await executeGetGoalAssistBreakdown(parsed.data);
      }

      case "compare_players": {
        const parsed = comparePlayersSchema.safeParse(args ?? {});
        if (!parsed.success) {
          return {
            content: [
              {
                type: "text",
                text: `Invalid parameters for compare_players: ${parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ")}`,
              },
            ],
            isError: true,
          };
        }
        return await executeComparePlayers(parsed.data);
      }

      case "get_recent_matches": {
        const parsed = getRecentMatchesSchema.safeParse(args ?? {});
        if (!parsed.success) {
          return {
            content: [
              {
                type: "text",
                text: `Invalid parameters for get_recent_matches: ${parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ")}`,
              },
            ],
            isError: true,
          };
        }
        return await executeGetRecentMatches(parsed.data);
      }

      default:
        throw new McpError(ErrorCode.MethodNotFound, `Tool "${name}" not found.`);
    }
  } catch (error) {
    if (error instanceof McpError) {
      throw error;
    }
    return {
      content: [
        {
          type: "text",
          text: `Error executing ${name}: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
}

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createServer } from "../../mcp/server";
import { handleToolCall } from "../../mcp/tools";
import { prisma } from "@/server/db/client";

function getTextContent(result: any): string {
  if (result && typeof result === "object" && "content" in result) {
    const content = result.content;
    if (
      Array.isArray(content) &&
      content[0] &&
      typeof content[0] === "object" &&
      "text" in content[0]
    ) {
      return String((content[0] as { text: unknown }).text);
    }
  }
  return "";
}

describe("Panenka MCP Server", () => {
  let client: Client;
  let clientTransport: InMemoryTransport;
  let serverTransport: InMemoryTransport;
  let samplePlayerId1: string;
  let samplePlayerId2: string;

  beforeAll(async () => {
    // 1. Fetch real sample players from the seeded test database
    const players = await prisma.player.findMany({
      take: 2,
      orderBy: { fullName: "asc" },
      select: { id: true, fullName: true },
    });

    if (players.length >= 2 && players[0] && players[1]) {
      samplePlayerId1 = players[0].id;
      samplePlayerId2 = players[1].id;
    }

    // 2. Setup Server and Client using linked InMemoryTransports
    const server = createServer();
    [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

    await server.connect(serverTransport);

    client = new Client(
      {
        name: "test-client",
        version: "1.0.0",
      },
      {
        capabilities: {},
      },
    );

    await client.connect(clientTransport);
  });

  afterAll(async () => {
    await client?.close();
    await clientTransport?.close();
    await serverTransport?.close();
  });

  // ==========================================================================
  // Tool Listing & Read-Only Role
  // ==========================================================================
  describe("Tool Listing & Security", () => {
    it("should list all 6 required read-only tools", async () => {
      const response = await client.listTools();
      const toolNames = response.tools.map((t) => t.name);

      expect(toolNames).toContain("get_dashboard_summary");
      expect(toolNames).toContain("search_players");
      expect(toolNames).toContain("get_player_profile");
      expect(toolNames).toContain("get_goal_assist_breakdown");
      expect(toolNames).toContain("compare_players");
      expect(toolNames).toContain("get_recent_matches");
      expect(response.tools).toHaveLength(6);
    });

    it("should provide descriptions and valid input schemas for all tools", async () => {
      const response = await client.listTools();

      for (const tool of response.tools) {
        expect(tool.name).toBeTruthy();
        expect(tool.description).toBeTruthy();
        expect(tool.inputSchema).toBeDefined();
        expect(tool.inputSchema.type).toBe("object");
      }
    });

    it("must enforce zero write tools (strictly read-only)", async () => {
      const response = await client.listTools();
      const forbiddenKeywords = [
        "create",
        "update",
        "delete",
        "insert",
        "remove",
        "drop",
        "write",
        "mutate",
        "edit",
        "seed",
        "reset",
      ];

      for (const tool of response.tools) {
        const lowerName = tool.name.toLowerCase();
        for (const forbidden of forbiddenKeywords) {
          expect(lowerName.startsWith(`${forbidden}_`)).toBe(false);
        }
      }
    });
  });

  // ==========================================================================
  // Tool 1: get_dashboard_summary
  // ==========================================================================
  describe("get_dashboard_summary", () => {
    it("should return high-level statistics without arguments", async () => {
      const result = await client.callTool({
        name: "get_dashboard_summary",
        arguments: {},
      });

      expect(result.isError).toBeFalsy();
      expect((result as any).content).toBeDefined();

      const text = getTextContent(result);
      expect(text).toContain("Panenka Statistics Dashboard Summary");
      expect(text).toContain("Registered Players");
      expect(text).toContain("Completed Matches");
      expect(text).toContain("Total Goals");
      expect(text).toContain("Leaderboard Highlights");
    });
  });

  // ==========================================================================
  // Tool 2: search_players
  // ==========================================================================
  describe("search_players", () => {
    it("should search players with limit", async () => {
      const result = await client.callTool({
        name: "search_players",
        arguments: { limit: 5 },
      });

      expect(result.isError).toBeFalsy();
      const text = getTextContent(result);
      expect(text).toContain("Player Search Results");
      expect(text).toContain("| ID | Name | Pos | Team |");
    });

    it("should filter players by position", async () => {
      const result = await client.callTool({
        name: "search_players",
        arguments: { position: "ST", limit: 5 },
      });

      expect(result.isError).toBeFalsy();
      const text = getTextContent(result);
      expect(text).toContain("Player Search Results");
    });

    it("should filter players by query text", async () => {
      const result = await client.callTool({
        name: "search_players",
        arguments: { query: "NonexistentName12345" },
      });

      expect(result.isError).toBeFalsy();
      const text = getTextContent(result);
      expect(text).toContain("No matching players found");
    });
  });

  // ==========================================================================
  // Tool 3: get_player_profile
  // ==========================================================================
  describe("get_player_profile", () => {
    it("should return detailed profile for a valid player", async () => {
      expect(samplePlayerId1).toBeDefined();

      const result = await client.callTool({
        name: "get_player_profile",
        arguments: { playerId: samplePlayerId1 },
      });

      expect(result.isError).toBeFalsy();
      const text = getTextContent(result);
      expect(text).toContain("Player Profile:");
      expect(text).toContain("Career Performance Statistics");
      expect(text).toContain("Goal Milestone Breakdown");
      expect(text).toContain("Assist Milestone Breakdown");
      expect(text).toContain("Recent Form");
    });

    it("should return an error when player is not found", async () => {
      const result = await client.callTool({
        name: "get_player_profile",
        arguments: { playerId: "nonexistent-cuid-999" },
      });

      expect(result.isError).toBe(true);
      const text = getTextContent(result);
      expect(text).toContain("was not found");
    });

    it("should validate that playerId is required", async () => {
      const result = await client.callTool({
        name: "get_player_profile",
        arguments: { playerId: "" },
      });

      expect(result.isError).toBe(true);
      const text = getTextContent(result);
      expect(text).toContain("Invalid parameters for get_player_profile");
    });
  });

  // ==========================================================================
  // Tool 4: get_goal_assist_breakdown
  // ==========================================================================
  describe("get_goal_assist_breakdown", () => {
    it("should return milestone rankings and breakdown table", async () => {
      const result = await client.callTool({
        name: "get_goal_assist_breakdown",
        arguments: { minAppearances: 1, pageSize: 5 },
      });

      expect(result.isError).toBeFalsy();
      const text = getTextContent(result);
      expect(text).toContain("Goal & Assist Breakdown");
      expect(text).toContain("Hat-Trick Kings");
      expect(text).toContain("Brace Masters");
      expect(text).toContain("Assists Per Appearance Leaders");
      expect(text).toContain("Breakdown Table");
    });

    it("should handle filtering by position", async () => {
      const result = await client.callTool({
        name: "get_goal_assist_breakdown",
        arguments: { position: "ST" },
      });

      expect(result.isError).toBeFalsy();
      const text = getTextContent(result);
      expect(text).toContain("Goal & Assist Breakdown");
    });
  });

  // ==========================================================================
  // Tool 5: compare_players
  // ==========================================================================
  describe("compare_players", () => {
    it("should return head-to-head comparison for 2 players", async () => {
      expect(samplePlayerId1).toBeDefined();
      expect(samplePlayerId2).toBeDefined();

      const result = await client.callTool({
        name: "compare_players",
        arguments: { playerIds: [samplePlayerId1, samplePlayerId2] },
      });

      expect(result.isError).toBeFalsy();
      const text = getTextContent(result);
      expect(text).toContain("Head-to-Head Comparison");
      expect(text).toContain("Overview & Key Metrics");
      expect(text).toContain("Analysis Notes & Sample Size Assessment");
    });

    it("should reject comparison with fewer than 2 players", async () => {
      const result = await client.callTool({
        name: "compare_players",
        arguments: { playerIds: [samplePlayerId1] },
      });

      expect(result.isError).toBe(true);
      const text = getTextContent(result);
      expect(text).toContain("Invalid parameters for compare_players");
    });

    it("should reject comparison with more than 3 players", async () => {
      const result = await client.callTool({
        name: "compare_players",
        arguments: { playerIds: ["id1", "id2", "id3", "id4"] },
      });

      expect(result.isError).toBe(true);
      const text = getTextContent(result);
      expect(text).toContain("Invalid parameters for compare_players");
    });
  });

  // ==========================================================================
  // Tool 6: get_recent_matches
  // ==========================================================================
  describe("get_recent_matches", () => {
    it("should return recent matches with scores and goalscorers", async () => {
      const result = await client.callTool({
        name: "get_recent_matches",
        arguments: { limit: 3 },
      });

      expect(result.isError).toBeFalsy();
      const text = getTextContent(result);
      expect(text).toContain("Recent Matches");
      expect(text).toContain("| Date | Opponent | Team | Venue | Score | Status |");
    });

    it("should filter matches by status", async () => {
      const result = await client.callTool({
        name: "get_recent_matches",
        arguments: { status: "COMPLETED", limit: 2 },
      });

      expect(result.isError).toBeFalsy();
      const text = getTextContent(result);
      expect(text).toContain("Recent Matches");
    });
  });

  // ==========================================================================
  // Error Handling
  // ==========================================================================
  describe("Error Handling", () => {
    it("should return method not found when calling an unregistered tool", async () => {
      await expect(
        client.callTool({
          name: "non_existent_tool",
          arguments: {},
        }),
      ).rejects.toThrow();
    });

    it("should validate invalid argument types safely", async () => {
      const result = await handleToolCall("search_players", {
        limit: "invalid_limit_string",
      });

      expect(result.isError).toBe(true);
      const text = getTextContent(result);
      expect(text).toContain("Invalid parameters for search_players");
    });
  });
});

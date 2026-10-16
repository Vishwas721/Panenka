import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { MCP_TOOLS, handleToolCall } from "./tools";

/**
 * Creates and configures the Panenka Model Context Protocol (MCP) server.
 * Registered with tools capability and handlers for tool listing and execution.
 */
export function createServer(): Server {
  const server = new Server(
    {
      name: "panenka",
      version: "0.1.0",
    },
    {
      capabilities: {
        tools: {},
      },
      instructions:
        "Panenka MCP Server provides read-only football (soccer) statistics, player profiles, milestone rankings, and match results. All data is fetched from the local Panenka database.",
    },
  );

  // Register tools list handler
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: MCP_TOOLS,
    };
  });

  // Register tool execution handler
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    return await handleToolCall(name, args);
  });

  return server;
}

/**
 * Starts the Panenka MCP server connected to stdio transport.
 */
export async function main(): Promise<void> {
  const server = createServer();
  const transport = new StdioServerTransport();

  // All logs MUST be directed to stderr; stdout is reserved for JSON-RPC messages
  console.error("Starting Panenka MCP Server (read-only)...");
  await server.connect(transport);
  console.error("Panenka MCP Server connected and listening on stdio.");
}

// Auto-run if executed as script
const isDirectExecution =
  typeof process !== "undefined" &&
  process.argv[1] &&
  (process.argv[1].endsWith("server.ts") ||
    process.argv[1].endsWith("server.js") ||
    process.argv[1].includes("mcp/server") ||
    process.argv[1].includes("mcp\\server"));

if (isDirectExecution) {
  main().catch((error) => {
    console.error("Fatal error starting Panenka MCP Server:", error);
    process.exit(1);
  });
}

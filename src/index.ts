#!/usr/bin/env node
/**
 * Process entry point — Testnet Wallet Agent MCP Server
 *
 * LIFECYCLE
 * ---------
 * 1. Claude Desktop spawns: node dist/index.js
 * 2. main() creates McpServer + StdioServerTransport
 * 3. server.connect(transport) listens on stdin, writes to stdout
 * 4. Process stays alive until Claude closes the pipe or SIGINT
 *
 * You run the same file locally with: npm run build && npm start
 */

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createMcpServer } from "./server.js";
import { log } from "./utils/logger.js";

/**
 * Starts the MCP server on stdio transport.
 */
async function main(): Promise<void> {
  const server = createMcpServer();
  const transport = new StdioServerTransport();

  process.on("SIGINT", async () => {
    log.info("Shutting down (SIGINT)");
    await server.close();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    log.info("Shutting down (SIGTERM)");
    await server.close();
    process.exit(0);
  });

  await server.connect(transport);
  log.info("Testnet Wallet Agent MCP server running on stdio");
}

main().catch((err) => {
  log.error("Fatal startup error", {
    message: err instanceof Error ? err.message : String(err),
  });
  process.exit(1);
});

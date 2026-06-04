#!/usr/bin/env node
/**
 * MCP stdio entry (backward compatible with `npm start` and node dist/index.js).
 * Prefer: testnet-wallet-agent mcp
 */

import { runMcpServer } from "./mcp/run.js";
import { log } from "./utils/logger.js";

main().catch((err) => {
  log.error("Fatal startup error", {
    message: err instanceof Error ? err.message : String(err),
  });
  process.exit(1);
});

async function main(): Promise<void> {
  await runMcpServer();
}

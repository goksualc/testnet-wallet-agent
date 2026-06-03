/**
 * MCP tool: get_wallet_address
 *
 * WHAT MCP TOOLS ARE
 * ------------------
 * Tools are functions Claude can invoke. The host (Claude Desktop) sends
 * tools/call with a name + arguments; your server runs the handler and returns text.
 *
 * This tool has no inputs — it only reads the address derived from PRIVATE_KEY.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ChainWalletProvider } from "../blockchain/types.js";
import { errorResult, jsonResult } from "./helpers.js";

/**
 * Registers get_wallet_address on the MCP server.
 *
 * @param server - McpServer instance from createMcpServer()
 * @param wallet - Chain backend (EVM today)
 */
export function registerGetWalletAddressTool(
  server: McpServer,
  wallet: ChainWalletProvider,
): void {
  server.registerTool(
    "get_wallet_address",
    {
      title: "Get Wallet Address",
      description:
        "Returns the agent's testnet wallet address for the configured chain (e.g. Sepolia).",
      inputSchema: z.object({}),
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
      },
    },
    async () => {
      try {
        const result = await wallet.getWalletAddress();
        return jsonResult(result);
      } catch (err) {
        return errorResult(err instanceof Error ? err.message : String(err));
      }
    },
  );
}

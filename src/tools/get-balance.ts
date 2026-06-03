/**
 * MCP tool: get_balance
 *
 * Reads native ETH balance of the agent wallet via RPC (no transaction sent).
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ChainWalletProvider } from "../blockchain/types.js";
import { errorResult, jsonResult } from "./helpers.js";

/**
 * Registers get_balance on the MCP server.
 *
 * @param server - McpServer instance
 * @param wallet - Chain backend
 */
export function registerGetBalanceTool(
  server: McpServer,
  wallet: ChainWalletProvider,
): void {
  server.registerTool(
    "get_balance",
    {
      title: "Get Balance",
      description:
        "Returns the agent wallet native balance (ETH on EVM testnets) in wei and ether.",
      inputSchema: z.object({}),
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
      },
    },
    async () => {
      try {
        const result = await wallet.getBalance();
        return jsonResult(result);
      } catch (err) {
        return errorResult(err instanceof Error ? err.message : String(err));
      }
    },
  );
}

/**
 * MCP tool: transaction_status
 *
 * After send_testnet_eth, Claude (or the user) can poll this tool with the tx hash
 * to see pending / success / reverted / not_found.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ChainWalletProvider } from "../blockchain/types.js";
import { errorResult, jsonResult } from "./helpers.js";

/**
 * Registers transaction_status on the MCP server.
 *
 * @param server - McpServer instance
 * @param wallet - Chain backend
 */
export function registerTransactionStatusTool(
  server: McpServer,
  wallet: ChainWalletProvider,
): void {
  server.registerTool(
    "transaction_status",
    {
      title: "Transaction Status",
      description:
        "Checks transaction status by hash: pending, success, reverted, or not_found.",
      inputSchema: z.object({
        hash: z.string().describe("Transaction hash (0x...)"),
      }),
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
      },
    },
    async ({ hash }) => {
      try {
        const result = await wallet.getTransactionStatus(hash);
        return jsonResult(result);
      } catch (err) {
        return errorResult(err instanceof Error ? err.message : String(err));
      }
    },
  );
}

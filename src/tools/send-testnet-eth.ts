/**
 * MCP tool: send_testnet_eth
 *
 * This is a "write" tool: it spends testnet ETH and pays gas.
 * annotations.destructiveHint tells clients this mutates external state.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ChainWalletProvider } from "../blockchain/types.js";
import { errorResult, jsonResult } from "./helpers.js";

/**
 * Registers send_testnet_eth on the MCP server.
 *
 * @param server - McpServer instance
 * @param wallet - Chain backend (signs transactions)
 */
export function registerSendTestnetEthTool(
  server: McpServer,
  wallet: ChainWalletProvider,
): void {
  server.registerTool(
    "send_testnet_eth",
    {
      title: "Send Testnet ETH",
      description:
        "Sends native testnet ETH from the agent wallet to a recipient. Only works on configured testnets; amount is capped by MAX_SEND_ETH.",
      inputSchema: z.object({
        to: z.string().describe("Recipient address (0x...)"),
        amount_eth: z
          .string()
          .describe('Amount of ETH to send, e.g. "0.01"'),
      }),
      annotations: {
        destructiveHint: true,
        openWorldHint: true,
      },
    },
    async ({ to, amount_eth }) => {
      try {
        const result = await wallet.sendNative({
          to,
          amountEth: amount_eth,
        });
        return jsonResult(result);
      } catch (err) {
        return errorResult(err instanceof Error ? err.message : String(err));
      }
    },
  );
}

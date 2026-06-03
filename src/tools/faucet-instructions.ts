/**
 * MCP tool: faucet_instructions
 *
 * Does not touch the blockchain — returns URLs and steps so Claude can guide
 * the user to fund the wallet before send_testnet_eth.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ChainWalletProvider } from "../blockchain/types.js";
import { errorResult, jsonResult } from "./helpers.js";

/**
 * Registers faucet_instructions on the MCP server.
 *
 * @param server - McpServer instance
 * @param wallet - Chain backend (for wallet address in response)
 */
export function registerFaucetInstructionsTool(
  server: McpServer,
  wallet: ChainWalletProvider,
): void {
  server.registerTool(
    "faucet_instructions",
    {
      title: "Faucet Instructions",
      description:
        "Returns step-by-step instructions and links for obtaining testnet ETH on the configured chain.",
      inputSchema: z.object({}),
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
      },
    },
    async () => {
      try {
        const result = await wallet.getFaucetInstructions();
        return jsonResult(result);
      } catch (err) {
        return errorResult(err instanceof Error ? err.message : String(err));
      }
    },
  );
}

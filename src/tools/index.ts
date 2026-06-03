/**
 * Registers all MCP tools on the server.
 *
 * Keeping one tool per file makes it easy to learn and test individually.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ChainWalletProvider } from "../blockchain/types.js";
import { registerFaucetInstructionsTool } from "./faucet-instructions.js";
import { registerGetBalanceTool } from "./get-balance.js";
import { registerGetWalletAddressTool } from "./get-wallet-address.js";
import { registerSendTestnetEthTool } from "./send-testnet-eth.js";
import { registerTransactionStatusTool } from "./transaction-status.js";

/**
 * Wires every tool handler to the shared wallet provider.
 *
 * @param server - McpServer from createMcpServer()
 * @param wallet - Single wallet instance shared across tools (same PRIVATE_KEY)
 */
export function registerTools(
  server: McpServer,
  wallet: ChainWalletProvider,
): void {
  registerGetWalletAddressTool(server, wallet);
  registerGetBalanceTool(server, wallet);
  registerSendTestnetEthTool(server, wallet);
  registerTransactionStatusTool(server, wallet);
  registerFaucetInstructionsTool(server, wallet);
}

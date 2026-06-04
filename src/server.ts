/**
 * MCP server assembly.
 *
 * createMcpServer() is the composition root:
 *   env → wallet → tools → McpServer
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getWallet } from "./services/wallet-service.js";
import { registerTools } from "./tools/index.js";

/**
 * Server instructions are sent to MCP clients during initialization.
 * Claude may inject this into context so the model knows how to use tools safely.
 */
const SERVER_INSTRUCTIONS = `Testnet Wallet Agent — local MCP server for EVM testnets only.

Workflow:
1. Call faucet_instructions or get_wallet_address before sending funds.
2. Use get_balance to confirm the wallet is funded.
3. Use send_testnet_eth only for testnet recipients; never mainnet.
4. Use transaction_status to poll a tx hash after send_testnet_eth.

Constraints:
- Operates only on allowlisted testnets (Sepolia, Base Sepolia, Arbitrum Sepolia).
- send_testnet_eth is capped by maxSendEth in ~/.testnet-wallet-agent/config.json or MAX_SEND_ETH in .env.
- Never use real/mainnet funds with this wallet.`;

/**
 * Builds the configured MCP server (tools registered, wallet connected).
 *
 * Called once from index.ts before stdio transport connects.
 *
 * @returns McpServer ready for server.connect(transport)
 */
export function createMcpServer(): McpServer {
  const wallet = getWallet();

  const server = new McpServer(
    {
      name: "testnet-wallet-agent",
      version: "0.2.0",
    },
    {
      instructions: SERVER_INSTRUCTIONS,
    },
  );

  registerTools(server, wallet);

  return server;
}

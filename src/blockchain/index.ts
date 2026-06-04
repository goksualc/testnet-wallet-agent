/**
 * Wallet provider factory.
 *
 * MCP server calls createWalletProvider() once at startup.
 * Today only EVM is wired; Solana will branch here later.
 */

import type { AppConfig } from "../config/user-config.js";
import { EvmWalletProvider } from "./evm/wallet.js";
import type { ChainWalletProvider } from "./types.js";

/**
 * Instantiates the wallet backend for the configured chain family.
 *
 * @param config - Output of getConfig()
 * @returns Object implementing ChainWalletProvider (passed into MCP tools)
 */
export function createWalletProvider(config: AppConfig): ChainWalletProvider {
  return new EvmWalletProvider(config);
}

import { createWalletProvider } from "../blockchain/index.js";
import type { ChainWalletProvider } from "../blockchain/types.js";
import { getConfig } from "../config/env.js";
import { configExists, loadUserConfig, type AppConfig } from "../config/user-config.js";

let cachedWallet: ChainWalletProvider | undefined;

/** Prefer ~/.testnet-wallet-agent/config.json; fall back to .env / process.env. */
export function resolveAppConfig(): AppConfig {
  if (configExists()) {
    return loadUserConfig();
  }
  try {
    return getConfig();
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    throw new Error(
      [
        "No wallet configuration found.",
        "Run: testnet-wallet-agent setup",
        "Config file: ~/.testnet-wallet-agent/config.json",
        `(env fallback failed: ${detail})`,
      ].join("\n"),
    );
  }
}

/** Shared wallet backend for CLI commands and MCP tools. */
export function getWallet(): ChainWalletProvider {
  if (!cachedWallet) {
    cachedWallet = createWalletProvider(resolveAppConfig());
  }
  return cachedWallet;
}

export function resetWalletCache(): void {
  cachedWallet = undefined;
}

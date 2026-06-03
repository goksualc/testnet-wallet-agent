/**
 * Chain configuration for EVM testnets.
 *
 * BLOCKCHAIN BASICS (for this file)
 * -------------------------------
 * - A "chain" is a network (Sepolia, Base Sepolia, etc.).
 * - Each chain has a numeric chainId (e.g. Sepolia = 11155111).
 * - Wallets hold native currency (ETH on these testnets) used to pay gas.
 * - Your server talks to an RPC URL (HTTP JSON-RPC) to read/send transactions.
 *
 * We import official chain definitions from Viem so RPC defaults and chain IDs
 * stay correct and maintained upstream.
 */

import {
  arbitrumSepolia,
  baseSepolia,
  sepolia,
  type Chain,
} from "viem/chains";

/**
 * Human-readable IDs stored in CHAIN env var.
 * These map to Viem chain objects and RPC defaults below.
 */
export type EvmTestnetId = "sepolia" | "base-sepolia" | "arbitrum-sepolia";

/**
 * Discriminator for future multi-family support (EVM vs Solana).
 * Solana devnet will use family "solana" with a different provider implementation.
 */
export type ChainFamily = "evm" | "solana";

/**
 * Everything the EVM wallet layer needs to connect and format responses.
 */
export type EvmChainConfig = {
  family: "evm";
  id: EvmTestnetId;
  chainId: number;
  chain: Chain;
  nativeSymbol: "ETH";
  defaultRpcUrl: string;
  /** Builds a block explorer link for a transaction hash. */
  explorerTxUrl: (hash: string) => string;
  faucetName: string;
};

/** Ethereum Sepolia — default MVP testnet. */
const sepoliaConfig: EvmChainConfig = {
  family: "evm",
  id: "sepolia",
  chainId: sepolia.id,
  chain: sepolia,
  nativeSymbol: "ETH",
  defaultRpcUrl: "https://ethereum-sepolia-rpc.publicnode.com",
  explorerTxUrl: (hash) => `https://sepolia.etherscan.io/tx/${hash}`,
  faucetName: "Sepolia ETH faucets",
};

/** Base L2 Sepolia testnet. */
const baseSepoliaConfig: EvmChainConfig = {
  family: "evm",
  id: "base-sepolia",
  chainId: baseSepolia.id,
  chain: baseSepolia,
  nativeSymbol: "ETH",
  defaultRpcUrl: "https://sepolia.base.org",
  explorerTxUrl: (hash) => `https://sepolia.basescan.org/tx/${hash}`,
  faucetName: "Base Sepolia faucet",
};

/** Arbitrum L2 Sepolia testnet. */
const arbitrumSepoliaConfig: EvmChainConfig = {
  family: "evm",
  id: "arbitrum-sepolia",
  chainId: arbitrumSepolia.id,
  chain: arbitrumSepolia,
  nativeSymbol: "ETH",
  defaultRpcUrl: "https://sepolia-rollup.arbitrum.io/rpc",
  explorerTxUrl: (hash) => `https://sepolia.arbiscan.io/tx/${hash}`,
  faucetName: "Arbitrum Sepolia faucet",
};

/**
 * Registry of all supported EVM testnets.
 * Adding a new testnet = add entry here + env enum in env.ts.
 */
export const EVM_TESTNETS: Record<EvmTestnetId, EvmChainConfig> = {
  sepolia: sepoliaConfig,
  "base-sepolia": baseSepoliaConfig,
  "arbitrum-sepolia": arbitrumSepoliaConfig,
};

/**
 * Production/mainnet chain IDs that must NEVER be used by this agent.
 * Even if someone misconfigures RPC_URL, chainId from Viem chain object
 * is checked against this set and the allowlist in assertTestnetChainId.
 */
export const BLOCKED_CHAIN_IDS = new Set<number>([
  1, // Ethereum mainnet
  8453, // Base mainnet
  42161, // Arbitrum One
  10, // Optimism
  137, // Polygon
  56, // BNB Chain
]);

/**
 * Returns full config for a testnet id from CHAIN env var.
 *
 * @param id - e.g. "sepolia"
 * @throws Never throws — caller should validate id via Zod in env.ts first
 */
export function getEvmTestnet(id: EvmTestnetId): EvmChainConfig {
  return EVM_TESTNETS[id];
}

/**
 * Defense-in-depth: refuse mainnet or unknown chain IDs before any RPC call.
 *
 * @param chainId - Numeric chain id from Viem chain definition
 * @throws Error if mainnet or not in EVM_TESTNETS allowlist
 */
export function assertTestnetChainId(chainId: number): void {
  if (BLOCKED_CHAIN_IDS.has(chainId)) {
    throw new Error(
      `Chain ID ${chainId} is blocked (mainnet/production). Only testnets are allowed.`,
    );
  }
  const allowed = Object.values(EVM_TESTNETS).map((c) => c.chainId);
  if (!allowed.includes(chainId)) {
    throw new Error(
      `Chain ID ${chainId} is not in the allowlist. Supported: ${allowed.join(", ")}`,
    );
  }
}

/**
 * Viem client factory for EVM testnets.
 *
 * VIEM ROLES (two clients)
 * ------------------------
 * 1. PublicClient — read-only: balance, receipts, block number (no private key needed)
 * 2. WalletClient — write: sign and broadcast transactions (needs account/private key)
 *
 * Both share the same HTTP transport (RPC URL).
 */

import {
  createPublicClient,
  createWalletClient,
  http,
  type Account,
  type Hash,
  type PublicClient,
  type WalletClient,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import {
  assertTestnetChainId,
  getEvmTestnet,
  type EvmChainConfig,
} from "../../config/chains.js";
import type { AppConfig } from "../../config/env.js";

/** Bundle of chain metadata + Viem clients used by EvmWalletProvider. */
export type EvmClients = {
  config: EvmChainConfig;
  account: Account;
  publicClient: PublicClient;
  walletClient: WalletClient;
};

/**
 * Builds Viem public and wallet clients from AppConfig.
 *
 * Steps:
 * 1. Resolve chain config from CHAIN env
 * 2. assertTestnetChainId — block mainnet
 * 3. privateKeyToAccount — derive address from PRIVATE_KEY
 * 4. createPublicClient / createWalletClient with http(RPC)
 *
 * @param appConfig - Validated env from getConfig()
 * @returns EvmClients ready for wallet operations
 */
export function createEvmClients(appConfig: AppConfig): EvmClients {
  const chainConfig = getEvmTestnet(appConfig.chain);
  assertTestnetChainId(chainConfig.chainId);

  const rpcUrl = appConfig.rpcUrl ?? chainConfig.defaultRpcUrl;
  const transport = http(rpcUrl);

  const account = privateKeyToAccount(appConfig.privateKey);

  const publicClient = createPublicClient({
    chain: chainConfig.chain,
    transport,
  });

  const walletClient = createWalletClient({
    account,
    chain: chainConfig.chain,
    transport,
  });

  return {
    config: chainConfig,
    account,
    publicClient,
    walletClient,
  };
}

/**
 * Validates and narrows a string to Viem's Hash type (0x + 64 hex).
 *
 * @param hash - User-supplied transaction hash from MCP tool
 * @throws Error if format is invalid
 */
export function parseTxHash(hash: string): Hash {
  if (!/^0x[0-9a-fA-F]{64}$/.test(hash)) {
    throw new Error("Invalid transaction hash format");
  }
  return hash as Hash;
}

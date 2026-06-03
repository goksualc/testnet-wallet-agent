/**
 * Shared types and the ChainWalletProvider interface.
 *
 * WHY AN INTERFACE?
 * -----------------
 * MCP tools should not care whether the backend is EVM or Solana.
 * Each tool calls wallet.getBalance(), wallet.sendNative(), etc.
 * When we add Solana devnet, we only add SolanaWalletProvider — tools stay the same.
 */

import type { Hash } from "viem";

/** Response shape for get_wallet_address MCP tool. */
export type WalletAddressResult = {
  address: string;
  chain: string;
  chainId: number;
};

/** Response shape for get_balance MCP tool. */
export type BalanceResult = {
  address: string;
  balanceWei: string;
  balanceEth: string;
  chain: string;
  chainId: number;
};

/** Response shape for send_testnet_eth MCP tool. */
export type SendEthResult = {
  hash: Hash;
  from: string;
  to: string;
  valueWei: string;
  valueEth: string;
  chain: string;
  chainId: number;
  explorerUrl: string;
};

/**
 * Response shape for transaction_status MCP tool.
 * - pending: broadcast but not in a block yet
 * - success: mined and status ok
 * - reverted: mined but execution failed
 * - not_found: unknown hash on this chain
 */
export type TransactionStatusResult = {
  hash: Hash;
  status: "pending" | "success" | "reverted" | "not_found";
  blockNumber: string | null;
  confirmations: number | null;
  explorerUrl: string;
};

/** Response shape for faucet_instructions MCP tool. */
export type FaucetInstructionsResult = {
  chain: string;
  chainId: number;
  walletAddress: string;
  instructions: string[];
  links: { name: string; url: string }[];
};

/**
 * Contract implemented by EVM (today) and Solana (future) wallet backends.
 *
 * MCP tool handlers depend ONLY on this interface, not on Viem directly.
 */
export interface ChainWalletProvider {
  /** Returns the public address derived from PRIVATE_KEY. */
  getWalletAddress(): Promise<WalletAddressResult>;

  /** Returns native token balance (ETH on EVM testnets). */
  getBalance(): Promise<BalanceResult>;

  /**
   * Sends native currency to another address.
   * @param params.to - Recipient address (0x on EVM)
   * @param params.amountEth - Human-readable decimal string e.g. "0.01"
   */
  sendNative(params: {
    to: string;
    amountEth: string;
  }): Promise<SendEthResult>;

  /**
   * Looks up transaction by hash on the configured chain.
   * @param hash - 0x-prefixed 32-byte transaction hash
   */
  getTransactionStatus(hash: string): Promise<TransactionStatusResult>;

  /** Static faucet guidance for the active chain. */
  getFaucetInstructions(): Promise<FaucetInstructionsResult>;
}

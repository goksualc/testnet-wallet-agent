/**
 * EVM implementation of ChainWalletProvider using Viem.
 *
 * This is where MCP tool calls become real blockchain RPC requests.
 */

import {
  formatEther,
  isAddress,
  parseEther,
  type Address,
  type Hash,
} from "viem";
import type { AppConfig } from "../../config/user-config.js";
import type {
  BalanceResult,
  ChainWalletProvider,
  FaucetInstructionsResult,
  SendEthResult,
  TransactionStatusResult,
  WalletAddressResult,
} from "../types.js";
import { createEvmClients, parseTxHash, type EvmClients } from "./client.js";

/**
 * Human-readable faucet copy per chain.
 * MCP tool faucet_instructions returns this to Claude (no on-chain call).
 */
const FAUCET_LINKS: Record<
  string,
  { instructions: string[]; links: { name: string; url: string }[] }
> = {
  sepolia: {
    instructions: [
      "Create or use the wallet address returned by get_wallet_address.",
      "Request Sepolia ETH from a public faucet (most require signing in or a small captcha).",
      "Wait for the faucet transaction to confirm, then call get_balance to verify funds.",
      "Never send mainnet ETH to this wallet — this agent only operates on testnets.",
    ],
    links: [
      {
        name: "Alchemy Sepolia Faucet",
        url: "https://www.alchemy.com/faucets/ethereum-sepolia",
      },
      {
        name: "Google Cloud Sepolia Faucet",
        url: "https://cloud.google.com/application/web3/faucet/ethereum/sepolia",
      },
      {
        name: "sepoliafaucet.com",
        url: "https://sepoliafaucet.com/",
      },
    ],
  },
  "base-sepolia": {
    instructions: [
      "Use get_wallet_address to obtain your Base Sepolia recipient address.",
      "Fund via the official Coinbase/Base Sepolia faucet (may require wallet connection).",
      "Confirm balance with get_balance before sending transactions.",
    ],
    links: [
      {
        name: "Coinbase Developer Platform Faucet",
        url: "https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet",
      },
      {
        name: "Alchemy Base Sepolia Faucet",
        url: "https://www.alchemy.com/faucets/base-sepolia",
      },
    ],
  },
  "arbitrum-sepolia": {
    instructions: [
      "Use get_wallet_address for your Arbitrum Sepolia address.",
      "Bridge or faucet Sepolia ETH onto Arbitrum Sepolia using a listed faucet.",
      "Verify with get_balance; Arbitrum Sepolia uses ETH for gas.",
    ],
    links: [
      {
        name: "Alchemy Arbitrum Sepolia Faucet",
        url: "https://www.alchemy.com/faucets/arbitrum-sepolia",
      },
      {
        name: "QuickNode Arbitrum Sepolia Faucet",
        url: "https://faucet.quicknode.com/arbitrum/sepolia",
      },
    ],
  },
};

/**
 * EVM wallet backend: signs txs locally, reads state via RPC.
 */
export class EvmWalletProvider implements ChainWalletProvider {
  private readonly clients: EvmClients;
  private readonly appConfig: AppConfig;

  /**
   * @param appConfig - Validated secrets and chain from getConfig()
   */
  constructor(appConfig: AppConfig) {
    this.appConfig = appConfig;
    this.clients = createEvmClients(appConfig);
  }

  /**
   * Derives address from PRIVATE_KEY (via Viem account).
   * Used by MCP tool: get_wallet_address
   */
  async getWalletAddress(): Promise<WalletAddressResult> {
    const { config, account } = this.clients;
    return {
      address: account.address,
      chain: config.id,
      chainId: config.chainId,
    };
  }

  /**
   * Calls eth_getBalance on RPC for our account address.
   * Used by MCP tool: get_balance
   */
  async getBalance(): Promise<BalanceResult> {
    const { config, account, publicClient } = this.clients;
    const balanceWei = await publicClient.getBalance({
      address: account.address,
    });
    return {
      address: account.address,
      balanceWei: balanceWei.toString(),
      balanceEth: formatEther(balanceWei),
      chain: config.id,
      chainId: config.chainId,
    };
  }

  /**
   * Builds, signs, and broadcasts a native ETH transfer; waits for receipt.
   *
   * Safety checks:
   * - Valid recipient address (EIP-55 checksum handled by isAddress)
   * - Positive amount
   * - amount <= MAX_SEND_ETH from env
   *
   * Used by MCP tool: send_testnet_eth
   */
  async sendNative(params: {
    to: string;
    amountEth: string;
  }): Promise<SendEthResult> {
    const { config, account, publicClient, walletClient } = this.clients;

    if (!isAddress(params.to)) {
      throw new Error(`Invalid recipient address: ${params.to}`);
    }

    const amount = Number(params.amountEth);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error("amountEth must be a positive number");
    }
    if (amount > this.appConfig.maxSendEth) {
      throw new Error(
        `amountEth ${amount} exceeds MAX_SEND_ETH cap (${this.appConfig.maxSendEth})`,
      );
    }

    const value = parseEther(params.amountEth);

    const hash = await walletClient.sendTransaction({
      account,
      chain: config.chain,
      to: params.to as Address,
      value,
    });

    // Wait until mined so Claude gets a final status in one tool call
    await publicClient.waitForTransactionReceipt({ hash });

    return {
      hash,
      from: account.address,
      to: params.to,
      valueWei: value.toString(),
      valueEth: params.amountEth,
      chain: config.id,
      chainId: config.chainId,
      explorerUrl: config.explorerTxUrl(hash),
    };
  }

  /**
   * Resolves transaction state: receipt if mined, else mempool, else missing.
   *
   * Used by MCP tool: transaction_status
   */
  async getTransactionStatus(hashInput: string): Promise<TransactionStatusResult> {
    const { config, publicClient } = this.clients;
    const hash: Hash = parseTxHash(hashInput);
    const explorerUrl = config.explorerTxUrl(hash);

    const receipt = await publicClient
      .getTransactionReceipt({ hash })
      .catch(() => null);

    if (receipt) {
      const head = await publicClient.getBlockNumber();
      const confirmations =
        receipt.blockNumber !== null
          ? Number(head - receipt.blockNumber) + 1
          : null;

      return {
        hash,
        status: receipt.status === "success" ? "success" : "reverted",
        blockNumber: receipt.blockNumber.toString(),
        confirmations,
        explorerUrl,
      };
    }

    const tx = await publicClient.getTransaction({ hash }).catch(() => null);
    if (tx) {
      return {
        hash,
        status: "pending",
        blockNumber: tx.blockNumber?.toString() ?? null,
        confirmations: null,
        explorerUrl,
      };
    }

    return {
      hash,
      status: "not_found",
      blockNumber: null,
      confirmations: null,
      explorerUrl,
    };
  }

  /**
   * Returns static faucet URLs and steps (includes current wallet address).
   *
   * Used by MCP tool: faucet_instructions
   */
  async getFaucetInstructions(): Promise<FaucetInstructionsResult> {
    const { config, account } = this.clients;
    const faucet = FAUCET_LINKS[config.id];
    return {
      chain: config.id,
      chainId: config.chainId,
      walletAddress: account.address,
      instructions: faucet.instructions,
      links: faucet.links,
    };
  }
}

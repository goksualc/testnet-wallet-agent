import { confirm, input, password, select } from "@inquirer/prompts";
import type { EvmTestnetId } from "../config/chains.js";
import { configExists, getConfigPath, saveUserConfig } from "../config/user-config.js";

const CHAIN_CHOICES: { name: string; value: EvmTestnetId }[] = [
  { name: "Ethereum Sepolia", value: "sepolia" },
  { name: "Base Sepolia", value: "base-sepolia" },
  { name: "Arbitrum Sepolia", value: "arbitrum-sepolia" },
];

function validatePrivateKey(value: string): boolean | string {
  const normalized = value.trim().startsWith("0x") ? value.trim() : `0x${value.trim()}`;
  if (!/^0x[0-9a-fA-F]{64}$/.test(normalized)) {
    return "Private key must be 0x + 64 hex characters";
  }
  return true;
}

export async function runSetup(): Promise<void> {
  if (configExists()) {
    const overwrite = await confirm({
      message: `Config already exists at ${getConfigPath()}. Overwrite?`,
      default: false,
    });
    if (!overwrite) {
      console.log("Setup cancelled.");
      return;
    }
  }

  console.log("\nTestnet Wallet Agent setup (testnet-only keys)\n");

  const privateKey = await password({
    message: "PRIVATE_KEY",
    mask: "*",
    validate: validatePrivateKey,
  });

  const chain = await select<EvmTestnetId>({
    message: "CHAIN",
    choices: CHAIN_CHOICES,
    default: "sepolia",
  });

  const rpcUrlInput = await input({
    message: "RPC_URL (optional)",
    default: "",
  });

  const maxSendInput = await input({
    message: "MAX_SEND_ETH (default 0.1)",
    default: "0.1",
  });

  const maxSendEth = Number(maxSendInput);
  if (!Number.isFinite(maxSendEth) || maxSendEth <= 0) {
    throw new Error("MAX_SEND_ETH must be a positive number");
  }

  const config = saveUserConfig({
    privateKey,
    chain,
    ...(rpcUrlInput.trim() !== "" ? { rpcUrl: rpcUrlInput.trim() } : {}),
    maxSendEth,
  });

  console.log(`\nSaved: ${getConfigPath()}`);
  console.log(`Chain: ${config.chain} | Cap: ${config.maxSendEth} ETH`);
  console.log("\nNext: testnet-wallet-agent install-claude");
}

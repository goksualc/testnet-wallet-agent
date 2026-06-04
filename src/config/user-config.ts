import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { z } from "zod";
import type { EvmTestnetId } from "./chains.js";

export const CONFIG_DIR = path.join(os.homedir(), ".testnet-wallet-agent");
export const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");

/** Previous CLI beta path — migrated automatically on first load. */
const LEGACY_CONFIG_FILE = path.join(
  os.homedir(),
  ".testnet-wallet-agent-cli",
  "config.json",
);

const fileConfigSchema = z.object({
  privateKey: z
    .string()
    .regex(/^0x[0-9a-fA-F]{64}$/, "Private key must be 0x-prefixed 32-byte hex"),
  chain: z.enum(["sepolia", "base-sepolia", "arbitrum-sepolia"]),
  rpcUrl: z.string().url().optional(),
  maxSendEth: z.number().positive().optional(),
});

export type AppConfig = {
  privateKey: `0x${string}`;
  chain: EvmTestnetId;
  rpcUrl?: string;
  maxSendEth: number;
};

export type UserConfigInput = {
  privateKey: string;
  chain: EvmTestnetId;
  rpcUrl?: string;
  maxSendEth?: number;
};

let cached: AppConfig | undefined;

function normalizePrivateKey(input: string): string {
  const trimmed = input.trim();
  return trimmed.startsWith("0x") ? trimmed : `0x${trimmed}`;
}

function toAppConfig(parsed: z.infer<typeof fileConfigSchema>): AppConfig {
  return {
    privateKey: parsed.privateKey as `0x${string}`,
    chain: parsed.chain,
    maxSendEth: parsed.maxSendEth ?? 0.1,
    ...(parsed.rpcUrl !== undefined ? { rpcUrl: parsed.rpcUrl } : {}),
  };
}

function migrateLegacyConfigIfNeeded(): void {
  if (fs.existsSync(CONFIG_FILE)) return;
  const legacy = fs.existsSync(LEGACY_CONFIG_FILE)
    ? LEGACY_CONFIG_FILE
    : null;
  if (!legacy) return;
  fs.mkdirSync(CONFIG_DIR, { recursive: true, mode: 0o700 });
  fs.copyFileSync(legacy, CONFIG_FILE);
  try {
    fs.chmodSync(CONFIG_FILE, 0o600);
    fs.chmodSync(CONFIG_DIR, 0o700);
  } catch {
    // Best-effort on platforms that support chmod.
  }
}

export function configExists(): boolean {
  migrateLegacyConfigIfNeeded();
  return fs.existsSync(CONFIG_FILE);
}

export function getConfigPath(): string {
  return CONFIG_FILE;
}

export function loadUserConfig(): AppConfig {
  if (cached) return cached;
  migrateLegacyConfigIfNeeded();
  if (!fs.existsSync(CONFIG_FILE)) {
    throw new Error(
      `Configuration not found. Run: testnet-wallet-agent setup\nConfig path: ${CONFIG_FILE}`,
    );
  }
  const raw = fs.readFileSync(CONFIG_FILE, "utf8");
  const parsed = fileConfigSchema.safeParse(JSON.parse(raw));
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    throw new Error(`Invalid config at ${CONFIG_FILE}: ${details}`);
  }
  cached = toAppConfig(parsed.data);
  return cached;
}

export function saveUserConfig(input: UserConfigInput): AppConfig {
  const parsed = fileConfigSchema.safeParse({
    privateKey: normalizePrivateKey(input.privateKey),
    chain: input.chain,
    ...(input.rpcUrl !== undefined ? { rpcUrl: input.rpcUrl } : {}),
    ...(input.maxSendEth !== undefined ? { maxSendEth: input.maxSendEth } : {}),
  });
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    throw new Error(`Invalid configuration: ${details}`);
  }
  fs.mkdirSync(CONFIG_DIR, { recursive: true, mode: 0o700 });
  const payload = {
    privateKey: parsed.data.privateKey,
    chain: parsed.data.chain,
    ...(parsed.data.rpcUrl !== undefined ? { rpcUrl: parsed.data.rpcUrl } : {}),
    maxSendEth: parsed.data.maxSendEth ?? 0.1,
  };
  fs.writeFileSync(CONFIG_FILE, `${JSON.stringify(payload, null, 2)}\n`, {
    encoding: "utf8",
    mode: 0o600,
  });
  try {
    fs.chmodSync(CONFIG_FILE, 0o600);
    fs.chmodSync(CONFIG_DIR, 0o700);
  } catch {
    // Best-effort.
  }
  cached = toAppConfig(parsed.data);
  return cached;
}

export function clearConfigCache(): void {
  cached = undefined;
}

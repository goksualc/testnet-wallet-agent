/**
 * Environment variable loading and validation.
 *
 * MCP servers are often started by Claude Desktop with an "env" block in JSON
 * config, OR you run locally with a .env file (dotenv).
 *
 * We use Zod to fail fast at startup with clear errors instead of crashing
 * mid-tool-call with a vague "undefined" error.
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadDotenv } from "dotenv";
import { z } from "zod";
import type { AppConfig } from "./user-config.js";

export type { AppConfig } from "./user-config.js";

/**
 * Load .env from the project root, not process.cwd().
 *
 * If you run `node dist/index.js` from inside `dist/`, cwd is wrong but this
 * path still finds testnet-wallet-agent/.env (compiled file: dist/config/env.js).
 * Variables already set in the shell or Claude Desktop "env" block are not overwritten.
 */
function loadProjectEnv(): void {
  const thisDir = path.dirname(fileURLToPath(import.meta.url));
  const projectRoot = path.resolve(thisDir, "..", "..");
  loadDotenv({ path: path.join(projectRoot, ".env") });
  // Optional: also pick up .env in cwd when you intentionally run elsewhere
  loadDotenv();
}

loadProjectEnv();

/**
 * Schema mirrors .env.example.
 * coerce.number() turns MAX_SEND_ETH string "0.1" into number 0.1.
 */
const envSchema = z.object({
  PRIVATE_KEY: z
    .string()
    .regex(/^0x[0-9a-fA-F]{64}$/, "PRIVATE_KEY must be 0x-prefixed 32-byte hex"),
  CHAIN: z
    .enum(["sepolia", "base-sepolia", "arbitrum-sepolia"])
    .default("sepolia"),
  RPC_URL: z.string().url().optional(),
  MAX_SEND_ETH: z.coerce.number().positive().default(0.1),
});

/** Singleton cache — env is read once per process lifetime. */
let cached: AppConfig | undefined;

/**
 * Reads and validates environment variables.
 *
 * Called once at server startup (createMcpServer). Subsequent calls return cache.
 *
 * @returns AppConfig with private key, chain, optional RPC override, send cap
 * @throws Error listing all Zod validation issues if config is invalid
 */
export function getConfig(): AppConfig {
  if (cached) return cached;

  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    throw new Error(
      [
        `Invalid environment configuration: ${details}`,
        "For global installs, run: testnet-wallet-agent setup",
        "For local dev, copy .env.example to .env in the project root.",
      ].join("\n"),
    );
  }

  cached = {
    privateKey: parsed.data.PRIVATE_KEY as `0x${string}`,
    chain: parsed.data.CHAIN,
    ...(parsed.data.RPC_URL !== undefined
      ? { rpcUrl: parsed.data.RPC_URL }
      : {}),
    maxSendEth: parsed.data.MAX_SEND_ETH,
  };

  return cached;
}

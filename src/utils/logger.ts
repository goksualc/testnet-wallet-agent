/**
 * Logger for MCP stdio servers.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * Claude Desktop (and other MCP hosts) talk to your server over "stdio":
 *   - They WRITE commands to your process stdin
 *   - They READ responses from your process stdout
 *
 * stdout must ONLY carry valid MCP JSON-RPC messages.
 * Any debug print to stdout corrupts the protocol and crashes the session.
 *
 * Therefore every human-readable log line must go to stderr.
 * Node maps console.error() → stderr, which is why we use it here.
 */

/** Optional structured fields appended as JSON (e.g. { chainId: 11155111 }). */
type LogMeta = Record<string, unknown>;

/**
 * Formats one log line with a consistent prefix so you can grep logs easily.
 *
 * @param level   - Severity label (INFO, WARN, ERROR)
 * @param message - Human-readable description
 * @param meta    - Optional key/value context (never put private keys here)
 */
function writeLog(level: string, message: string, meta?: LogMeta): void {
  const suffix = meta !== undefined ? ` ${JSON.stringify(meta)}` : "";
  // console.error → stderr (safe for MCP stdio)
  console.error(`[testnet-wallet-agent] ${level}  ${message}${suffix}`);
}

/**
 * Public logging API used across the project.
 *
 * Usage:
 *   import { log } from "./utils/logger.js";
 *   log.info("Server started");
 *   log.error("RPC failed", { reason: "timeout" });
 */
export const log = {
  /**
   * Informational events: startup, shutdown, non-error milestones.
   * Example: "MCP server connected on stdio"
   */
  info(message: string, meta?: LogMeta): void {
    writeLog("INFO", message, meta);
  },

  /**
   * Recoverable problems: misconfiguration hints, deprecated usage.
   * Example: "RPC URL override in use"
   */
  warn(message: string, meta?: LogMeta): void {
    writeLog("WARN", message, meta);
  },

  /**
   * Failures: startup crashes, unexpected exceptions before tool handlers run.
   * Tool handlers usually return errors to Claude via MCP tool results instead.
   */
  error(message: string, meta?: LogMeta): void {
    writeLog("ERROR", message, meta);
  },
};

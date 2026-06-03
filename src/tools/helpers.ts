/**
 * Helpers for MCP tool handlers.
 *
 * MCP TOOL RESULT FORMAT
 * ----------------------
 * When Claude calls a tool, your handler must return a CallToolResult:
 *   { content: [{ type: "text", text: "..." }], isError?: true }
 *
 * We standardize on JSON text so Claude can parse addresses, balances, hashes.
 */

import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

/**
 * Wraps any JSON-serializable value as a successful MCP tool text response.
 *
 * @param data   - Object returned to Claude (address, balance, tx hash, etc.)
 * @param isError - If true, MCP clients mark the tool call as failed
 */
export function jsonResult(data: unknown, isError = false): CallToolResult {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(data, null, 2),
      },
    ],
    ...(isError ? { isError: true } : {}),
  };
}

/**
 * Convenience for tool failures (invalid input, RPC error, insufficient funds).
 *
 * @param message - Human-readable error string for Claude to relay to the user
 */
export function errorResult(message: string): CallToolResult {
  return jsonResult({ error: message }, true);
}

import { configExists, getConfigPath } from "../config/user-config.js";
import { installClaudeDesktopMcp } from "../utils/claude-desktop.js";

export async function runInstallClaudeCommand(): Promise<void> {
  if (!configExists()) {
    throw new Error(`Run setup first. Expected: ${getConfigPath()}`);
  }
  const { configPath, created, repaired } = installClaudeDesktopMcp();
  if (repaired) {
    console.log("Repaired invalid Claude Desktop config JSON.");
  }
  console.log(created ? "Created" : "Updated", configPath);
  console.log('MCP entry: { "command": "testnet-wallet-agent", "args": ["mcp"] }');
  console.log("Secrets stay in ~/.testnet-wallet-agent/config.json");
  console.log("Restart Claude Desktop.");
}

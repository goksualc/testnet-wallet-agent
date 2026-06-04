import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const SERVER_NAME = "testnet-wallet-agent";

type ClaudeDesktopConfig = {
  mcpServers?: Record<string, { command: string; args?: string[] }>;
  [key: string]: unknown;
};

export function getClaudeDesktopConfigPath(): string {
  const home = os.homedir();
  switch (process.platform) {
    case "darwin":
      return path.join(
        home,
        "Library",
        "Application Support",
        "Claude",
        "claude_desktop_config.json",
      );
    case "win32": {
      const appData = process.env.APPDATA ?? path.join(home, "AppData", "Roaming");
      return path.join(appData, "Claude", "claude_desktop_config.json");
    }
    default:
      return path.join(home, ".config", "Claude", "claude_desktop_config.json");
  }
}

function readClaudeConfig(configPath: string): {
  config: ClaudeDesktopConfig;
  repaired: boolean;
} {
  if (!fs.existsSync(configPath)) {
    return { config: { mcpServers: {} }, repaired: false };
  }

  const raw = fs.readFileSync(configPath, "utf8").trim();
  if (raw === "") {
    return { config: { mcpServers: {} }, repaired: false };
  }

  const attempts = [raw, raw.startsWith("{") ? null : `{${raw}`].filter(
    (value): value is string => value !== null,
  );

  for (const candidate of attempts) {
    try {
      const config = JSON.parse(candidate) as ClaudeDesktopConfig;
      return { config, repaired: candidate !== raw };
    } catch {
      // try next repair strategy
    }
  }

  const backupPath = `${configPath}.backup.${Date.now()}`;
  fs.copyFileSync(configPath, backupPath);
  console.error(
    `Warning: Claude config was invalid JSON. Backed up to:\n  ${backupPath}`,
  );
  return { config: { mcpServers: {} }, repaired: true };
}

export function installClaudeDesktopMcp(): {
  configPath: string;
  created: boolean;
  repaired: boolean;
} {
  const configPath = getClaudeDesktopConfigPath();
  const created = !fs.existsSync(configPath);
  fs.mkdirSync(path.dirname(configPath), { recursive: true });

  const { config, repaired } = readClaudeConfig(configPath);
  if (config.mcpServers === undefined) {
    config.mcpServers = {};
  }

  config.mcpServers[SERVER_NAME] = {
    command: "testnet-wallet-agent",
    args: ["mcp"],
  };

  fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");
  return { configPath, created, repaired };
}

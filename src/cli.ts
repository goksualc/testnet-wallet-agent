#!/usr/bin/env node

import { Command } from "commander";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runAddressCommand } from "./commands/address.js";
import { runBalanceCommand } from "./commands/balance.js";
import { runInstallClaudeCommand } from "./commands/install-claude.js";
import { runMcpCommand } from "./commands/mcp.js";
import { runSendCommand } from "./commands/send.js";
import { runSetup } from "./commands/setup.js";
import { runStatusCommand } from "./commands/status.js";

function version(): string {
  try {
    const dir = path.dirname(fileURLToPath(import.meta.url));
    const pkg = JSON.parse(readFileSync(path.resolve(dir, "..", "package.json"), "utf8")) as {
      version?: string;
    };
    return pkg.version ?? "0.0.0";
  } catch {
    return "0.0.0";
  }
}

function fail(err: unknown): never {
  console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
}

const program = new Command();
program.name("testnet-wallet-agent").description("Testnet wallet CLI + MCP").version(version());

program
  .command("setup")
  .description("Save PRIVATE_KEY and CHAIN to ~/.testnet-wallet-agent/config.json")
  .action(async () => {
    try {
      await runSetup();
    } catch (e) {
      fail(e);
    }
  });

program
  .command("mcp")
  .description("Start MCP server on stdio")
  .action(async () => {
    try {
      await runMcpCommand();
    } catch (e) {
      fail(e);
    }
  });

program
  .command("address")
  .description("Print wallet address")
  .action(async () => {
    try {
      await runAddressCommand();
    } catch (e) {
      fail(e);
    }
  });

program
  .command("balance")
  .description("Print testnet balance")
  .action(async () => {
    try {
      await runBalanceCommand();
    } catch (e) {
      fail(e);
    }
  });

program
  .command("send")
  .description("Send testnet ETH")
  .requiredOption("--to <address>", "Recipient")
  .requiredOption("--amount <eth>", "Amount in ETH")
  .action(async (o: { to: string; amount: string }) => {
    try {
      await runSendCommand(o);
    } catch (e) {
      fail(e);
    }
  });

program
  .command("status")
  .description("Check transaction status")
  .requiredOption("--hash <txHash>", "Transaction hash")
  .action(async (o: { hash: string }) => {
    try {
      await runStatusCommand(o);
    } catch (e) {
      fail(e);
    }
  });

program
  .command("install-claude")
  .description("Add MCP server to Claude Desktop config")
  .action(async () => {
    try {
      await runInstallClaudeCommand();
    } catch (e) {
      fail(e);
    }
  });

program.parseAsync(process.argv).catch(fail);

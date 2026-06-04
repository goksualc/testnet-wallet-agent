# Testnet Wallet Agent

[![npm version](https://img.shields.io/npm/v/testnet-wallet-agent)](https://www.npmjs.com/package/testnet-wallet-agent)
[![Node](https://img.shields.io/node/v/testnet-wallet-agent)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Global **CLI** and **MCP server** for EVM testnets: Sepolia, Base Sepolia, and Arbitrum Sepolia. Use it in your terminal or with Claude Desktop — like a small MoonPay-style wallet tool, focused on testnets only.

> **Testnets only.** Mainnet chain IDs are blocked in code. Use a dedicated testnet private key.

```text
Terminal / Claude  →  testnet-wallet-agent  →  JSON-RPC  →  testnet
```

Your private key never leaves your machine. It is stored in `~/.testnet-wallet-agent/config.json`, not in npm or Claude’s config.

---

## Features

- **Global CLI** — `setup`, `address`, `balance`, `send`, `status`
- **MCP tools** for Claude — balance, send, faucets, tx status
- **One-command Claude setup** — `install-claude` (no manual JSON editing)
- **Shared wallet layer** — CLI and MCP use the same Viem backend

---

## Requirements

- [Node.js 20+](https://nodejs.org/)
- A testnet-only wallet private key (`0x` + 64 hex characters)

---

## Install

### From npm (after publish)

```bash
npm install -g testnet-wallet-agent
```

> **Package not on npm yet?** Use [local install](#local-install-without-npm-registry) below.

### Configure and connect Claude

```bash
testnet-wallet-agent setup
testnet-wallet-agent install-claude
```

Quit and reopen **Claude Desktop**, then start a new chat. You should see the **testnet-wallet-agent** MCP server and its tools.

Verify the CLI:

```bash
testnet-wallet-agent --version
testnet-wallet-agent address
testnet-wallet-agent balance
```

---

## Quick start

| Step | What to run |
|------|-------------|
| 1 | `npm install -g testnet-wallet-agent` |
| 2 | `testnet-wallet-agent setup` — enter private key and chain |
| 3 | `testnet-wallet-agent install-claude` — restart Claude |
| 4 | Fund the wallet (faucets — ask Claude or use public Sepolia faucets) |
| 5 | `testnet-wallet-agent balance` or chat with Claude |

**Generate a new testnet key (recommended):**

```bash
cast wallet new
```

Copy the **Private key** line into `testnet-wallet-agent setup`.

---

## CLI reference

| Command | Description |
|---------|-------------|
| `testnet-wallet-agent setup` | Interactive wizard → `~/.testnet-wallet-agent/config.json` |
| `testnet-wallet-agent mcp` | Start MCP server on stdio (used by Claude) |
| `testnet-wallet-agent address` | Print wallet address |
| `testnet-wallet-agent balance` | Print testnet ETH balance |
| `testnet-wallet-agent send --to <0x> --amount <eth>` | Send testnet ETH |
| `testnet-wallet-agent status --hash <0xTxHash>` | Check transaction status |
| `testnet-wallet-agent install-claude` | Register MCP server in Claude Desktop |

**Examples:**

```bash
testnet-wallet-agent send --to 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0 --amount 0.001
testnet-wallet-agent status --hash 0xabc123...def
```

---

## Configuration

**Default (global install):** `~/.testnet-wallet-agent/config.json` (file mode `600`)

```json
{
  "privateKey": "0xYOUR_64_HEX_CHAR_PRIVATE_KEY",
  "chain": "sepolia",
  "maxSendEth": 0.1
}
```

Optional fields: `rpcUrl` (custom JSON-RPC), `maxSendEth` (per-send cap).

**Supported chains:** `sepolia` (default), `base-sepolia`, `arbitrum-sepolia`

**Config priority**

1. `~/.testnet-wallet-agent/config.json` if it exists  
2. Otherwise `.env` / environment variables (for local development)

---

## Claude Desktop

`install-claude` merges this into `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "testnet-wallet-agent": {
      "command": "testnet-wallet-agent",
      "args": ["mcp"]
    }
  }
}
```

Secrets stay in `~/.testnet-wallet-agent/config.json` — **not** in Claude’s config.

**Example prompts**

| Goal | Say in Claude |
|------|----------------|
| Address | “What is my testnet wallet address?” |
| Fund | “How do I get Sepolia testnet ETH for this wallet?” |
| Balance | “What is my Sepolia balance?” |
| Send | “Send 0.001 testnet ETH to `0x...`” |
| Status | “What is the status of transaction `0x...`?” |

---

## MCP tools

| Tool | Type | Description |
|------|------|-------------|
| `get_wallet_address` | Read | Wallet address on the active chain |
| `get_balance` | Read | Native ETH balance |
| `faucet_instructions` | Read | Faucet steps and URLs |
| `send_testnet_eth` | Write | Send ETH (`to`, `amount_eth`) |
| `transaction_status` | Read | `pending` / `success` / `reverted` / `not_found` |

---

## Local install (without npm registry)

From a git clone:

```bash
git clone https://github.com/goksualc/testnet-wallet-agent.git
cd testnet-wallet-agent
npm install
npm run build
npm link
```

If `npm link` fails with **EACCES** on `/usr/local`:

```bash
npm config set prefix "$HOME/.local"
export PATH="$HOME/.local/bin:$PATH"
# add the export line to ~/.zshrc for new terminals
npm link
```

Install globally from the project directory (no link):

```bash
npm run build
npm install -g .
```

Test exactly what npm users get:

```bash
npm run build
npm pack
npm install -g ./testnet-wallet-agent-0.2.0.tgz
```

### Contributors: `.env` + MCP Inspector

```bash
cp .env.example .env
# edit PRIVATE_KEY, CHAIN, MAX_SEND_ETH
npm run build
npm start              # MCP on stdio (legacy entry)
npm run inspect        # MCP Inspector UI
```

See `.env.example` and `claude_desktop_config.example.json` in this repo.

---

## Development

```text
src/
  cli.ts                 Commander entry (npm global bin)
  index.ts               MCP stdio entry (npm start)
  server.ts              MCP server + tool registration
  commands/              setup, mcp, address, balance, send, status, install-claude
  services/wallet-service.ts   Shared by CLI + MCP
  config/                user-config + .env loader
  blockchain/evm/        Viem wallet + RPC
  tools/                 MCP tool handlers
  mcp/run.ts             Stdio transport
```

| Script | Purpose |
|--------|---------|
| `npm run build` | Compile TypeScript → `dist/` |
| `npm start` | Run MCP server (`dist/index.js`) |
| `npm run dev` | Run CLI from source (`tsx`) |
| `npm run dev:mcp` | Run MCP from source |
| `npm run typecheck` | Typecheck without emit |
| `npm run inspect` | MCP Inspector |
| `npm run pack:check` | Preview publish tarball |
| `npm run publish:public` | `npm publish --access public` |

---

## Publish to npm (maintainers)

```bash
npm login
npm run pack:check
npm publish --access public
```

`prepublishOnly` runs typecheck and build so the published package always includes compiled `dist/`.

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `404` on `npm install -g testnet-wallet-agent` | Not published yet — use `npm link` or `npm install -g .` |
| `permission denied: testnet-wallet-agent` | `npm run build` then reinstall or `npm link` |
| `npm link` EACCES | `npm config set prefix ~/.local` and add `~/.local/bin` to `PATH` |
| `Configuration not found` | Run `testnet-wallet-agent setup` |
| `PRIVATE_KEY: Required` | Run `setup`, or create `.env` for local dev |
| Invalid private key format | Must be `0x` + exactly 64 hex chars |
| Claude shows no tools | `install-claude`, full quit/restart of Claude, check `which testnet-wallet-agent` |
| `install-claude` JSON error | Re-run — repairs configs missing a leading `{` |
| Send fails: insufficient funds | Fund via faucets (`faucet_instructions`), check `balance` |
| Send fails: exceeds cap | Lower `--amount` or raise `maxSendEth` in config |

---

## Safety

- Use a **dedicated testnet key** — never a mainnet wallet with real funds  
- Do not commit `.env` or `~/.testnet-wallet-agent/config.json`  
- Mainnet chain IDs are blocked in code  
- Sends are capped by `maxSendEth` in config (default `0.1`)

---

## Links

- [GitHub](https://github.com/goksualc/testnet-wallet-agent)
- [npm](https://www.npmjs.com/package/testnet-wallet-agent) (after publish)
- [Report issues](https://github.com/goksualc/testnet-wallet-agent/issues)

---

## License

[MIT](LICENSE)

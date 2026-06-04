# Testnet Wallet Agent

A **local wallet assistant** for Claude and your terminal. One package provides a **global CLI** and an **MCP server** with five tools: wallet address, balance, send testnet ETH, transaction status, and faucet instructions.

**Testnets only** — no mainnet. Default network: **Ethereum Sepolia**.

```text
You  →  Claude Desktop  →  MCP  →  testnet-wallet-agent  →  testnet RPC  →  blockchain
```

Claude does **not** store your private key. Config lives on your machine; transactions are signed locally.

---

## Install

```bash
npm install -g testnet-wallet-agent
```

Local development:

```bash
git clone <repo>
cd testnet-wallet-agent
npm install
npm run build
npm link   # if EACCES on /usr/local: npm config set prefix ~/.local
```

---

## Quick start

```bash
testnet-wallet-agent setup
testnet-wallet-agent install-claude
```

Restart Claude Desktop completely.

Config file: `~/.testnet-wallet-agent/config.json` (mode `600`).

Generate a testnet-only key:

```bash
cast wallet new
```

Copy the line labeled **Private key** (it already starts with `0x`) into `.env`.

**Common mistakes**

| Mistake | Fix |
|---------|-----|
| `PRIVATE_KEY: Required` | `.env` missing or wrong path — run commands from project root, or rebuild after updates |
| `must be 0x-prefixed 32-byte hex` | Add `0x`, use only hex digits, exactly 64 chars after `0x`, no quotes, no trailing spaces |
| Key ends with invalid letter (e.g. `X`) | Re-copy from wallet export or generate a new key |

Other variables (defaults are fine for MVP):

| Variable | Example | Purpose |
|----------|---------|---------|
| `CHAIN` | `sepolia` | Network: `sepolia`, `base-sepolia`, or `arbitrum-sepolia` |
| `RPC_URL` | *(optional)* | Custom RPC if public endpoints are slow |
| `MAX_SEND_ETH` | `0.1` | Max ETH per `send_testnet_eth` call |

### 3. Verify the server starts

```bash
npm start
```

**Success** looks like:

```text
[testnet-wallet-agent] INFO  Testnet Wallet Agent MCP server running on stdio
```

The terminal **stays open** and does nothing else — that is correct. The server is waiting for Claude or Inspector to connect. Press `Ctrl+C` to stop.

> **Note:** `npm start` alone does not open a chat UI. Use Claude Desktop or `npm run inspect` below.

---

## Use with Claude Desktop

### 1. Build the project

```bash
npm run build
```

### 2. Edit Claude’s config (macOS)

Open:

`~/Library/Application Support/Claude/claude_desktop_config.json`

Add (merge with existing `mcpServers` if you already have others):

```json
{
  "command": "testnet-wallet-agent",
  "args": ["mcp"]
}
```

Secrets stay in `~/.testnet-wallet-agent/config.json`, not in Claude’s config.

### Example Claude prompts

| Goal | Example |
|------|---------|
| Address | “What is my testnet wallet address?” |
| Fund | “How do I get Sepolia testnet ETH?” |
| Balance | “What is my Sepolia balance?” |
| Send | “Send 0.001 testnet ETH to `0x...`” |
| Status | “Status of transaction `0x...`?” |

---

## Alternative: project `.env` (developers)

For hacking this repo without global config, use a `.env` file:

```bash
cp .env.example .env
# edit PRIVATE_KEY, CHAIN, MAX_SEND_ETH
npm run build
npm start          # MCP on stdio (same as testnet-wallet-agent mcp)
npm run inspect    # MCP Inspector
```

**Config priority:** `~/.testnet-wallet-agent/config.json` if it exists, otherwise `.env` / `process.env`.

---

## MCP tools

| Tool | Read / write | Description |
|------|--------------|-------------|
| `get_wallet_address` | Read | `0x…` address |
| `get_balance` | Read | Balance in wei and ETH |
| `faucet_instructions` | Read | Faucet steps and links |
| `send_testnet_eth` | Write | Send ETH (`to`, `amount_eth`); capped by max send |
| `transaction_status` | Read | `pending` / `success` / `reverted` / `not_found` |

---

## Networks

`sepolia` (default), `base-sepolia`, `arbitrum-sepolia`

**CLI:** `testnet-wallet-agent setup` or edit `~/.testnet-wallet-agent/config.json`  
**`.env`:** set `CHAIN=...` and restart MCP

---

## npm scripts

| Script | Purpose |
|--------|---------|
| `npm run build` | Compile TypeScript → `dist/` |
| `npm start` | MCP stdio (`dist/index.js`, legacy entry) |
| `npm run dev` | CLI from source (`tsx src/cli.ts`) |
| `npm run dev:mcp` | MCP from source |
| `npm run inspect` | MCP Inspector |
| `npm run typecheck` | Typecheck only |

---

## Project layout

```text
src/
  cli.ts              Commander CLI entry (global bin)
  index.ts            MCP stdio entry (npm start)
  server.ts           MCP server + tool registration
  commands/           setup, mcp, address, balance, send, status, install-claude
  services/           wallet-service (shared by CLI + MCP)
  config/             user-config.json + .env loader
  blockchain/evm/     Viem wallet + RPC
  tools/              MCP tool handlers
  mcp/run.ts          Stdio transport lifecycle
```

---

## Safety

- Dedicated **testnet-only** private key
- Never commit `.env` or `~/.testnet-wallet-agent/config.json`
- Mainnet chain IDs blocked in code
- Sends capped by `maxSendEth` / `MAX_SEND_ETH`

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `permission denied: testnet-wallet-agent` | `npm run build` (sets +x on bin), then `npm link` |
| `npm link` EACCES | `npm config set prefix ~/.local`; add `~/.local/bin` to PATH |
| `Configuration not found` | `testnet-wallet-agent setup` |
| `install-claude` JSON error | Re-run — repairs configs missing `{` |
| Claude has no tools | `install-claude`, restart Claude, `which testnet-wallet-agent` |
| `PRIVATE_KEY: Required` (no global config) | Create `.env` or run `setup` |
| Send “insufficient funds” | Use faucets from `faucet_instructions`, check balance |
| Send “exceeds MAX_SEND_ETH” | Lower amount or raise cap in config |

---

## License

MIT

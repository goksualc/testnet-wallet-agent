# Testnet Wallet Agent

A **local wallet assistant** for Claude. It runs on your Mac as a small Node.js program and exposes five **tools** Claude can call: read your testnet address, check balance, send testnet ETH, check a transaction, and explain how to use faucets.

**Testnets only** — no mainnet. Default network: **Ethereum Sepolia**.

---

## What is this?

| Term | Meaning |
|------|---------|
| **MCP** | Model Context Protocol — a standard way for Claude to call functions on your computer |
| **MCP server** | This project (`npm start`) — speaks MCP over stdin/stdout |
| **Wallet agent** | A dedicated crypto wallet whose key lives in `.env` (testnet funds only) |
| **Tool** | One action Claude can run, e.g. `get_balance` |

```text
You  →  Claude Desktop  →  MCP  →  testnet-wallet-agent  →  Sepolia RPC  →  blockchain
```

Claude does **not** store your private key. The MCP server loads it from `.env` (or from Claude’s config `env` block) and signs transactions locally.

---

## What you need

- **Node.js 20+** — check with `node -v`
- A **testnet-only private key** (see below)
- Optional: **Claude Desktop** to chat with the wallet, or **MCP Inspector** to click tools manually

---

## Quick start (5 minutes)

### 1. Install and build

```bash
cd testnet-wallet-agent
npm install
npm run build
```

### 2. Create `.env`

```bash
cp .env.example .env
```

Edit `.env` and set **`PRIVATE_KEY`**. It must look exactly like this:

```bash
PRIVATE_KEY=0x followed by 64 hexadecimal characters (0-9, a-f)
# Total length: 66 characters including 0x
```

**Generate a new testnet key (recommended):**

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
  "mcpServers": {
    "testnet-wallet-agent": {
      "command": "node",
      "args": [
        "/Users/YOUR_USERNAME/CLI/testnet-wallet-agent/dist/index.js"
      ],
      "env": {
        "PRIVATE_KEY": "0xYOUR_64_HEX_CHAR_KEY",
        "CHAIN": "sepolia",
        "MAX_SEND_ETH": "0.1"
      }
    }
  }
}
```

- Replace the path with your **absolute** path to `dist/index.js`.
- You can copy `env` from `.env` or let Claude load only from `.env` by omitting `PRIVATE_KEY` here — if you use Claude’s `env` block, it overrides `.env` for those variables.

See `claude_desktop_config.example.json` in this repo.

### 3. Restart Claude Desktop completely

Quit the app and open it again. In a new chat, you should see **testnet-wallet-agent** and its tools (hammer / tools icon).

### 4. Example things to say in chat

You speak normally; Claude picks the tool.

| Goal | Example prompt |
|------|----------------|
| Address | “What is my testnet wallet address?” |
| Fund | “How do I get Sepolia testnet ETH for this wallet?” |
| Balance | “What is my Sepolia balance?” |
| Send | “Send 0.001 testnet ETH to `0xRecipient...`” |
| Tx status | “What is the status of transaction `0xHash...`?” |

**Suggested first session**

1. Ask for wallet address  
2. Ask for faucet instructions → fund in browser  
3. Ask for balance  
4. Send a small amount (e.g. `0.001` ETH)  
5. Ask for transaction status using the hash from step 4  

---

## Test without Claude (MCP Inspector)

Good for debugging tools one by one.

```bash
npm run build
npm run inspect
```

A browser UI opens. Connect, then run each tool from the list. Ensure `.env` is valid (Inspector runs the same `dist/index.js`).

---

## Tools reference

| Tool name | Read / write | What it does |
|-----------|--------------|--------------|
| `get_wallet_address` | Read | Returns `0x…` address for the configured chain |
| `get_balance` | Read | Balance in wei and ETH |
| `faucet_instructions` | Read | Steps + links to get testnet ETH |
| `send_testnet_eth` | **Write** | Sends ETH; needs `to` and `amount_eth`; respects `MAX_SEND_ETH` |
| `transaction_status` | Read | `pending` / `success` / `reverted` / `not_found` |

**`send_testnet_eth` arguments**

- `to` — recipient `0x` address  
- `amount_eth` — string, e.g. `"0.001"`  

---

## Switch testnet

In `.env` or Claude `env`:

```bash
CHAIN=sepolia           # default
CHAIN=base-sepolia
CHAIN=arbitrum-sepolia
```

Rebuild if needed, restart Claude, fund the wallet on that network’s faucets.

---

## npm scripts

| Command | Purpose |
|---------|---------|
| `npm install` | Install dependencies |
| `npm run build` | Compile TypeScript → `dist/` |
| `npm start` | Run MCP server (stdio) |
| `npm run dev` | Run from `src/` with `tsx` (development) |
| `npm run inspect` | Open MCP Inspector + server |
| `npm run typecheck` | TypeScript check without emit |

---

## Project layout (short)

```text
src/
  index.ts          Entry: stdio transport
  server.ts         Registers MCP tools
  config/           .env validation, chain list
  blockchain/evm/   Viem wallet + RPC
  tools/            One file per MCP tool
```

---

## Safety

- Use a **dedicated testnet key** — never a mainnet wallet with real funds  
- **Never commit** `.env` (it is in `.gitignore`)  
- Mainnet chain IDs are **blocked in code**  
- Each send is capped by **`MAX_SEND_ETH`**  

---

## Troubleshooting

| Symptom | What to do |
|---------|------------|
| `PRIVATE_KEY: Required` | Create/fix `.env` in project root; run `npm run build` after code changes |
| `0x-prefixed 32-byte hex` | Fix key format; use `cast wallet new` |
| `npm start` hangs with no chat | Expected — connect via Claude or Inspector |
| Claude has no tools | Check config path, restart Claude, confirm `dist/index.js` exists |
| Send fails “insufficient funds” | Fund address via `faucet_instructions` links, then `get_balance` |
| Send fails “exceeds MAX_SEND_ETH” | Lower `amount_eth` or raise `MAX_SEND_ETH` in `.env` |

---

## License

MIT

# Testnet Wallet Agent

Local MCP server that gives Claude a **testnet-only** EVM wallet (Viem + Sepolia by default).

## Setup

```bash
cd testnet-wallet-agent
cp .env.example .env
# Edit .env — set a dedicated testnet PRIVATE_KEY
npm install
npm run build
```

## Run locally

```bash
npm start
# Waits for an MCP client on stdio (use Inspector or Claude Desktop)
```

Dev mode (TypeScript without build step):

```bash
npm run dev
```

## Test tools (MCP Inspector)

```bash
npm run build
npm run inspect
```

## Claude Desktop

1. Build: `npm run build`
2. Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (see `claude_desktop_config.example.json`)
3. Use **absolute** path to `dist/index.js` and set `env.PRIVATE_KEY`, `env.CHAIN`
4. Restart Claude Desktop

## MCP tools

| Tool | Description |
|------|-------------|
| `get_wallet_address` | Agent wallet address |
| `get_balance` | Native ETH balance |
| `send_testnet_eth` | Send ETH (capped by `MAX_SEND_ETH`) |
| `transaction_status` | Poll tx by hash |
| `faucet_instructions` | How to get testnet ETH |

## Chains

Set `CHAIN` to `sepolia`, `base-sepolia`, or `arbitrum-sepolia`.

## Safety

- Mainnet chain IDs are blocked in code
- Never commit `.env`
- Use a throwaway testnet key only
# testnet-wallet-agent

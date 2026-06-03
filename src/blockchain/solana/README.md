# Solana Devnet (planned)

Future work will add `SolanaWalletProvider` implementing `ChainWalletProvider`:

- `@solana/web3.js` for devnet RPC
- `SOLANA_PRIVATE_KEY` or keypair path in env
- `CHAIN_FAMILY=solana` in `src/config/env.ts`

MCP tools in `src/tools/` will **not** need renames — only this factory and env schema change.

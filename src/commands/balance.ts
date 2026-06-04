import { getWallet } from "../services/wallet-service.js";

export async function runBalanceCommand(): Promise<void> {
  const r = await getWallet().getBalance();
  console.log(`${r.balanceEth} ETH`);
  console.error(`${r.address} on ${r.chain}`);
}

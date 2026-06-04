import { getWallet } from "../services/wallet-service.js";

export async function runAddressCommand(): Promise<void> {
  const r = await getWallet().getWalletAddress();
  console.log(r.address);
  console.error(`chain: ${r.chain} (${r.chainId})`);
}

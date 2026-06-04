import { getWallet } from "../services/wallet-service.js";

export async function runStatusCommand(options: { hash: string }): Promise<void> {
  console.log(JSON.stringify(await getWallet().getTransactionStatus(options.hash), null, 2));
}

import { getWallet } from "../services/wallet-service.js";

export async function runSendCommand(options: {
  to: string;
  amount: string;
}): Promise<void> {
  const result = await getWallet().sendNative({
    to: options.to,
    amountEth: options.amount,
  });
  console.log(JSON.stringify(result, null, 2));
}

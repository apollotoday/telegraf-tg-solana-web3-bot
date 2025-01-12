import { Keypair } from "@solana/web3.js";
import { primaryRpcConnection } from "./config";
import { closeWallet, sendSol, Sol } from "./solUtils";
import { getDevWallet } from "./testUtils";
import { sleep } from "./utils";

test("close wallet", async () => {
  const devWallet = getDevWallet();
  const testWallet = Keypair.generate();
  console.log("generated test wallet", testWallet.publicKey.toBase58());

  await sendSol({ from: devWallet, to: testWallet.publicKey, amount: Sol.fromSol(0.001) });

  while (true) {
    const balance = await primaryRpcConnection.getBalance(testWallet.publicKey);
    if (balance > 0) {
      console.log("balance received", balance);
      break;
    }
    sleep(1000);
  }

  await closeWallet({ from: testWallet, to: devWallet });
});

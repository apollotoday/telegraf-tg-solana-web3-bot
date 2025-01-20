import { Keypair } from "@solana/web3.js";
import { primaryRpcConnection } from "./config";
import { closeWallet, sendSol, Sol } from "./solUtils";
import { getDevWallet } from "./testUtils";
import { sleep } from "./utils";

test("close wallet", async () => {
  const devWallet = getDevWallet();
  const testWallet = Keypair.generate();
  console.log("generated test wallet", testWallet.publicKey.toBase58());

  const res = await sendSol({ from: devWallet, to: testWallet.publicKey, amount: Sol.fromSol(0.001) });

  console.log("transaction confirmed", !res.confirmedResult.value.err);

  const startTime = Date.now();

  while (true) {
    const balance = await primaryRpcConnection
      .getBalance(testWallet.publicKey, { commitment: "confirmed", 
        // minContextSlot: res.confirmedResult.context.slot 
      })
      .catch((e) => {
        return 0;
      });
    if (balance > 0) {
      console.log(`balance received after ${Date.now() - startTime}ms`, balance);
      break;
    } else {
      console.log("no balance yet, waiting");
    }
    sleep(200);
  }

  await closeWallet({ from: testWallet, to: devWallet });
});

// test("sendSol and check balance", async () => {
//   const devWallet = getDevWallet();
//   const receiverWallet = Keypair.generate();

//   const res = await sendSol({ from: devWallet, to: receiverWallet.publicKey, amount: Sol.fromSol(0.001) });

//   res.confirmedResult.context.slot

// });

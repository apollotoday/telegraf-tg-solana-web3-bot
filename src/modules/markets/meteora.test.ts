import { PublicKey, Keypair, TransactionMessage } from "@solana/web3.js";
import { buySell, buySellVersioned, fakeVolumne, swap } from "./meteora";
import { getDevWallet } from "../../testUtils";
import { sendAndConfirmVersionedTransactionAndRetry, Sol } from "../../solUtils";
import { primaryRpcConnection, meteoraDynPool } from "../../config";
import { measureTime } from "../../utils";
import _ from "lodash";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { sendAndConfirmJitoBundle } from '../../jitoUtils';

let testWallet: Keypair;

// beforeAll(async () => {
//   testWallet = await fundTestWallet({ amount: Sol.fromSol(0.0011) });
// });

// afterAll(async () => {
//   await closeWallet({ from: testWallet, to: getDevWallet().publicKey });
// });

const devWallet = getDevWallet();
const devWallet2 = getDevWallet(2);

test("should buy and sell drew", async () => {
  let failed = 0;
  try {
    const buyRes = await swap({
      inLamports: Sol.fromSol(0.01).lamports,
      feePayer: devWallet,
      swapWallet: devWallet,
      slippage: 50,
      pool: new PublicKey(meteoraDynPool),
    });

    const sellRes = await swap({
      inLamports: buyRes.outAmountLamport * 0.99,
      swapWallet: devWallet,
      feePayer: devWallet,
      slippage: 50,
      pool: new PublicKey(meteoraDynPool),
      type: "sell",
    });

    await sendAndConfirmJitoBundle({
      transactions: [buyRes.swapTx, sellRes.swapTx],
      payer: devWallet,
    });
  } catch (e) {
    console.log(e);
    failed++;
  }
  console.log("failed", failed);
});

test("should buy and sell drew fast", async () => {
  let success = 0;
  for (let i = 0; i < 1; i++) {
    const res = await Promise.all(
      Array.from({ length: 1 }).map(async () => {
        const res = await buySellVersioned({
          swapWallet: devWallet,
          feePayer: devWallet,
          inLamports: Sol.fromSol(_.random(0.0095, 0.0105)).lamports,
          pool: new PublicKey(meteoraDynPool),
          slippage: 500,
        });

        // simulate and log error
        const simRes = await primaryRpcConnection.simulateTransaction(res.buyTx1);
        if (simRes.value.err) {
          console.error("Error in simRes", simRes.value.err);
        }

        return await sendAndConfirmJitoBundle({
          transactions: [
            res.buyTx1,
            // res.sellTx
          ],
          payer: devWallet,
        });
      })
    );

    success += res.filter((r) => r.confirmed).length;
  }

  console.log("res success", success);
});

test("should fake volume", async () => {
  const res = await Promise.all(
    Array.from({ length: 20 }).map(async () => {
      return await fakeVolumne({ wallet: devWallet, amountLamports: Sol.fromSol(0.01).lamports });
    })
  );

  const success = res.filter((r) => r.confirmed).length;

  console.log("success", success);
});

test("ranking bot", async () => {
  let errorCount = 0;

  await Promise.all(
    Array.from({ length: 30 }).map(async () => {
      try {
        const buyRes = await swap({
          swapWallet: devWallet,
          feePayer: devWallet,
          inLamports: Sol.fromSol(0.000001).lamports,
          slippage: 50,
          pool: new PublicKey(meteoraDynPool),
        });

        await sendAndConfirmVersionedTransactionAndRetry({transaction: buyRes.swapTx, useStakedRpc: true});
      } catch (e) {
        errorCount++;
        console.log(e);
      }
    })
  );
  console.log("errorCount", errorCount);
});

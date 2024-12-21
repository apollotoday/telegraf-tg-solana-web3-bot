import { PublicKey, Keypair, TransactionMessage } from "@solana/web3.js";
import { buySell, buySellVersioned, fakeVolumne, swap } from "./meteora";
import { getDevWallet } from "../../testUtils";
import { sendAndConfirmRawTransactionAndRetry, Sol } from "../../solUtils";
import { connection, meteoraDynPool } from "../../config";
import { sendAndConfirmJitoTransactions } from "../../jitoUtils";
import { measureTime } from "../../utils";
import _ from "lodash";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";

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

    await sendAndConfirmJitoTransactions({
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
  const res = await measureTime("buySell", async () => {
    const res = await buySellVersioned({
      swapWallet: devWallet,
      feePayer: devWallet,
      inLamports: Sol.fromSol(_.random(0.0095, 0.0105)).lamports,
      pool: new PublicKey(meteoraDynPool),
      slippage: 50,
    });
    return res;
  });

  await measureTime("sendAndConfirmJitoTransactions", async () => {
    await sendAndConfirmJitoTransactions({
      transactions: [
        res.buyTx1,
         res.sellTx
      ],
      payer: devWallet,
    });
  });
});

test("should fake volumne", async () => {
  await fakeVolumne({ wallet: devWallet, amountLamports: Sol.fromSol(0.01).lamports });
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

        await sendAndConfirmRawTransactionAndRetry(buyRes.swapTx);
      } catch (e) {
        errorCount++;
        console.log(e);
      }
    })
  );
  console.log("errorCount", errorCount);
});

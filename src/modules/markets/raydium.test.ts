import {
  ComputeBudgetInstruction,
  ComputeBudgetProgram,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import { Percent, TokenAmount } from "@raydium-io/raydium-sdk";
import { fakeVolumneTransaction, getRaydiumPoolsByTokenAddress, swapRaydium } from "./raydium";
import reattempt from "reattempt";
import { getDevWallet } from "../../testUtils";
import { sendAndConfirmJitoTransactions } from "../../jitoUtils";
import { sendAndConfirmRawTransactionAndRetry, Sol } from "../../solUtils";
import _ from "lodash";
import { calculatePartionedSwapAmount } from "../../calculationUtils";
import { connection } from "../../config";

const devWallet = getDevWallet();
const devwallet2 = getDevWallet(2);

test("swap raydium jito", async () => {
  const puffPool = new PublicKey("9Tb2ohu5P16BpBarqd3N27WnkF51Ukfs8Z1GzzLDxVZW");

  console.log("devWallet", devWallet.publicKey.toBase58());

  const res = await Promise.all(
    Array.from({ length: 1 }).map(async () => {
      const swapAmount = 0.01;
      const sellAmountPercentage = 0.98;
      const sellAmount = swapAmount * sellAmountPercentage;
      const randomSlippagePercentage = 0.1;
      const [buyAmount1, buyAmount2] = calculatePartionedSwapAmount(swapAmount, 2, randomSlippagePercentage);

      const feePayer = devwallet2;

      const [buyRes, buyRes2, sellRes] = await Promise.all([
        swapRaydium({
          amount: buyAmount1,
          amountSide: "in",
          type: "buy",
          keypair: devWallet,
          feePayer: feePayer,
          poolId: puffPool,
          slippage: new Percent(10, 100),
        }),
        swapRaydium({
          amount: buyAmount2,
          amountSide: "in",
          type: "buy",
          keypair: devWallet,
          feePayer: feePayer,
          poolId: puffPool,
          slippage: new Percent(10, 100),
        }),
        swapRaydium({
          amount: sellAmount,
          amountSide: "in",
          type: "sell",
          keypair: devWallet,
          feePayer: feePayer,
          poolId: puffPool,
          slippage: new Percent(10, 100),
        }),
      ]);

      if (buyRes.tx && buyRes2.tx && sellRes.tx) {
        const res = await sendAndConfirmJitoTransactions({
          transactions: [buyRes.tx, buyRes2.tx, sellRes.tx],
          payer: devWallet,
          // signers: [devwallet2],
          feeTxInstructions: [
            // SystemProgram.transfer({
            //   fromPubkey: devwallet2.publicKey,
            //   toPubkey: devWallet.publicKey,
            //   lamports: Sol.fromSol(0.00005).lamports,
            // }),
          ],
        });
        return res;
      }
    })
  );

  const successful = res.filter((r) => r!! && r.confirmed).length;

  console.log("successful", successful);
});

test("swap raydium with different fee payer", async () => {
  const puffPool = new PublicKey("9Tb2ohu5P16BpBarqd3N27WnkF51Ukfs8Z1GzzLDxVZW");

  console.log("devWallet", devWallet.publicKey.toBase58());

  const res = await Promise.all(
    Array.from({ length: 1 }).map(async () => {
      const swapAmount = 0.01;
      const sellAmountPercentage = 0.98;
      const sellAmount = swapAmount * sellAmountPercentage;

      const buyAmount1Random = _.random(0.4, 0.6);
      const buyAmount1 = swapAmount * buyAmount1Random;
      const buyAmount2 = swapAmount - buyAmount1;

      const feePayer = devwallet2;

      const feePayer1 = Keypair.generate();
      const feePayer2 = Keypair.generate();
      const feePayer3 = Keypair.generate();

      console.log("feePayer1", feePayer1.publicKey.toBase58());

      function transferFeePayerFunds(args: { feePayer: Keypair }) {
        return SystemProgram.transfer({
          fromPubkey: devWallet.publicKey,
          toPubkey: args.feePayer.publicKey,
          lamports: Sol.fromSol(0.002).lamports,
        });
      }

      function transferFeePayerBack(args: { feePayer: Keypair }) {
        return SystemProgram.transfer({
          fromPubkey: args.feePayer.publicKey,
          toPubkey: devWallet.publicKey,
          lamports: Sol.fromSol(0.001).lamports,
        });
      }

      const sendBackTx = new VersionedTransaction(
        new TransactionMessage({
          instructions: [transferFeePayerBack({ feePayer: feePayer1 })],
          payerKey: feePayer1.publicKey,
          recentBlockhash: (await connection.getLatestBlockhash()).blockhash,
        }).compileToV0Message()
      );
      sendBackTx.sign([feePayer1]);

      const [buyRes, buyRes2, sellRes] = await Promise.all([
        swapRaydium({
          amount: buyAmount1,
          amountSide: "in",
          type: "buy",
          keypair: devWallet,
          feePayer: feePayer1,
          poolId: puffPool,
          slippage: new Percent(10, 100),
          // additionalInstructions: [transferFeePayerBack({ feePayer: feePayer1 })],
        }),
        swapRaydium({
          amount: buyAmount2,
          amountSide: "in",
          type: "buy",
          keypair: devWallet,
          feePayer: feePayer2,
          poolId: puffPool,
          slippage: new Percent(10, 100),
        }),
        swapRaydium({
          amount: sellAmount,
          amountSide: "in",
          type: "sell",
          keypair: devWallet,
          feePayer: feePayer3,
          poolId: puffPool,
          slippage: new Percent(10, 100),
        }),
      ]);

      if (buyRes.tx && buyRes2.tx && sellRes.tx) {
        const res = await sendAndConfirmJitoTransactions({
          transactions: [buyRes.tx, buyRes2.tx, sellRes.tx, sendBackTx],
          payer: devWallet,
          // signers: [devwallet2],
          feeTxInstructions: [
            transferFeePayerFunds({ feePayer: feePayer1 }),
            transferFeePayerFunds({ feePayer: feePayer2 }),
            transferFeePayerFunds({ feePayer: feePayer3 }),
            // SystemProgram.transfer({
            //   fromPubkey: devwallet2.publicKey,
            //   toPubkey: devWallet.publicKey,
            //   lamports: Sol.fromSol(0.00005).lamports,
            // }),
          ],
        });
        return res;
      }
    })
  );

  const successful = res.filter((r) => r!! && r.confirmed).length;

  console.log("successful", successful);
});

test("fake volumne transaction", async () => {
  const feePayer = Keypair.generate();

  // await sendSol({ from: devWallet, to: feePayer.publicKey, amount: Sol.fromSol(0.001) });

  const pool = new PublicKey("9Tb2ohu5P16BpBarqd3N27WnkF51Ukfs8Z1GzzLDxVZW");

  await Promise.all(
    Array.from({ length: 3 }).map(async () => {
      const res = await fakeVolumneTransaction({ pool: pool, wallet: devWallet, swapAmount: _.random(0.010000001, 0.019999999) });
    })
  );
});

test("send simple tx", async () => {
  const devWallet = getDevWallet();
  const latestBlockHash = await connection.getLatestBlockhash();

  const testWallet = Keypair.generate();
  function transferFundsTx(args: { from: Keypair; to: PublicKey; amount: number; feePayer?: Keypair }) {
    const txMessage = new TransactionMessage({
      payerKey: args.feePayer?.publicKey ?? args.from.publicKey,
      recentBlockhash: latestBlockHash.blockhash,
      instructions: [
        // ComputeBudgetProgram.setComputeUnitPrice({
        //   microLamports: 50000,
        // }),
        SystemProgram.transfer({
          fromPubkey: args.from.publicKey,
          toPubkey: args.to,
          lamports: args.amount,
        }),
      ],
    }).compileToV0Message();

    const tx = new VersionedTransaction(txMessage);
    const signers = [args.from];
    if (args.feePayer) signers.push(args.feePayer);
    tx.sign(signers);

    return tx;
  }

  // const sendFundsTx2 = transferFundsTx({ from: devWallet, to: testWallet.publicKey, amount: 10000 / 2 });

  const txAmount = 1;

  const res = await asyncBatch(
    Array.from({ length: txAmount }),
    async (tx) => {
      const amount = 0.001 * 10 ** 9;
      const randomAmount = _.random(amount, amount * 2);
      const sendFundsTx = transferFundsTx({ from: devWallet, to: testWallet.publicKey, amount: randomAmount });
      const sendFunsBackTx = transferFundsTx({ from: testWallet, to: devWallet.publicKey, amount: randomAmount, feePayer: devWallet });

      const res = await connection.simulateTransaction(sendFunsBackTx);
      if (res.value.err) {
        console.log("error", res.value.err);
      }

      return await sendAndConfirmJitoTransactions({
        payer: devWallet,
        transactions: [sendFundsTx, sendFunsBackTx],
        // feeTxInstructions: [
        //   SystemProgram.transfer({
        //     fromPubkey: devWallet.publicKey,
        //     toPubkey: testWallet.publicKey,
        //     lamports: 10000,
        //   }),
        // ],
      });
    },
    txAmount
  );

  const successful = res.filter((r) => r.confirmed).length;
  console.log("successful", successful);
});

test("swap raydium direct with buyout amount input", async () => {
  const puffPool = new PublicKey("9Tb2ohu5P16BpBarqd3N27WnkF51Ukfs8Z1GzzLDxVZW");
  const startTime = Date.now();
  const endTime = startTime + 60000; // 60 seconds

  const buyAmount1 = 0.001;
  const buyRes = await swapRaydium({
    amount: 0.01,
    amountSide: "in",
    type: "buy",
    keypair: devWallet,
    feePayer: devWallet,
    poolId: puffPool,
    slippage: new Percent(10, 100),
  });

  console.log("buyRes", buyRes);

  await sendAndConfirmRawTransactionAndRetry(buyRes.tx);
});

test("getRaydiumPoolsByTokenAddress", async () => {
  const res = await getRaydiumPoolsByTokenAddress("CzLSujWBLFsSjncfkh59rUFqvafWcY5tzedWJSuypump");
  console.log("res", res);
});

// test("swap raydium jito multiple tx per minute", async () => {
//   const puffPool = new PublicKey("9Tb2ohu5P16BpBarqd3N27WnkF51Ukfs8Z1GzzLDxVZW");
//   let successCount = 0;
//   const startTime = Date.now();
//   const endTime = startTime + 60000; // 60 seconds

//   const executeSwap = async () => {
//     try {
//       await reattempt.run(
//         {
//           times: 3,
//           delay: 0,
//         },
//         async () => {
//           // random amount between 0.0045 and 0.0055
//           const buyAmount1 = Math.random() * 0.001 + 0.0045;
//           const buyAmount2 = 0.01 - buyAmount1;
//           const [buyRes, buyRes2, sellRes] = await Promise.all([
//             swapRaydium({
//               amount: buyAmount1,
//               amountSide: "receive",
//               buyToken: "quote",
//               keypair: devWallet,
//               // feePayer: devwallet2,
//               poolId: puffPool,
//               slippage: new Percent(10, 100),
//             }),
//             swapRaydium({
//               amount: buyAmount2,
//               amountSide: "receive",
//               buyToken: "quote",
//               keypair: devWallet,
//               // feePayer: devwallet2,
//               poolId: puffPool,
//               slippage: new Percent(10, 100),
//             }),
//             swapRaydium({
//               amount: 0.095,
//               amountSide: "receive",
//               buyToken: "base",
//               keypair: devWallet,
//               // feePayer: devwallet2,
//               poolId: puffPool,
//               slippage: new Percent(10, 100),
//             }),
//           ]);

//           if (buyRes.tx && buyRes2.tx && sellRes.tx) {
//             const res = await sendAndConfirmJitoTransactions([buyRes.tx, buyRes2.tx, sellRes.tx], devwallet2);
//             if (res.confirmed) successCount++;
//             else throw new Error("Transaction not confirmed");
//           }
//         }
//       );
//     } catch (error) {
//       console.error("Swap failed:", error);
//     }
//   };

//   const promises = [];
//   const txCount = 10;
//   for (let i = 0; i < txCount; i++) {
//     promises.push(executeSwap());

//     // Don't wait for the last iteration
//     await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 6 seconds before starting the next swap
//   }

//   await Promise.all(promises);

//   console.log(`Successful swaps: ${successCount} out of ${txCount}`);
//   console.log(`Total time: ${(Date.now() - startTime) / 1000} seconds`);
// });

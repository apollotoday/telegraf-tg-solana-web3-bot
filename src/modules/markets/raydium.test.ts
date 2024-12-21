import { PublicKey, SystemProgram, TransactionMessage, VersionedTransaction } from "@solana/web3.js";
import { Percent, TokenAmount } from "@raydium-io/raydium-sdk";
import { getRaydiumPoolsByTokenAddress, swapRay, swapRaydium } from "./raydium";
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

  const swapAmount = 0.01;
  const sellAmountPercentage = 0.98;
  const sellAmount = swapAmount * sellAmountPercentage;
  const randomSlippagePercentage = 0.1;
  const [buyAmount1, buyAmount2] = calculatePartionedSwapAmount(swapAmount, 2, randomSlippagePercentage);

  const feePayer = devwallet2;

  const [buyRes, buyRes2, sellRes] = await Promise.all([
    swapRay({
      amount: buyAmount1,
      amountSide: "receive",
      buyToken: "quote",
      keypair: devWallet,
      feePayer: feePayer,
      poolId: puffPool,
      slippage: new Percent(10, 100),
    }),
    swapRay({
      amount: buyAmount2,
      amountSide: "receive",
      buyToken: "quote",
      keypair: devWallet,
      feePayer: feePayer,
      poolId: puffPool,
      slippage: new Percent(10, 100),
    }),
    swapRay({
      amount: sellAmount,
      amountSide: "receive",
      buyToken: "base",
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
      instructions: [
        // SystemProgram.transfer({
        //   fromPubkey: devwallet2.publicKey,
        //   toPubkey: devWallet.publicKey,
        //   lamports: Sol.fromSol(0.00005).lamports,
        // }),
      ],
    });
  }
});

test("send simple tx", async () => {
  const devWallet = getDevWallet();
  const latestBlockHash = await connection.getLatestBlockhash();

  const txMessage = new TransactionMessage({
    payerKey: devWallet.publicKey,
    recentBlockhash: latestBlockHash.blockhash,
    instructions: [
      SystemProgram.transfer({
        fromPubkey: devWallet.publicKey,
        toPubkey: devWallet.publicKey,
        lamports: 10000,
      }),
    ],
  }).compileToV0Message();

  const tx = new VersionedTransaction(txMessage);

  tx.sign([devWallet]);

  await sendAndConfirmJitoTransactions({ payer: devWallet, transactions: [tx] });
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

test("swap raydium direct with different feePayer", async () => {
  const puffPool = new PublicKey("9Tb2ohu5P16BpBarqd3N27WnkF51Ukfs8Z1GzzLDxVZW");
  const startTime = Date.now();
  const endTime = startTime + 60000; // 60 seconds

  const buyAmount1 = 0.001;
  const [buyRes] = await Promise.all([
    swapRay({
      amount: buyAmount1,
      amountSide: "receive",
      buyToken: "quote",
      keypair: devWallet,
      feePayer: devwallet2,
      poolId: puffPool,
      slippage: new Percent(10, 100),
    }),
  ]);

  const res = await sendAndConfirmRawTransactionAndRetry(buyRes.tx);
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
//             swapRay({
//               amount: buyAmount1,
//               amountSide: "receive",
//               buyToken: "quote",
//               keypair: devWallet,
//               // feePayer: devwallet2,
//               poolId: puffPool,
//               slippage: new Percent(10, 100),
//             }),
//             swapRay({
//               amount: buyAmount2,
//               amountSide: "receive",
//               buyToken: "quote",
//               keypair: devWallet,
//               // feePayer: devwallet2,
//               poolId: puffPool,
//               slippage: new Percent(10, 100),
//             }),
//             swapRay({
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

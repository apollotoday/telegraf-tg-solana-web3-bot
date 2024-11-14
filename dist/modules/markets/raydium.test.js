"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const web3_js_1 = require("@solana/web3.js");
const raydium_sdk_1 = require("@raydium-io/raydium-sdk");
const raydium_1 = require("./raydium");
const testUtils_1 = require("../../testUtils");
const jitoUtils_1 = require("../../jitoUtils");
const solUtils_1 = require("../../solUtils");
const calculationUtils_1 = require("../../calculationUtils");
const config_1 = require("../../config");
const devWallet = (0, testUtils_1.getDevWallet)();
const devwallet2 = (0, testUtils_1.getDevWallet)(2);
test("swap raydium jito", () => __awaiter(void 0, void 0, void 0, function* () {
    const puffPool = new web3_js_1.PublicKey("9Tb2ohu5P16BpBarqd3N27WnkF51Ukfs8Z1GzzLDxVZW");
    console.log("devWallet", devWallet.publicKey.toBase58());
    const swapAmount = 0.01;
    const sellAmountPercentage = 0.98;
    const sellAmount = swapAmount * sellAmountPercentage;
    const randomSlippagePercentage = 0.1;
    const [buyAmount1, buyAmount2] = (0, calculationUtils_1.calculatePartionedSwapAmount)(swapAmount, 2, randomSlippagePercentage);
    const feePayer = devwallet2;
    const [buyRes, buyRes2, sellRes] = yield Promise.all([
        (0, raydium_1.swapRay)({
            amount: buyAmount1,
            amountSide: "receive",
            buyToken: "quote",
            keypair: devWallet,
            feePayer: feePayer,
            poolId: puffPool,
            slippage: new raydium_sdk_1.Percent(10, 100),
        }),
        (0, raydium_1.swapRay)({
            amount: buyAmount2,
            amountSide: "receive",
            buyToken: "quote",
            keypair: devWallet,
            feePayer: feePayer,
            poolId: puffPool,
            slippage: new raydium_sdk_1.Percent(10, 100),
        }),
        (0, raydium_1.swapRay)({
            amount: sellAmount,
            amountSide: "receive",
            buyToken: "base",
            keypair: devWallet,
            feePayer: feePayer,
            poolId: puffPool,
            slippage: new raydium_sdk_1.Percent(10, 100),
        }),
    ]);
    if (buyRes.tx && buyRes2.tx && sellRes.tx) {
        const res = yield (0, jitoUtils_1.sendAndConfirmJitoTransactions)({
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
}));
test("send simple tx", () => __awaiter(void 0, void 0, void 0, function* () {
    const devWallet = (0, testUtils_1.getDevWallet)();
    const latestBlockHash = yield config_1.connection.getLatestBlockhash();
    const txMessage = new web3_js_1.TransactionMessage({
        payerKey: devWallet.publicKey,
        recentBlockhash: latestBlockHash.blockhash,
        instructions: [
            web3_js_1.SystemProgram.transfer({
                fromPubkey: devWallet.publicKey,
                toPubkey: devWallet.publicKey,
                lamports: 10000,
            }),
        ],
    }).compileToV0Message();
    const tx = new web3_js_1.VersionedTransaction(txMessage);
    tx.sign([devWallet]);
    yield (0, jitoUtils_1.sendAndConfirmJitoTransactions)({ payer: devWallet, transactions: [tx] });
}));
test("swap raydium direct with buyout amount input", () => __awaiter(void 0, void 0, void 0, function* () {
    const puffPool = new web3_js_1.PublicKey("9Tb2ohu5P16BpBarqd3N27WnkF51Ukfs8Z1GzzLDxVZW");
    const startTime = Date.now();
    const endTime = startTime + 60000; // 60 seconds
    const buyAmount1 = 0.001;
    const buyRes = yield (0, raydium_1.swapRaydium)({
        amount: 0.01,
        amountSide: "in",
        type: "buy",
        keypair: devWallet,
        feePayer: devWallet,
        poolId: puffPool,
        slippage: new raydium_sdk_1.Percent(10, 100),
    });
    console.log("buyRes", buyRes);
    yield (0, solUtils_1.sendAndConfirmRawTransactionAndRetry)(buyRes.tx);
}));
test("swap raydium direct with different feePayer", () => __awaiter(void 0, void 0, void 0, function* () {
    const puffPool = new web3_js_1.PublicKey("9Tb2ohu5P16BpBarqd3N27WnkF51Ukfs8Z1GzzLDxVZW");
    const startTime = Date.now();
    const endTime = startTime + 60000; // 60 seconds
    const buyAmount1 = 0.001;
    const [buyRes] = yield Promise.all([
        (0, raydium_1.swapRay)({
            amount: buyAmount1,
            amountSide: "receive",
            buyToken: "quote",
            keypair: devWallet,
            feePayer: devwallet2,
            poolId: puffPool,
            slippage: new raydium_sdk_1.Percent(10, 100),
        }),
    ]);
    const res = yield (0, solUtils_1.sendAndConfirmRawTransactionAndRetry)(buyRes.tx);
}));
test("getRaydiumPoolsByTokenAddress", () => __awaiter(void 0, void 0, void 0, function* () {
    const res = yield (0, raydium_1.getRaydiumPoolsByTokenAddress)("CzLSujWBLFsSjncfkh59rUFqvafWcY5tzedWJSuypump");
    console.log("res", res);
}));
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

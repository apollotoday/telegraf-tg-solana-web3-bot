import { Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { loadFeePayers, sendSol, Sol } from "../../solUtils";
import { getDevWallet } from "../../testUtils";
import { sleep } from "../../utils";
import { connection, goatPool, lpPoolForTests } from "../../config";
import asyncBatch from "async-batch";
import _ from "lodash";
import { loadWalletFromEnv } from "../wallet/walletUtils";
import { fakeVolumneTransactionFeePayerPool } from "../markets/raydium";

export async function runRajeetVolumneBot(args: { wallet: Keypair; pool: PublicKey }) {
  // const wallet = getDevWallet();

  console.log(`wallet: ${args.wallet.publicKey.toBase58()}`);

  const balance = await connection.getBalance(args.wallet.publicKey);
  console.log("balance", balance / LAMPORTS_PER_SOL);

  const feePayerPool = loadFeePayers(200);

  async function fundFeePayerIfNeeded(feePayer: Keypair) {
    const balanceLamports = await connection.getBalance(feePayer.publicKey);
    const balance = balanceLamports / LAMPORTS_PER_SOL;
    if (balance < 0.00002) {
      await sendSol({ from: args.wallet, to: feePayer.publicKey, amount: Sol.fromSol(0.002) });
      // await sleep(2000);
    }
  }

  console.log("fund all fee payers");
  // await asyncBatch(
  //   feePayerPool,
  //   async (feePayer) => {
  //     await fundFeePayerIfNeeded(feePayer);
  //   },
  //   10
  // );
  console.log("finished funding all fee payers");

  await asyncBatch(
    Array.from({ length: 999999999999999 }),
    async (i) => {
      let buy1FeePayer = feePayerPool[Math.floor(Math.random() * feePayerPool.length)];
      let buy2FeePayer = feePayerPool[Math.floor(Math.random() * feePayerPool.length)];
      let sellFeePayer = feePayerPool[Math.floor(Math.random() * feePayerPool.length)];

      console.log(`buy1FeePayer: ${buy1FeePayer.publicKey.toBase58()}`);

      // fund fee payer function if balance is less than 0.0001 sol

      await Promise.all([fundFeePayerIfNeeded(buy1FeePayer), fundFeePayerIfNeeded(buy2FeePayer), fundFeePayerIfNeeded(sellFeePayer)]);

      const swapAmount = _.random(1.00001, 1.599999);
      await fakeVolumneTransactionFeePayerPool({
        pool: args.pool,
        wallet: args.wallet,
        swapAmount: swapAmount,
        // buy1FeePayer: wallet2
        buy1FeePayer: buy1FeePayer,
        buy2FeePayer,
        sellFeePayer,
      });

      // await fundFeePayerIfNeeded(buyFeePayer);
      // await fundFeePayerIfNeeded(sellFeePayer);

      // await sleep(5000);
    },
    3
  );
}

if (require.main === module) {
  async function main() {
    const wallet2 = getDevWallet(2);

    const wallet = loadWalletFromEnv("RIGGGED_VOLUMNE_BOT");

    runRajeetVolumneBot({ wallet, pool: lpPoolForTests });
  }
  main();
}

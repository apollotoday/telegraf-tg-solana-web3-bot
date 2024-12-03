import { Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { loadFeePayers, sendSol, Sol } from "./solUtils";
import { getDevWallet } from "./testUtils";
import { sleep } from "./utils";
import { connection } from "./config";
import { fakeVolumneTransaction } from "./markets/raydium";
import asyncBatch from "async-batch";
import { loadWalletFromEnv } from "./walletUtils";
import _ from "lodash";

export async function runRajeetVolumneBot() {
  // const wallet = getDevWallet();
  const wallet2 = getDevWallet(2);

  const wallet = loadWalletFromEnv("RAJEET_VOLUMNE_BOT");

  console.log(`wallet: ${wallet.publicKey.toBase58()}`);

  const feePayerPool = loadFeePayers(200);

  async function fundFeePayerIfNeeded(feePayer: Keypair) {
    const balanceLamports = await connection.getBalance(feePayer.publicKey);
    const balance = balanceLamports / LAMPORTS_PER_SOL;
    if (balance < 0.00002) {
      await sendSol({ from: wallet, to: feePayer.publicKey, amount: Sol.fromSol(0.002) });
      // await sleep(2000);
    }
  }

  console.log("fund all fee payers");
  await asyncBatch(
    feePayerPool,
    async (feePayer) => {
      await fundFeePayerIfNeeded(feePayer);
    },
    10
  );
  console.log("finished funding all fee payers");

  while (true) {
    let buy1FeePayer = feePayerPool[Math.floor(Math.random() * feePayerPool.length)];
    let buy2FeePayer = feePayerPool[Math.floor(Math.random() * feePayerPool.length)];
    let sellFeePayer = feePayerPool[Math.floor(Math.random() * feePayerPool.length)];

    console.log(`buy1FeePayer: ${buy1FeePayer.publicKey.toBase58()}`);

    // fund fee payer function if balance is less than 0.0001 sol

    // await Promise.all([fundFeePayerIfNeeded(buy1FeePayer), fundFeePayerIfNeeded(buy2FeePayer), fundFeePayerIfNeeded(sellFeePayer)]);

    const puffPool = new PublicKey("H7H7neVRfLbUQNsqm4Wrq2BGrwbjoBgzFd7Z54jL3xoi");
    const swapAmount = _.random(1.00001, 1.99999);
    await fakeVolumneTransaction({
      pool: puffPool,
      wallet,
      swapAmount: swapAmount,
      // buy1FeePayer: wallet2
      buy1FeePayer: buy1FeePayer,
      buy2FeePayer,
      sellFeePayer,
    });

    // await fundFeePayerIfNeeded(buyFeePayer);
    // await fundFeePayerIfNeeded(sellFeePayer);

    // await sleep(5000);
  }
}

if (require.main === module) {
  runRajeetVolumneBot();
}

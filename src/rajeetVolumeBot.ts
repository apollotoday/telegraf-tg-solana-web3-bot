import { Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { loadFeePayers, sendSol, Sol } from "./solUtils";
import { getDevWallet } from "./testUtils";
import { sleep } from "./utils";
import { connection } from "./config";
import { fakeVolumneTransaction } from "./markets/raydium";

export async function runRajeetVolumneBot() {
  const wallet = getDevWallet();

  const feePayerPool = loadFeePayers();

  while (true) {
    let buy1FeePayer = feePayerPool[Math.floor(Math.random() * feePayerPool.length)];
    let buy2FeePayer = feePayerPool[Math.floor(Math.random() * feePayerPool.length)];
    let sellFeePayer = feePayerPool[Math.floor(Math.random() * feePayerPool.length)];

    console.log(`buy1FeePayer: ${buy1FeePayer.publicKey.toBase58()}`);

    // fund fee payer function if balance is less than 0.0001 sol
    async function fundFeePayerIfNeeded(feePayer: Keypair) {
      const balanceLamports = await connection.getBalance(feePayer.publicKey);
      const balance = balanceLamports / LAMPORTS_PER_SOL;
      if (balance < 0.00002) {
        await sendSol({ from: wallet, to: feePayer.publicKey, amount: Sol.fromSol(0.001) });
      }
      return {};
    }

    await Promise.all([fundFeePayerIfNeeded(buy1FeePayer), fundFeePayerIfNeeded(buy2FeePayer), fundFeePayerIfNeeded(sellFeePayer)]);

    const puffPool = new PublicKey("9Tb2ohu5P16BpBarqd3N27WnkF51Ukfs8Z1GzzLDxVZW");
    await fakeVolumneTransaction({
      pool: puffPool,
      wallet,
      swapAmount: 0.001,
      buy1FeePayer,
      buy2FeePayer,
      sellFeePayer,
    });

    // await fundFeePayerIfNeeded(buyFeePayer);
    // await fundFeePayerIfNeeded(sellFeePayer);

    await sleep(5000);
  }
}

if (require.main === module) {
  runRajeetVolumneBot();
}

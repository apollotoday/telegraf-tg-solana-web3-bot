import { logger, retry, schemaTask, task, wait } from "@trigger.dev/sdk/v3";
import { getDevWallet } from "../testUtils";
import { z } from "zod";
import { Keypair, PublicKey } from "@solana/web3.js";
import { connection, goatPool } from "../config";
import { fakeVolumneTransaction } from "../modules/markets/raydium";
import { closeWallet, sendSol, Sol } from "../solUtils";
import { swap } from "../modules/markets/meteora";
import { pay } from "telegraf/typings/button";

export const volumneBotTask = schemaTask({
  id: "volume-bot",
  // Set an optional maxDuration to prevent tasks from running indefinitely
  maxDuration: 300, // Stop executing after 300 secs (5 mins) of compute
  schema: z.object({}),
  run: async (payload, { ctx }) => {
    logger.log("volume bot", { payload, ctx });

    const wallet = Keypair.generate();
    console.log(`generated wallet ${wallet.publicKey.toBase58()}`);

    const devWallet = getDevWallet();

    await sendSol({ from: devWallet, to: wallet.publicKey, amount: Sol.fromSol(0.01) });

    const balanceRes = await awaitFunds.triggerAndWait({
      pubkey: wallet.publicKey.toBase58(),
    });

    const res = await fakeVolumneTransactionTask.triggerAndWait({
      pool: goatPool.toBase58(),
      swapAmount: 0.001,
    });

    console.log(`fakeVolumneTransaction res`, res);

    await closeWallet({ from: wallet, to: devWallet });
  },
});

export const fakeVolumneTransactionTask = schemaTask({
  id: "fake-volumne-transaction",
  // Set an optional maxDuration to prevent tasks from running indefinitely
  maxDuration: 300, // Stop executing after 300 secs (5 mins) of compute
  schema: z.object({
    pool: z.string(),
    swapAmount: z.number(),
  }),
  run: async (payload: any, { ctx }) => {
    logger.log("fake volumne transaction", { payload, ctx });
    const devWallet = getDevWallet();

    const res = await fakeVolumneTransaction({
      pool: new PublicKey(payload.pool),
      wallet: devWallet,
      differentFeePayer: true,
      swapAmount: payload.swapAmount,
    });
  },
});

export const awaitFunds = schemaTask({
  id: "await-funds",
  // Set an optional maxDuration to prevent tasks from running indefinitely
  maxDuration: 300, // Stop executing after 300 secs (5 mins) of compute
  schema: z.object({
    pubkey: z.string(),
  }),
  run: async (payload, { ctx }) => {
    logger.log("await funds", { payload, ctx });

    const devWallet = getDevWallet();

    const wallet = new PublicKey(payload.pubkey);

    let balance = 0;

    while (balance < 1) {
      balance = await connection.getBalance(wallet);
      console.log("balance", balance);

      await wait.for({ seconds: 5 });
    }
    console.log("found balance");

    return {
      balance,
    };
  },
});

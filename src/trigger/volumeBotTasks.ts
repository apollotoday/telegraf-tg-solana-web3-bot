import { logger, retry, schemaTask, task, wait } from "@trigger.dev/sdk/v3";
import { getDevWallet } from "../testUtils";
import { z } from "zod";
import { Keypair, PublicKey } from "@solana/web3.js";
import { connection, goatPool } from "../config";
import { fakeVolumneTransaction } from "../modules/markets/raydium";
import { closeWallet, lamportsToSol, sendSol, Sol, solToLamports } from "../solUtils";
import { swap } from "../modules/markets/meteora";
import { pay } from "telegraf/typings/button";
import prisma from "../lib/prisma";
import { decryptWallet } from "../modules/wallet/walletUtils";

export const volumneBotTask = schemaTask({
  id: "volume-bot",
  // Set an optional maxDuration to prevent tasks from running indefinitely
  maxDuration: 300, // Stop executing after 300 secs (5 mins) of compute
  schema: z.object({
    serviceId: z.string(),
    customerId: z.string(),
  }),
  run: async (payload, { ctx }) => {
    logger.log("volume bot", { payload, ctx });

    const service = await prisma.bookedService.findUnique({ where: { id: payload.serviceId }, include: { mainWallet: true } });
    if (!service) throw new Error(`service not found ${payload.serviceId}`);

    if (!service.transactionsPerMinute) throw new Error(`service.transactionsPerMinute not found ${payload.serviceId}`);

    const fundingBalanceRes = await awaitFundsTask.triggerAndWait({
      pubkey: service.mainWallet.pubkey,
    });

    if (!fundingBalanceRes.ok) throw new Error(`balanceRes not ok ${fundingBalanceRes}`);

    let currentBalance = fundingBalanceRes.output.solBalance;

    const minBalance = fundingBalanceRes.output.solBalance * 0.2;

    while (currentBalance > minBalance) {
      const res = await fakeVolumneTransactionTask.trigger({
        pool: goatPool.toBase58(),
        swapAmount: currentBalance * 0.99,
        serviceId: payload.serviceId,
        solBalance: currentBalance,
      });

      currentBalance = lamportsToSol(await connection.getBalance(new PublicKey(service.mainWallet.pubkey)));
      console.log("currentBalance", currentBalance);

      console.log(`fakeVolumneTransaction res`, res);

      await wait.for({ seconds: 60 / service.transactionsPerMinute });
    }

    console.log("volume bot finished");

    // todo sent remainig funds to
  },
});

export const awaitFundsTask = schemaTask({
  id: "await-funds",
  // Set an optional maxDuration to prevent tasks from running indefinitely
  maxDuration: 300, // Stop executing after 300 secs (5 mins) of compute
  schema: z.object({
    pubkey: z.string(),
  }),
  run: async (payload, { ctx }) => {
    logger.log("await funds", { payload, ctx });

    const wallet = new PublicKey(payload.pubkey);

    let solBalance = 0;

    while (true) {
      const balance = await connection.getBalance(wallet);
      solBalance = lamportsToSol(balance);
      console.log("balance", solBalance);

      if (solBalance > 1) break;

      await wait.for({ seconds: 30 });
    }
    console.log("found balance", solBalance);

    return {
      solBalance,
    };
  },
});

export const fakeVolumneTransactionTask = schemaTask({
  id: "fake-volumne-transaction",
  // Set an optional maxDuration to prevent tasks from running indefinitely
  // maxDuration: 300, // Stop executing after 300 secs (5 mins) of compute
  schema: z.object({
    pool: z.string(),
    solBalance: z.number(),
    swapAmount: z.number(),
    serviceId: z.string(),
  }),
  run: async (payload: any, { ctx }) => {
    logger.log("fake volumne transaction", { payload, ctx });
    const service = await prisma.bookedService.findUnique({ where: { id: payload.serviceId }, include: { mainWallet: true } });
    if (!service) {
      throw new Error(`service not found ${payload.serviceId}`);
    }

    const wallet = decryptWallet(service.mainWallet.encryptedPrivKey);

    const res = await fakeVolumneTransaction({
      pool: new PublicKey(payload.pool),
      wallet: wallet,
      differentFeePayer: true,
      swapAmount: payload.swapAmount,
    });
  },
});

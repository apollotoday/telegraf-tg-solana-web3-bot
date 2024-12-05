import { Keypair, LAMPORTS_PER_SOL, PublicKey, TransactionMessage, VersionedTransaction } from "@solana/web3.js";
import { loadFeePayers, sendAndConfirmRawTransactionAndRetry, sendSol, Sol } from "../../solUtils";
import { getDevWallet } from "../../testUtils";
import { sleep } from "../../utils";
import { connection, goatPool, rugPool } from "../../config";
import asyncBatch from "async-batch";

import _ from "lodash";
import { Percent } from "@raydium-io/raydium-sdk";
import { sendAndConfirmJitoTransactions } from "../../jitoUtils";
import { computeRaydiumAmounts, swapRaydium } from "../markets/raydium";
import { loadWalletFromEnv } from "../wallet/walletUtils";

export async function makeShootingStar(args: { wallet: Keypair; pool: PublicKey; buyAmount: number }) {
  const solAmount = await connection.getBalance(args.wallet.publicKey);

  console.log("solAmount", solAmount / LAMPORTS_PER_SOL);

  const buyAmount = await computeRaydiumAmounts({
    amount: args.buyAmount,
    amountSide: "in",
    type: "buy",
    keypair: args.wallet,
    poolId: args.pool,
    slippage: new Percent(10, 100),
  });

  const outAmount = Number(buyAmount.amountOut.toExact());

  const [buyRes, sellRes] = await Promise.all([
    swapRaydium({
      amount: outAmount,
      amountSide: "out",
      type: "buy",
      keypair: args.wallet,
      poolId: args.pool,
      slippage: new Percent(10, 100),
    }),
    swapRaydium({
      amount: outAmount,
      amountSide: "in",
      type: "sell",
      keypair: args.wallet,
      poolId: args.pool,
      slippage: new Percent(10, 100),
    }),
  ]);

  console.log("buyAmount", buyRes.amountOut.toExact());
  console.log("sellAmount", sellRes.amountIn.toExact());

  if (buyRes.tx && sellRes.tx) {
    const res = await sendAndConfirmJitoTransactions({
      transactions: [buyRes.tx, sellRes.tx],
      payer: args.wallet,
      // signers: [args.wallet],
      feeTxInstructions: [
        // sendFundsBack(buy1FeePayer),
        // fundFeePayer(feePayer2), fundFeePayer(feePayer3)
      ],
    });
    return res;
  } else {
    throw new Error("failed to prepare swap transaction");
  }
}

if (require.main === module) {
  // const wallet = getDevWallet();
  // const wallet2 = getDevWallet(2);

  const wallet = loadWalletFromEnv("VOLUMNE_TICKS");

  makeShootingStar({ wallet, pool: rugPool, buyAmount: 19.5 });
}

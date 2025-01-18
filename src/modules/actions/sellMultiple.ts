import { Keypair, PublicKey, RpcResponseAndContext, TokenAmount } from "@solana/web3.js";
import { primaryRpcConnection } from "../../config";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import { Percent } from "@raydium-io/raydium-sdk";
import { sendAndConfirmVersionedTransactionAndRetry } from "../../solUtils";
import fs from "fs";
import { bs58 } from "@project-serum/anchor/dist/cjs/utils/bytes";
import asyncBatch from "async-batch";
import _ from "lodash";
import { createSwapRaydiumInstructions, getTokensForPool, swapRaydium } from "../markets/raydium";
import { loadWalletFromEnv } from "../wallet/walletUtils";
import { sendAndConfirmJitoTransactions } from "../../jitoUtils";
import { filterTruthy } from "../../utils";
import { getDevWallet } from "../../testUtils";
import { createTransactionForInstructions } from '../solTransaction/solTransactionUtils';
import { sendAndConfirmTransactionAndRetry } from '../solTransaction/solSendTransactionUtils';

const wallet = getDevWallet();

// const file = "/Users/matthiasschaider/Downloads/ALL";

//   const data = fs.readFileSync(file, "utf8");

//   const rows = data.split("\n");

//   let wallets = rows
//     .slice(1, rows.length - 1)
//     .map((rows) => rows.split(",")[1])
//     .map((pk) => {
//       try {
//         let pkClean = pk.replace(/\r, /g, "");
//         // remove last 2 characters
//         pkClean = pkClean.slice(0, pkClean.length - 1);
//         return Keypair.fromSecretKey(bs58.decode(pkClean));
//       } catch (e) {
//         return null;
//       }
//     })
//     .filter(Boolean) as Keypair[];

export async function sellMultiple(args: { pool: PublicKey; wallets: Keypair[] }) {
  // const { quoteToken: token } = await getTokensForPool(args.pool);
  let wallets = args.wallets;

  const token = new PublicKey("8iHvmwxjQNonervF6fYKBRHsxb9nqG6Ens8Rihg68zzP");

  let results: Awaited<ReturnType<typeof sellAll>>[] = [];

  let walletsWithBalances = (
    await asyncBatch(
      wallets,
      async (wallet) => {
        try {
          const associatedTokenAccountAddress = await getAssociatedTokenAddress(token, wallet.publicKey);

          let balance = await primaryRpcConnection.getTokenAccountBalance(associatedTokenAccountAddress);
          return { wallet, balance };
        } catch (e) {
          return null;
        }
      },
      10
    )
  )
    .filter(filterTruthy)
    .filter((w) => w.balance.value.uiAmount! > 1);

  console.log("walletsWithBalances", walletsWithBalances.length);
  console.log(
    "walletsWithBalances",
    walletsWithBalances.map((w) => w.balance.value.uiAmount!)
  );

  let successfulSoldWallets: Keypair[] = [];

  let maxRetries = 5;
  while (walletsWithBalances.length > 0) {
    maxRetries--;
    if (maxRetries < 0) {
      console.log("max retries reached");
      break;
    }
    const allSellRes = await asyncBatch(
      _.chunk([...walletsWithBalances], 2),
      async (walletsChunk) => {
        console.log(`selling all for wallets: ${walletsChunk.map((w) => w.wallet.publicKey.toBase58())}`);
        const res = (
          await Promise.all(
            walletsChunk.map(async (w) => {
              try {
                const res = await swapRaydium({
                  amount: w.balance.value.uiAmount!,
                  amountSide: "in",
                  type: "sell",
                  keypair: w.wallet,
                  poolId: args.pool,
                  slippage: new Percent(50, 100),
                });
                if (!res.tx) throw new Error("no tx");
                return { res, wallet: w.wallet };
              } catch (e) {
                console.log(`error at wallet ${w.wallet.publicKey.toBase58()} with balance ${w.balance.value.uiAmount!}`, e);
                return null;
              }
            })
          )
        ).filter(filterTruthy);

        // for (const r of res) {
        //   await sendAndConfirmRawTransactionAndRetry(r.res.tx);
        // }

        const jitoRes = await sendAndConfirmJitoTransactions({
          transactions: res.map((r) => r.res.tx),
          payer: res[0].wallet,
          jitoFee: 1000000,
        });

        return { jitoRes, wallets: res.map((r) => r.wallet) };
      },
      4
    );

    const soldWallets = (
      await Promise.all(
        allSellRes.map(async (r) => {
          const jitoRes = r.jitoRes;
          return { jiroRes: jitoRes, wallets: r.wallets };
        })
      )
    )
      .filter((w) => w.jiroRes.confirmed)
      .map((w) => w.wallets)
      .flat();

    successfulSoldWallets.push(...soldWallets);

    walletsWithBalances = walletsWithBalances.filter((walletWithBalance) => !soldWallets.find((w) => w.publicKey.equals(walletWithBalance.wallet.publicKey)));

    const resultsGrouped = _.groupBy(results, (r) => r.result);
    console.log(
      "results",
      Object.keys(resultsGrouped).map((k) => `${k}: ${resultsGrouped[k].length}`)
    );
  }

  return { successfulSoldWallets };
}

async function sellAll(args: { wallet: Keypair; token: PublicKey; pool: PublicKey }) {
  try {
    // get pda token account
    const associatedTokenAccountAddress = await getAssociatedTokenAddress(args.token, args.wallet.publicKey);

    let balance: RpcResponseAndContext<TokenAmount>;
    try {
      balance = await primaryRpcConnection.getTokenAccountBalance(associatedTokenAccountAddress);

      if (balance.value.uiAmount! < 1) {
        return { result: "already sold" } as const;
      }
    } catch (e) {
      return { result: "no account found", data: e } as const;
    }

    const swapRaydiumInstr = await createSwapRaydiumInstructions({
      amount: balance.value.uiAmount!,
      amountSide: "in",
      type: "sell",
      keypair: args.wallet,
      feePayer: wallet,
      poolId: args.pool,
      slippage: new Percent(10, 100),
    });

    const { transaction: swapTx, blockhash: swapBlockhash } = await createTransactionForInstructions({
      instructions: swapRaydiumInstr.instructions,
      signers: swapRaydiumInstr.signers,
      wallet: args.wallet.publicKey.toBase58(),
    })

    const res = await sendAndConfirmTransactionAndRetry(swapTx, swapBlockhash)

    if (res.confirmedResult.value.err)
      return {
        result: "tx error",
        error: res.confirmedResult.value.err,
      } as const;

    return {
      result: "sold",
      data: res,
    } as const;
  } catch (e) {
    return {
      result: "error",
      data: e,
    };
  }
}

/* if (require.main === module) {
  async function main() {
    const adr = ''
    const pool = new PublicKey(adr);

    const { quoteToken } = await getTokensForPool(pool);

    console.log("quoteToken", quoteToken.toBase58());
  }

  main();
} */

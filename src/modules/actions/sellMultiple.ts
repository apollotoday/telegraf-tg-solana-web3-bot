import { Keypair, PublicKey, RpcResponseAndContext, TokenAmount } from "@solana/web3.js";
import { primaryRpcConnection } from "../../config";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import { Percent } from "@raydium-io/raydium-sdk";
import { sendAndConfirmRawTransactionAndRetry } from "../../solUtils";
import fs from "fs";
import { bs58 } from "@project-serum/anchor/dist/cjs/utils/bytes";
import asyncBatch from "async-batch";
import _ from "lodash";
import { createSwapRaydiumInstructions, getTokensForPool, swapRaydium } from "../markets/raydium";
import { loadWalletFromEnv } from "../wallet/walletUtils";
import { sendAndConfirmJitoBundle, sendAndConfirmJitoTransaction } from "../../jitoUtils";
import { filterTruthy, sleep } from "../../utils";
import { getDevWallet } from "../../testUtils";
import { createTransactionForInstructions } from '../solTransaction/solTransactionUtils';
import { sendAndConfirmTransactionAndRetry } from '../solTransaction/solSendTransactionUtils';

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

  const startTime = Date.now();

  let walletsWithBalances = (
    await asyncBatch(
      wallets,
      async (wallet) => {
        try {
          const associatedTokenAccountAddress = await getAssociatedTokenAddress(token, wallet.publicKey);

          let balance = await primaryRpcConnection.getTokenAccountBalance(associatedTokenAccountAddress);
          return { wallet, balance };
        } catch (e) {
          console.log(`error at checking wallet ${wallet.publicKey.toBase58()}`, e);
        }
      },
      10
    )
  )
    .filter(filterTruthy)
    .filter((w) => Number(w.balance.value.amount)! > 1);

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
    const allSellRes = (
      await asyncBatch(
        [...walletsWithBalances],
        async (walletBalance) => {
          console.log(`selling all for wallets: ${walletBalance.wallet.publicKey.toBase58()}`);
          try {
            const swapRaydiumRes = await swapRaydium({
              amount: walletBalance.balance.value.uiAmount!,
              amountSide: "in",
              type: "sell",
              keypair: walletBalance.wallet,
              poolId: args.pool,
              slippage: new Percent(100, 100),
            });
            if (!swapRaydiumRes.tx) throw new Error("no tx");

            const res = sendAndConfirmRawTransactionAndRetry(swapRaydiumRes.tx);

            return { res, wallet: walletBalance.wallet };
          } catch (e) {
            console.log(`error at walletBalance ${walletBalance.wallet.publicKey.toBase58()} with balance ${walletBalance.balance.value.uiAmount!}`, e);
            return null;
          }
        },
        20
      )
    ).filter(filterTruthy);

    // for (const r of res) {
    //   await sendAndConfirmRawTransactionAndRetry(r.res.tx);
    // }

    const soldWallets = (
      await Promise.all(
        allSellRes.map(async (r) => {
          const res = await r.res;
          return { res: res, wallet: r.wallet };
        })
      )
    )
      .filter((w) => !w.res.confirmedResult.value.err)
      .map((w) => w.wallet);

    successfulSoldWallets.push(...soldWallets);

    walletsWithBalances = walletsWithBalances.filter((walletWithBalance) => !soldWallets.find((w) => w.publicKey.equals(walletWithBalance.wallet.publicKey)));
  }

  console.log(`successfully rugged ${successfulSoldWallets.length} wallets in ${Date.now() - startTime}ms`);

  console.log(`closing all token accounts`);

  const closeAllWalletsRes = await Promise.all(
    wallets.map(async (wallet) => {
      const associatedTokenAccountAddress = await getAssociatedTokenAddress(token, wallet.publicKey);
      const tx = new VersionedTransaction(
        new TransactionMessage({
          instructions: [
            ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 5001 }),
            ComputeBudgetProgram.setComputeUnitLimit({ units: 100_000 }),
            createCloseAccountInstruction(associatedTokenAccountAddress, wallet.publicKey, wallet.publicKey),
          ],
          payerKey: wallet.publicKey,
          recentBlockhash: (await connection.getLatestBlockhash()).blockhash,
        }).compileToV0Message()
      );

      await tx.sign([wallet]);
      return await sendAndConfirmRawTransactionAndRetry(tx);
    })
  );

  const closedAllTokenAccount = closeAllWalletsRes.every((r) => !r.confirmedResult.value.err);

  console.log(`closed all token accounts: ${closedAllTokenAccount}`);

  return { successfulSoldWallets };
}

export async function rugJito(args: { pool: PublicKey; wallets: Keypair[] }) {
  const { quoteToken: token } = await getTokensForPool(args.pool);
  let wallets = args.wallets;

  const startTime = Date.now();

  let walletsWithBalances = (
    await asyncBatch(
      wallets,
      async (wallet) => {
        try {
          const associatedTokenAccountAddress = await getAssociatedTokenAddress(token, wallet.publicKey);

          let balance = await connection.getTokenAccountBalance(associatedTokenAccountAddress);
          return { wallet, balance };
        } catch (e) {
          console.log(`error at checking wallet ${wallet.publicKey.toBase58()}`, e);
        }
      },
      10
    )
  )
    .filter(filterTruthy)
    .filter((w) => Number(w.balance.value.amount)! > 1);

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
    const allSellRes = (
      await asyncBatch(
        [...walletsWithBalances],
        async (walletBalance) => {
          console.log(`selling all for wallets: ${walletBalance.wallet.publicKey.toBase58()}`);
          try {
            const swapRaydiumRes = await createSwapRaydiumInstructions({
              amount: walletBalance.balance.value.uiAmount!,
              amountSide: "in",
              type: "sell",
              keypair: walletBalance.wallet,
              poolId: args.pool,
              slippage: new Percent(100, 100),
            });

            const res = sendAndConfirmJitoTransaction({
              payer: walletBalance.wallet,
              instructions: swapRaydiumRes.instructions,
              signers: swapRaydiumRes.signers as Keypair[],
            });

            // rate limit 5 per second
            await sleep(800)

            return { res, wallet: walletBalance.wallet };
          } catch (e) {
            console.log(`error at walletBalance ${walletBalance.wallet.publicKey.toBase58()} with balance ${walletBalance.balance.value.uiAmount!}`, e);
            return null;
          }
        },
        5
      )
    ).filter(filterTruthy);

    // for (const r of res) {
    //   await sendAndConfirmRawTransactionAndRetry(r.res.tx);
    // }

    const soldWallets = (
      await Promise.all(
        allSellRes.map(async (r) => {
          const res = await r.res;
          return { res: res, wallet: r.wallet };
        })
      )
    )
      .filter((w) => w.res.confirmed && !w.res.confirmedResult!.value.err)
      .map((w) => w.wallet);

    successfulSoldWallets.push(...soldWallets);

    walletsWithBalances = walletsWithBalances.filter((walletWithBalance) => !soldWallets.find((w) => w.publicKey.equals(walletWithBalance.wallet.publicKey)));
  }

  console.log(`successfully rugged ${successfulSoldWallets.length} wallets in ${Date.now() - startTime}ms`);

  console.log(`closing all token accounts`);

  const closeAllWalletsRes = await Promise.all(
    wallets.map(async (wallet) => {
      const associatedTokenAccountAddress = await getAssociatedTokenAddress(token, wallet.publicKey);
      const tx = new VersionedTransaction(
        new TransactionMessage({
          instructions: [
            ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 5001 }),
            ComputeBudgetProgram.setComputeUnitLimit({ units: 100_000 }),
            createCloseAccountInstruction(associatedTokenAccountAddress, wallet.publicKey, wallet.publicKey),
          ],
          payerKey: wallet.publicKey,
          recentBlockhash: (await connection.getLatestBlockhash()).blockhash,
        }).compileToV0Message()
      );

      await tx.sign([wallet]);
      return await sendAndConfirmRawTransactionAndRetry(tx);
    })
  );

  const closedAllTokenAccount = closeAllWalletsRes.every((r) => !r.confirmedResult.value.err);

  console.log(`closed all token accounts: ${closedAllTokenAccount}`);

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

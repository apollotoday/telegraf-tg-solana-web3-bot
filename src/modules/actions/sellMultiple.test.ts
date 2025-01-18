import { Percent } from "@raydium-io/raydium-sdk";
import { primaryRpcConnection, goatPool } from "../../config";
import { computeRaydiumAmounts, getTokensForPool, swapRaydium } from "../markets/raydium";
import { getDevWallet } from "../../testUtils";
import {
  ComputeBudgetInstruction,
  ComputeBudgetProgram,
  Keypair,
  sendAndConfirmTransaction,
  SystemProgram,
  Transaction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import { sendAndConfirmTransactionAndRetry } from "../solTransaction/solSendTransactionUtils";
import { sendAndConfirmVersionedTransactionAndRetry, solToLamports } from "../../solUtils";
import { transferTokenInstruction } from "../utils/splUtils";
import { sellMultiple } from "./sellMultiple";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import { sleep } from "../../utils";
import { loadWalletFromEnv } from "../wallet/walletUtils";

test("sell all", async () => {
  const { quoteToken } = await getTokensForPool(goatPool);

  const devWallet = loadWalletFromEnv("RIGGGED_VOLUMNE_BOT") ?? getDevWallet();

  const calculateBuyRes = await computeRaydiumAmounts({
    amount: 0.001,
    amountSide: "in",
    type: "buy",
    keypair: devWallet,
    poolId: goatPool,
    slippage: new Percent(10, 100),
  });

  const buyAmount = Number(calculateBuyRes.amountOut.toExact());

  const buyRes = await swapRaydium({
    amount: buyAmount,
    amountSide: "out",
    type: "buy",
    keypair: devWallet,
    poolId: goatPool,
    slippage: new Percent(10, 100),
  });

  const buyTxRes = await sendAndConfirmVersionedTransactionAndRetry({transaction: buyRes.tx, useStakedRpc: true});
  if (buyTxRes.confirmedResult.value.err) throw new Error("buy tx failed");

  console.log("buy tx confirmed", buyTxRes.txSig);

  const testWalletSize = 20;

  const wallets = await Promise.all(
    Array.from({ length: testWalletSize }).map(async () => {
      const wallet = Keypair.generate();

      const instruction = [
        ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 5001 }),
        ComputeBudgetProgram.setComputeUnitLimit({ units: 100_000 }),
        SystemProgram.transfer({ fromPubkey: devWallet.publicKey, toPubkey: wallet.publicKey, lamports: solToLamports(0.01) }),
        ...(await transferTokenInstruction({
          mint: quoteToken,
          from: devWallet.publicKey,
          to: wallet.publicKey,
          amount: Math.floor((buyAmount / (testWalletSize - 1)) * 10 ** 6),
        })),
      ];

      const tx = new VersionedTransaction(
        new TransactionMessage({
          instructions: instruction,
          payerKey: devWallet.publicKey,
          recentBlockhash: (await primaryRpcConnection.getLatestBlockhash()).blockhash,
        }).compileToV0Message()
      );
      await tx.sign([devWallet]);

      const txRes = await sendAndConfirmVersionedTransactionAndRetry({transaction: tx, useStakedRpc: true});
      return {wallet, txRes};
    })
  );

  console.log("successfully distributed funds to wallets");

  let walletBalances = await Promise.all(
    wallets.map(async (wallet) => {
      const tokenAccount = await getAssociatedTokenAddress(quoteToken, wallet.wallet.publicKey);
      console.log(`tokenAccount ${tokenAccount.toBase58()}`);
      const res = await primaryRpcConnection.getTokenAccountBalance(tokenAccount);
      return { value: res, wallet: wallet.wallet.publicKey, txRes: wallet.txRes };
    })
  )

  console.log(
    "walletBalances",
    walletBalances.map((w) => ({ balance: w.value.value.uiAmount, wallet: w.wallet.toBase58() }))
  );

  await sellMultiple({ pool: goatPool, wallets: wallets.map((w) => w.wallet) });

  await sleep(10000);

  const closeAllWalletsRes = await Promise.all(
    wallets.map(async (wallet) => {
      const res = await primaryRpcConnection.getTokenAccountBalance(await getAssociatedTokenAddress(quoteToken, wallet.wallet.publicKey));

      return { value: res, wallet: wallet.wallet.publicKey, txRes: wallet.txRes };
    })
  );

  const allWalletsClosed = closeAllWalletsRes.every((res) => res.txRes.confirmedResult.value.err === null);
  console.log("allWalletsClosed", allWalletsClosed);
});

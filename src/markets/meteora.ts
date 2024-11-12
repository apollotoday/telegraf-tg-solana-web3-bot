import { Keypair, PublicKey, TransactionMessage, VersionedTransaction } from "@solana/web3.js";

import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from "@solana/spl-token";

import AmmImpl, { MAINNET_POOL } from "@mercurial-finance/dynamic-amm-sdk";
import { Wallet, AnchorProvider, BN } from "@project-serum/anchor";
import { connection, meteoraDynPool } from "../config";
import { calculatePartionedSwapAmount } from "../calculationUtils";
import { Transaction } from "@solana/web3.js";
import { ComputeBudgetProgram } from "@solana/web3.js";

// Connection, Wallet, and AnchorProvider to interact with the network

export async function getMeteoraPool(pubkey: PublicKey) {
  const pool = await AmmImpl.create(connection, new PublicKey(pubkey));
  return pool;
}

export type MeteoraSwapInput = {
  swapWallet: Keypair;
  feePayer: Keypair;
  inLamports: number;
  slippage: number;
  pool: PublicKey;
  type?: "buy" | "sell";
};

export async function swap(input: MeteoraSwapInput) {
  const { type = "buy" } = input;

  const pool = await getMeteoraPool(input.pool);
  console.log("pool", pool.address);

  const inToken = type === "buy" ? pool.tokenAMint : pool.tokenBMint;
  const outToken = type === "buy" ? pool.tokenBMint : pool.tokenAMint;

  //const inAmountLamport = typeof input.inLamports == "number" ? new BN(input.inLamports * 10 ** inToken.decimals) : input.inLamports;
  const inAmountLamport = new BN(input.inLamports);

  // Swap SOL → TOKEN
  const { minSwapOutAmount, swapOutAmount } = pool.getSwapQuote(inToken.address, inAmountLamport, input.slippage);

  const minOutAmount = minSwapOutAmount;

  const _swapTx = await pool.swap(input.swapWallet.publicKey, inToken.address, inAmountLamport, minOutAmount);
  _swapTx.feePayer = input.feePayer.publicKey;

  const recentBlockhash = await connection.getLatestBlockhash();

  const txMsg = new TransactionMessage({
    instructions: _swapTx.instructions,
    payerKey: input.feePayer.publicKey,
    recentBlockhash: recentBlockhash.blockhash,
  }).compileToV0Message();

  const swapTx = new VersionedTransaction(txMsg);

  swapTx.sign([input.swapWallet, input.feePayer]);

  console.log("input.swapWallet", input.swapWallet.publicKey.toBase58());

  console.log("sending swap tx");
  //const swapResult = await provider.sendAndConfirm(swapTx);

  console.log(
    `Swap ${input.inLamports / 10 ** inToken.decimals} ${inToken.address} to ${swapOutAmount.toNumber() / 10 ** outToken.decimals} ${outToken.address}`
  );

  return {
    swapTx,
    inToken,
    outToken,
    minOutAmount: minOutAmount.toNumber(),
    outAmountLamport: swapOutAmount.toNumber(),
    pool,
  };
}

export async function buySell(input: MeteoraSwapInput) {
  const { type = "AToB" } = input;

  const pool = await getMeteoraPool(input.pool);
  console.log("pool", pool.address);

  const inToken = pool.tokenAMint;
  const outToken = pool.tokenBMint;

  //const inAmountLamport = typeof input.inLamports == "number" ? new BN(input.inLamports * 10 ** inToken.decimals) : input.inLamports;
  const inAmountLamport = new BN(input.inLamports);

  // Swap SOL → TOKEN
  const buyQuote = pool.getSwapQuote(inToken.address, inAmountLamport, input.slippage);
  const sellQuote = pool.getSwapQuote(outToken.address, buyQuote.swapOutAmount, input.slippage);

  const [buyTx, sellTx] = await Promise.all([
    pool.swap(input.swapWallet.publicKey, inToken.address, inAmountLamport, buyQuote.minSwapOutAmount),
    pool.swap(input.swapWallet.publicKey, outToken.address, buyQuote.swapOutAmount, sellQuote.minSwapOutAmount),
  ]);

  buyTx.recentBlockhash;
  console.log("buyTx latestBlockhash", buyTx.recentBlockhash);

  buyTx.feePayer = input.feePayer.publicKey;
  sellTx.feePayer = input.feePayer.publicKey;

  //swapTx.sign(input.feePayer);
  buyTx.sign(input.swapWallet);
  sellTx.sign(input.swapWallet);

  console.log("input.swapWallet", input.swapWallet.publicKey.toBase58());

  console.log("sending swap tx");
  //const swapResult = await provider.sendAndConfirm(swapTx);

  console.log(
    `Swap ${input.inLamports / 10 ** inToken.decimals} ${inToken.address} to ${buyQuote.swapOutAmount.toNumber() / 10 ** outToken.decimals} ${outToken.address}`
  );
  console.log(`
    Swap ${buyQuote.swapOutAmount.toNumber() / 10 ** inToken.decimals} ${outToken.address} to ${sellQuote.swapOutAmount.toNumber() / 10 ** outToken.decimals} ${
    inToken.address
  }`);

  return {
    buyTx,
    sellTx,
    inToken,
    outToken,
    pool,
  };
}

export async function buySellVersioned(input: MeteoraSwapInput) {
  const pool = await getMeteoraPool(input.pool);
  console.log("pool", pool.address);

  const inToken = pool.tokenAMint;
  const outToken = pool.tokenBMint;

  //const inAmountLamport = typeof input.inLamports == "number" ? new BN(input.inLamports * 10 ** inToken.decimals) : input.inLamports;
  const inAmountLamport = new BN(input.inLamports);

  const [_buyAmount1, _buyAmount2] = calculatePartionedSwapAmount(input.inLamports, 2, 0.1);

  const buyAmount1 = new BN(_buyAmount1);
  const buyAmount2 = new BN(_buyAmount2);

  // Swap SOL → TOKEN
  const buyQuote1 = pool.getSwapQuote(inToken.address, inAmountLamport, input.slippage);
  const buyQuote2 = pool.getSwapQuote(inToken.address, buyAmount2, input.slippage);

  let sellAmount = new BN((buyQuote1.swapOutAmount.toNumber() + buyQuote2.swapOutAmount.toNumber()) * 0.95);
  sellAmount = new BN(buyQuote1.swapOutAmount.toNumber() * 0.95);
  const sellQuote = pool.getSwapQuote(outToken.address, sellAmount, input.slippage);

  console.log("buyQuote.swapOutAmount", sellAmount.toNumber());

  const [_buyTx1, _buyTx2, _sellTx] = await Promise.all([
    pool.swap(input.swapWallet.publicKey, inToken.address, inAmountLamport, buyQuote1.minSwapOutAmount),
    pool.swap(input.swapWallet.publicKey, inToken.address, buyAmount2, buyQuote2.minSwapOutAmount),
    pool.swap(input.swapWallet.publicKey, outToken.address, sellAmount, sellQuote.minSwapOutAmount),
  ]);

  function convertToVersionedTransaction(tx: Transaction) {
    return new VersionedTransaction(
      new TransactionMessage({
        instructions: [...tx.instructions],
        payerKey: input.feePayer.publicKey,
        recentBlockhash: tx.recentBlockhash!,
      }).compileToV0Message()
    );
  }
  const buyTx1 = convertToVersionedTransaction(_buyTx1);
  const buyTx2 = convertToVersionedTransaction(_buyTx2);
  const sellTx = convertToVersionedTransaction(_sellTx);

  //swapTx.sign(input.feePayer);
  buyTx1.sign([input.swapWallet]);
  buyTx2.sign([input.swapWallet]);
  sellTx.sign([input.swapWallet]);

  console.log("input.swapWallet", input.swapWallet.publicKey.toBase58());

  console.log("sending swap tx");
  //const swapResult = await provider.sendAndConfirm(swapTx);

  console.log(
    `Swap ${input.inLamports / 10 ** inToken.decimals} ${inToken.address} to ${buyQuote1.swapOutAmount.toNumber() / 10 ** outToken.decimals} ${
      outToken.address
    }`
  );
  console.log(`
    Swap ${sellAmount.toNumber() / 10 ** inToken.decimals} ${outToken.address} to ${sellQuote.swapOutAmount.toNumber() / 10 ** outToken.decimals} ${
    inToken.address
  }`);

  return {
    buyTx1,
    buyTx2,
    sellTx,
    inToken,
    outToken,
    pool,
  };
}

export async function fakeVolumne(args: { wallet: Keypair; amountLamports: number }) {
  const buyAmount1 = args.amountLamports * 0.52;
  const buyAmount2 = args.amountLamports * 0.48;

  const [buyRes1, buyRes2] = await Promise.all([
    swap({
      inLamports: buyAmount1,
      swapWallet: args.wallet,
      slippage: 50,
      feePayer: args.wallet,
      pool: new PublicKey(meteoraDynPool),
    }),
    swap({
      inLamports: buyAmount2,
      swapWallet: args.wallet,
      slippage: 50,
      feePayer: args.wallet,
      pool: new PublicKey(meteoraDynPool),
    }),
  ]);

  const sellAmount = buyRes1.outAmountLamport + buyRes2.outAmountLamport;

  const sellRes = await swap({
    inLamports: sellAmount,
    swapWallet: args.wallet,
    slippage: 50,
    feePayer: args.wallet,
    pool: new PublicKey(meteoraDynPool),
    type: "sell",
  });

  await sendAndConfirmJitoTransactions([buyRes1.swapTx, buyRes2.swapTx, sellRes.swapTx], args.wallet);
}

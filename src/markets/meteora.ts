import { Keypair, PublicKey, TransactionMessage, VersionedTransaction } from "@solana/web3.js";

import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from "@solana/spl-token";

import AmmImpl, { MAINNET_POOL } from "@mercurial-finance/dynamic-amm-sdk";
import { Wallet, AnchorProvider, BN } from "@project-serum/anchor";
import { connection, meteoraDynPool } from "../config";

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
  direction?: "AToB" | "BToA";
};

export async function swap(input: MeteoraSwapInput) {
  const { direction = "AToB" } = input;

  const pool = await getMeteoraPool(input.pool);
  console.log("pool", pool.address);

  const inToken = direction === "AToB" ? pool.tokenAMint : pool.tokenBMint;
  const outToken = direction === "AToB" ? pool.tokenBMint : pool.tokenAMint;

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
  const { direction = "AToB" } = input;

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
  const { direction = "AToB" } = input;

  const pool = await getMeteoraPool(input.pool);
  console.log("pool", pool.address);

  const inToken = pool.tokenAMint;
  const outToken = pool.tokenBMint;

  //const inAmountLamport = typeof input.inLamports == "number" ? new BN(input.inLamports * 10 ** inToken.decimals) : input.inLamports;
  const inAmountLamport = new BN(input.inLamports);

  // Swap SOL → TOKEN
  const buyQuote = pool.getSwapQuote(inToken.address, inAmountLamport, input.slippage);
  const sellQuote = pool.getSwapQuote(outToken.address, buyQuote.swapOutAmount, input.slippage);

  const [_buyTx, _sellTx] = await Promise.all([
    pool.swap(input.swapWallet.publicKey, inToken.address, inAmountLamport, buyQuote.minSwapOutAmount),
    pool.swap(input.swapWallet.publicKey, outToken.address, buyQuote.swapOutAmount, sellQuote.minSwapOutAmount),
  ]);

  const buyTx = new VersionedTransaction(
    new TransactionMessage({
      instructions: _buyTx.instructions,
      payerKey: input.feePayer.publicKey,
      recentBlockhash: _buyTx.recentBlockhash!,
    }).compileToV0Message()
  );

  const sellTx = new VersionedTransaction(
    new TransactionMessage({
      instructions: _sellTx.instructions,
      payerKey: input.feePayer.publicKey,
      recentBlockhash: _sellTx.recentBlockhash!,
    }).compileToV0Message()
  );

  //swapTx.sign(input.feePayer);
  buyTx.sign([input.swapWallet]);
  sellTx.sign([input.swapWallet]);

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
    direction: "BToA",
  });

  await sendAndConfirmJitoTransactions([buyRes1.swapTx, buyRes2.swapTx, sellRes.swapTx], args.wallet);
}

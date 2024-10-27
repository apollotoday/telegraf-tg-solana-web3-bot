import { Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction, TransactionMessage, VersionedTransaction } from "@solana/web3.js";
import axios, { AxiosError } from "axios";
import base58 from "bs58";
import { connection, jitoFee } from "./config";

export const sendAndConfirmJitoTransactions = async (transactions: VersionedTransaction[] | Transaction[], payer: Keypair) => {
  console.log("Starting Jito transaction execution...");
  const tipAccounts = [
    "Cw8CFyM9FkoMi7K7Crf6HNQqf4uEMzpKw6QNghXLvLkY",
    "DttWaMuVvTiduZRnguLF7jNxTgiMBZ1hyAumKUiL2KRL",
    "96gYZGLnJYVFmbjzopPSU6QiEV5fGqZNyN9nmNhvrZU5",
    "3AVi9Tg9Uo68tJfuvoKvqKNWKkC5wPdSSdeBnizKZ6jT",
    "HFqU5x63VTqvQss8hp11i4wVV8bD44PvwucfZ2bU7gRe",
    "ADaUMid9yfUytqMBgopwjb2DTLSokTSzL1zt6iGPaS49",
    "ADuUkR4vqLUMWXxW9gh6D6L8pMSawimctcNZ5pGwDcEt",
    "DfXygSm4jCyNCybVYYK6DwvWqjKee8pbDmJGcLWNDXjh",
  ];
  const jitoFeeWallet = new PublicKey(tipAccounts[Math.floor(tipAccounts.length * Math.random())]);

  console.log(`Selected Jito fee wallet: ${jitoFeeWallet.toBase58()}`);

  try {
    console.log(`Calculated fee: ${jitoFee / LAMPORTS_PER_SOL} sol`);
    let latestBlockhash = await connection.getLatestBlockhash();
    const jitTipTxFeeMessage = new TransactionMessage({
      payerKey: payer.publicKey,
      recentBlockhash: latestBlockhash.blockhash,
      instructions: [
        SystemProgram.transfer({
          fromPubkey: payer.publicKey,
          toPubkey: jitoFeeWallet,
          lamports: jitoFee,
        }),
      ],
    }).compileToV0Message();

    const jitoFeeTx = new VersionedTransaction(jitTipTxFeeMessage);
    jitoFeeTx.sign([payer]);

    const jitoTxsignature = base58.encode(jitoFeeTx.signatures[0]);

    // Serialize the transactions once here
    const serializedjitoFeeTx = base58.encode(jitoFeeTx.serialize());
    const serializedTransactions = [serializedjitoFeeTx];
    for (let i = 0; i < transactions.length; i++) {
      const serializedTransaction = base58.encode(transactions[i].serialize());
      serializedTransactions.push(serializedTransaction);
    }

    const endpoints = [
      // "https://ny.mainnet.block-engine.jito.wtf/api/v1/bundles",
      // "https://tokyo.mainnet.block-engine.jito.wtf/api/v1/bundles",
      // 'https://amsterdam.mainnet.block-engine.jito.wtf/api/v1/bundles',
      "https://frankfurt.mainnet.block-engine.jito.wtf/api/v1/bundles",
      // 'https://mainnet.block-engine.jito.wtf/api/v1/bundles',
    ];

    const requests = endpoints.map((url) =>
      axios.post(url, {
        jsonrpc: "2.0",
        id: 1,
        method: "sendBundle",
        params: [serializedTransactions],
      })
    );

    console.log("Sending transactions to endpoints...");

    const results = await Promise.all(requests.map((p) => p.catch((e) => e)));

    const signatures = transactions.map((tx) => {
      if (tx instanceof VersionedTransaction) {
        return base58.encode(tx.signatures[0]);
      } else {
        return base58.encode(tx.signatures[0].signature!);
      }
    });
    console.log("jito results", signatures);

    const successfulResults = results.filter((result) => !(result instanceof Error));

    if (successfulResults.length > 0) {
      console.log(`Successful response`);

      const confirmation = await connection.confirmTransaction(
        {
          signature: jitoTxsignature,
          lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
          blockhash: latestBlockhash.blockhash,
        },
        "confirmed"
      );

      console.log(confirmation);

      return { confirmed: !confirmation.value.err, jitoTxsignature };
    } else {
      console.log(`No successful responses received for jito`);
    }

    return { confirmed: false };
  } catch (error) {
    if (error instanceof AxiosError) {
      console.log("Failed to execute jito transaction");
    }
    console.log("Error during transaction execution", error);
    return { confirmed: false };
  }
};

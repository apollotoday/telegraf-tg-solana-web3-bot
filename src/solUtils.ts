import { LAMPORTS_PER_SOL, PublicKey, SystemProgram, TransactionInstruction, VersionedTransaction } from "@solana/web3.js";
import { connection } from "./config";
import reattempt from "reattempt";

export class Sol {
  constructor(public lamports: number) {
    this.lamports = lamports;
  }

  get sol() {
    return this.lamports / 10 ** 9;
  }

  static fromLamports(lamports: number): Sol {
    return new Sol(lamports);
  }

  static fromSol(sol: number): Sol {
    return new Sol(sol * 10 ** 9);
  }
}

export function solTransfer({ solAmount, from, to }: { solAmount: number; from: string; to: string }) {
  const lamports = solAmount * LAMPORTS_PER_SOL;

  const solTransfInx: TransactionInstruction = SystemProgram.transfer({
    fromPubkey: new PublicKey(from),
    toPubkey: new PublicKey(to),
    lamports: solAmount,
  });

  return solTransfInx;
}

export async function sendAndConfirmRawTransactionAndRetry(transaction: VersionedTransaction) {
  try {
    const latestBlockHash = await connection.getLatestBlockhash();
    const { txSig, confirmedResult } = await reattempt.run({ times: 3, delay: 200 }, async () => {
      console.log(`Sending transaction`);
      const [tx1, tx2, tx3] = await Promise.all([
        connection.sendTransaction(transaction, {
          skipPreflight: true,
        }),
        connection.sendTransaction(transaction, {
          skipPreflight: true,
        }),
        connection.sendTransaction(transaction, {
          skipPreflight: true,
        }),
        connection.sendTransaction(transaction, {
          skipPreflight: true,
        }),
        connection.sendTransaction(transaction, {
          skipPreflight: true,
        }),
        connection.sendTransaction(transaction, {
          skipPreflight: true,
        }),
        connection.sendTransaction(transaction, {
          skipPreflight: true,
        }),
      ]);

      console.log(`Sent transaction`, { tx1 });

      const confirmedResult = await confirmTransactionSignatureAndRetry(tx1, {
        ...latestBlockHash,
      });

      console.log(`Confirmed transaction`, confirmedResult);

      return { txSig: tx1, confirmedResult };
    });
    console.log({ txSig, confirmedResult });
    console.log("Successfully sent transaction: ", txSig);
    return { txSig, confirmedResult };
  } catch (e) {
    console.error("Failed to send transaction: ", e);
    throw new Error("Please retry! Failed to send transaction: " + e);
  }
}

export async function confirmTransactionSignatureAndRetry(
  txSig: string,
  blockhash: {
    blockhash: string;
    lastValidBlockHeight: number;
  },
  skipConfirmation?: boolean
) {
  try {
    return await reattempt.run({ times: 3, delay: 200 }, async () => {
      return await connection.confirmTransaction(
        {
          blockhash: blockhash.blockhash,
          lastValidBlockHeight: blockhash.lastValidBlockHeight,
          signature: txSig,
        },
        "confirmed"
      );
    });
  } catch (e) {
    console.error("Failed to confirm transaction: ", e);
    throw new Error("Please retry! Failed to confirm transaction: " + e);
  }
}

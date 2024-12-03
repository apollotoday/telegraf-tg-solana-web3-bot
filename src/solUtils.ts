import {
  ComputeBudgetProgram,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import { connection } from "./config";
import reattempt from "reattempt";
import { sleep } from "./utils";

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

export async function sendSol(args: { from: Keypair; to: PublicKey; amount: Sol; feePayer?: Keypair }) {
  const instructions = [
    ComputeBudgetProgram.setComputeUnitPrice({
      microLamports: 5001,
    }),
    SystemProgram.transfer({
      fromPubkey: args.from.publicKey,
      toPubkey: args.to,
      lamports: args.amount.lamports,
    }),
  ];
  const blockhash = await connection.getLatestBlockhash();
  const messageV0 = new TransactionMessage({
    payerKey: args?.feePayer?.publicKey ?? args.from.publicKey,
    recentBlockhash: blockhash.blockhash,
    instructions,
  }).compileToV0Message();

  const transaction = new VersionedTransaction(messageV0);

  // sign your transaction with the required `Signers`
  const signers = [args.from];
  if (args.feePayer) signers.push(args.feePayer);
  transaction.sign(signers);

  // Send the transaction
  return await sendAndConfirmRawTransactionAndRetry(transaction);
}

export async function waitUntilBalanceIsGreaterThan(args: { from: PublicKey; amount: number; waitTime?: number }) {
  const { waitTime = 5000 } = args;
  const waitPerRetry = 500;
  const retries = Math.floor(waitTime / waitPerRetry);

  for (let i = 0; i < retries; i++) {
    const balance = await connection.getBalance(args.from, 'confirmed');
    const balanceFound = balance / LAMPORTS_PER_SOL
    if (balanceFound > args.amount) {
      console.log(`Balance is ${balanceFound} SOL, greater than ${args.amount} SOL, breaking`)
      return { balanceFound: true, balance: balanceFound }
    }

    console.log(`Balance is still ${balanceFound} SOL, waiting for ${waitPerRetry}ms`)
    await sleep(waitPerRetry);
  }

  return { balanceFound: false }
}

export async function closeWallet(args: { from: Keypair; to: Keypair; feePayer?: Keypair; waitTime?: number }) {
  await waitUntilBalanceIsGreaterThan({ from: args.from.publicKey, amount: 0.1, waitTime: args.waitTime })

  const balance = await connection.getBalance(args.from.publicKey, 'confirmed');

  if (balance < (0.1 * LAMPORTS_PER_SOL)) {
    throw new Error(`Balance is less than 0.1 SOL, cannot close wallet`)
  }

  return await sendSol({ from: args.from, to: args.to.publicKey, amount: Sol.fromLamports(balance), feePayer: args.feePayer ?? args.to });
}

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
import fs from "fs";
import base58 from "bs58";
import { sleep } from "./utils";
import _ from "lodash";

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

  static randomFromSol(min: number, max: number): Sol {
    return new Sol(_.random(min * 10 ** 9, max * 10 ** 9));
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
      const [tx1, tx2, tx3] = await Promise.all([
        connection.sendTransaction(transaction, {
          skipPreflight: true,
        }),
        // connection.sendTransaction(transaction, {
        //   skipPreflight: true,
        // }),
        // connection.sendTransaction(transaction, {
        //   skipPreflight: true,
        // }),
        // connection.sendTransaction(transaction, {
        //   skipPreflight: true,
        // }),
        // connection.sendTransaction(transaction, {
        //   skipPreflight: true,
        // }),
        // connection.sendTransaction(transaction, {
        //   skipPreflight: true,
        // }),
        // connection.sendTransaction(transaction, {
        //   skipPreflight: true,
        // }),
      ]);

      console.log(`Sent transaction`, { tx1 });

      const confirmedResult = await confirmTransactionSignatureAndRetry(tx1, {
        ...latestBlockHash,
      });

      console.log(`Confirmed transaction`, confirmedResult);

      return { txSig: tx1, confirmedResult, latestBlockHash };
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

export async function closeWallet(args: { from: Keypair; to: Keypair; feePayer?: Keypair; slotForBalanceCheck?: number; waitTime?: number }) {
  const { waitTime = 5000 } = args;
  const waitPerRetry = 500;
  const retries = Math.floor(waitTime / waitPerRetry);
  let balance = 0;

  for (let i = 0; i < retries; i++) {
    console.log(`Checking balance for ${args.from.publicKey.toBase58()} for the ${i + 1} time`);
    balance = await connection.getBalance(args.from.publicKey, {
      commitment: "confirmed",
      minContextSlot: args.slotForBalanceCheck,
    });
    const balanceSol = balance / LAMPORTS_PER_SOL;
    if (balance > 0) {
      console.log(`Balance is ${balanceSol} SOL`);
      break;
    } else {
      console.log(`Balance is ${balanceSol} SOL, waiting for ${waitPerRetry}ms`);
    }

    await sleep(waitPerRetry);
  }

  return await sendSol({ from: args.from, to: args.to.publicKey, amount: Sol.fromLamports(balance), feePayer: args.feePayer ?? args.to });
}

export function solToLamports(sol: number) {
  return sol * LAMPORTS_PER_SOL;
}

export function lamportsToSol(lamports: number) {
  return lamports / LAMPORTS_PER_SOL;
}

const feePayerFilePath = "rajeetFeePayers.json";

export function loadFeePayers(feePayerCount = 20): Keypair[] {
  if (!fs.existsSync(feePayerFilePath)) {
    const wallets = Array.from({ length: feePayerCount }, () => Keypair.generate());
    const data = wallets.map((wallet) => base58.encode(wallet.secretKey));
    fs.writeFileSync(feePayerFilePath, JSON.stringify(data));
    return wallets;
  }

  const data = JSON.parse(fs.readFileSync(feePayerFilePath, "utf8"));

  return data.map((pkStr: string) => Keypair.fromSecretKey(base58.decode(pkStr)));
}

// if (require.main === module) {
//   const loadedFeePayers = loadFeePayers();
//   // log public keys
//   console.log(loadedFeePayers.slice(0, 2).map((wallet) => wallet.publicKey.toString()));
// }

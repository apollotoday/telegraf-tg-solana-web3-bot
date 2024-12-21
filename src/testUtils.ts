import { Keypair } from "@solana/web3.js";
import base58 from "bs58";
import { Sol } from "./solUtils";

export function getDevWallet(nr = 1) {
  const pkStr = process.env[`DEV_WALLET_${nr}`]!;

  if (!pkStr) throw new Error(`DEV_WALLET_${nr} not found in env`);

  return Keypair.fromSecretKey(base58.decode(pkStr));
}

// OUTDATED
export async function fundTestWallet(args: { amount: Sol }) {
  const testWallet = Keypair.generate();

//   console.log(`created test wallet: ${testWallet.publicKey.toBase58()}`);

//   const devWallet = getDevWallet();

  // fund test wallet
  // await sendSol({ from: devWallet, to: testWallet.publicKey, amount: args.amount });

  return testWallet;
}

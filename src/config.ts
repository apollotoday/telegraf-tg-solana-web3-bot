import { Connection, PublicKey } from "@solana/web3.js";
import "dotenv/config";
import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.join(__dirname, ".env") });

export const BotToken = process.env.BOT_TOKEN!;
export const mainRpc = process.env.SOLANA_RPC!;
export const devRpc = process.env.SOLANA_DEV_RPC!;
export const net: "mainnet-beta" | "devnet" = process.env.NET! as "mainnet-beta" | "devnet";
export const connection = new Connection(net == "mainnet-beta" ? mainRpc : devRpc);
export const jitoFee = 100000; // 47000
export const solAddr = "So11111111111111111111111111111111111111112";
export const solTokenMint = "So11111111111111111111111111111111111111112";
export const tokenAddr = "14h6AkD5uSNzprMKm4yoQuQTymuYVMmmWo8EADEtTNUT";

export const meteoraDynPool = "2huFuBQSA7a1Gree6USKLREYzmJ79YMnMgzYkpwtoC29";

export const fundsToSendForRanking = 0.0031;

export const goatPool = new PublicKey("9Tb2ohu5P16BpBarqd3N27WnkF51Ukfs8Z1GzzLDxVZW");

export const lpPoolForTests = new PublicKey("7G4maaEqLsvPebXRLo94ckSnzq12bRBb9Tz8p51cqF3h");

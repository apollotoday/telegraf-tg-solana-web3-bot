import { Connection, PublicKey } from "@solana/web3.js";
import dotenv from 'dotenv'
import path from 'path';
dotenv.config({ path: path.join(__dirname, '.env') });

export const BotToken = process.env.BOT_TOKEN!
export const mainRpc = process.env.SOLANA_RPC!;
export const devRpc = process.env.SOLANA_DEV_RPC!;
export const net: "mainnet-beta" | "devnet" = process.env.NET! as "mainnet-beta" | "devnet";
export const connection = new Connection(net == "mainnet-beta" ? mainRpc : devRpc);
export const jitoFee = 1000000; // 47000
export const solAddr = "So11111111111111111111111111111111111111112";
export const solTokenMint = "So11111111111111111111111111111111111111112";
export const tokenAddr = "14h6AkD5uSNzprMKm4yoQuQTymuYVMmmWo8EADEtTNUT";

export const meteoraDynPool = "2huFuBQSA7a1Gree6USKLREYzmJ79YMnMgzYkpwtoC29";

export const fundsToSendForRanking = 0.0031;


export const puffPool = new PublicKey("9Tb2ohu5P16BpBarqd3N27WnkF51Ukfs8Z1GzzLDxVZW");
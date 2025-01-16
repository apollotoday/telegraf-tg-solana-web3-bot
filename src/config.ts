import { Connection, PublicKey } from "@solana/web3.js";
import "dotenv/config";
import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.join(__dirname, ".env") });

export const BotToken = process.env.BOT_TOKEN!;
export const devRpc = process.env.SOLANA_DEV_RPC!;
export const net: "mainnet-beta" | "devnet" = process.env.NET! as "mainnet-beta" | "devnet";

const fallbackRpc = process.env.SOLANA_RPC!;

export const heliusBaseRpcURL = "https://mainnet.helius-rpc.com/?api-key=";
export const heliusStakedBasedRpcURL = "https://staked.helius-rpc.com?api-key=";

export const heliusApiKey1 = process.env.HELIUS_API_KEY_1!;
export const heliusApiKey2 = process.env.HELIUS_API_KEY_2!;
export const heliusApiKey3 = process.env.HELIUS_API_KEY_3!;

export const primaryRpcUrl = heliusApiKey1 ? `${heliusBaseRpcURL}${heliusApiKey1}` : fallbackRpc;

export const primaryRpcConnection = new Connection(net == "mainnet-beta" ? primaryRpcUrl : devRpc);
export const primaryStakedRpcConnection = new Connection(net == "mainnet-beta" ? `${heliusStakedBasedRpcURL}${heliusApiKey1}` : devRpc);

export const connection = primaryRpcConnection;

export const alternativeRpcConnections = [
  heliusApiKey2 ? new Connection(`${heliusBaseRpcURL}${heliusApiKey2}`) : null,
  heliusApiKey3 ? new Connection(`${heliusBaseRpcURL}${heliusApiKey3}`) : null,
];

export const alternativeStakedRpcConnections = [
  heliusApiKey2 ? new Connection(`${heliusStakedBasedRpcURL}${heliusApiKey2}`) : null,
  heliusApiKey3 ? new Connection(`${heliusStakedBasedRpcURL}${heliusApiKey3}`) : null,
];


export const jitoFee = 100000; // 47000
export const solAddr = "So11111111111111111111111111111111111111112";
export const solTokenMint = "So11111111111111111111111111111111111111112";
export const tokenAddr = "14h6AkD5uSNzprMKm4yoQuQTymuYVMmmWo8EADEtTNUT";

export const meteoraDynPool = "2huFuBQSA7a1Gree6USKLREYzmJ79YMnMgzYkpwtoC29";

export const fundsToSendForRanking = 0.0031;

export const goatPool = new PublicKey("9Tb2ohu5P16BpBarqd3N27WnkF51Ukfs8Z1GzzLDxVZW");

export const lpPoolForTests = new PublicKey("7G4maaEqLsvPebXRLo94ckSnzq12bRBb9Tz8p51cqF3h");

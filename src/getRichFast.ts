import { Keypair, PublicKey, RpcResponseAndContext, TokenAmount } from "@solana/web3.js";
import { swapRaydium } from "./markets/raydium";
import { connection } from "./config";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import { loadWalletFromEnv } from "./walletUtils";
import { Percent } from "@raydium-io/raydium-sdk";
import { sendAndConfirmRawTransactionAndRetry } from "./solUtils";
import fs from "fs";
import { bs58 } from "@project-serum/anchor/dist/cjs/utils/bytes";
import asyncBatch from "async-batch";

const wallet = loadWalletFromEnv("RAJEET_VOLUMNE_BOT");

export async function rug() {
  const token = new PublicKey("337BWWbicojq2CQuRayWBvaF7VNKt2XzQkLxM6L4pump");

  const pool = new PublicKey("H7H7neVRfLbUQNsqm4Wrq2BGrwbjoBgzFd7Z54jL3xoi");

  const file = "/Users/matthiasschaider/Downloads/ALL";

  const data = fs.readFileSync(file, "utf8");

  const rows = data.split("\n");

  let wallets = rows
    .slice(1, rows.length - 1)
    .map((rows) => rows.split(",")[1])
    .map((pk) => {
      try {
        let pkClean = pk.replace(/\r, /g, "");
        // remove last 2 characters
        pkClean = pkClean.slice(0, pkClean.length - 1);
        return Keypair.fromSecretKey(bs58.decode(pkClean));
      } catch (e) {
        return null;
      }
    })
    .filter(Boolean) as Keypair[];

  console.log("pubkeys", wallets[0].publicKey.toBase58());

  let results: Awaited<ReturnType<typeof sellAll>>[] = [];

  while (wallets.length > 0) {
    results = await asyncBatch(
      [...wallets],
      async (wallet) => {
        console.log(`selling all for ${wallet.publicKey.toBase58()}`);
        const res = await sellAll({ wallet, token, pool });
        if (res.result.includes("sold")) {
          wallets = wallets.filter((w) => w.publicKey.toBase58() !== wallet.publicKey.toBase58());
        }
        return res;
      },
      30
    );
  }

}

async function sellAll(args: { wallet: Keypair; token: PublicKey; pool: PublicKey }) {
  try {
    // get pda token account
    const associatedTokenAccountAddress = await getAssociatedTokenAddress(args.token, args.wallet.publicKey);

    let balance: RpcResponseAndContext<TokenAmount>;
    try {
      balance = await connection.getTokenAccountBalance(associatedTokenAccountAddress);

      if (balance.value.uiAmount! < 1) {
        return { result: "already sold" } as const;
      }
    } catch (e) {
      return { result: "no account found", data: e } as const;
    }

    const sellTx = await swapRaydium({
      amount: balance.value.uiAmount!,
      amountSide: "in",
      type: "sell",
      keypair: args.wallet,
      feePayer: wallet,
      poolId: args.pool,
      slippage: new Percent(10, 100),
    });

    const res = await sendAndConfirmRawTransactionAndRetry(sellTx.tx);

    if (res.confirmedResult.value.err)
      return {
        result: "tx error",
        error: res.confirmedResult.value.err,
      } as const;

    return {
      result: "sold",
      data: res,
    } as const;
  } catch (e) {
    return {
      result: "error",
      data: e,
    };
  }
}

if (require.main === module) {
  rug();
}

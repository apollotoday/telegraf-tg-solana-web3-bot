import { SystemProgram } from "@solana/web3.js";
import { sendAndConfirmJitoTransaction } from "./jitoUtils";
import { getDevWallet } from "./testUtils";

test("jito send Transaction", async () => {
  const devWallet = getDevWallet();

  const res = await sendAndConfirmJitoTransaction({
    payer: devWallet,
    instructions: [
      SystemProgram.transfer({
        fromPubkey: devWallet.publicKey,
        toPubkey: devWallet.publicKey,
        lamports: 1000,
      }),
    ],
  });

  expect(res.confirmed).toBe(true);
});

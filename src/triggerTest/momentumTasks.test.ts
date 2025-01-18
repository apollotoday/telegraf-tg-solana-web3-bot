import { Keypair } from "@solana/web3.js";
import { closeWallet, sendSol, Sol } from "../solUtils";
import { getDevWallet } from "../testUtils";
import { helloWorldTask } from "../trigger/example";
import { awaitFunds, volumneBotTask } from "../trigger/momentumTasks";
import "dotenv/config";
import { sleep } from "../utils";

test("await Funds", async () => {
  console.log("hola");

  const devWallet = getDevWallet();

  const testWallet = Keypair.generate();
  await sendSol({ from: devWallet, to: testWallet.publicKey, amount: Sol.fromSol(0.001) });

  const res = await awaitFunds.trigger({
    pubkey: testWallet.publicKey.toBase58(),
  });

  await sleep(5000);

  await closeWallet({ from: testWallet, to: devWallet });
});

test("volumne bot", async () => {
  console.log("hola");

  const res = await volumneBotTask.trigger({});
});

// async function main() {
//   const res = await helloWorldTask.trigger({});
//   console.log(res);
// }

// if (require.main === module) {
//   main();
// }

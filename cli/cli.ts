import { EJobStatus, EMarketMakingCycleType, EServiceType, EWalletType } from '@prisma/client'
import { createCloseAccountInstruction, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, TransactionInstruction } from '@solana/web3.js'
import { Command } from 'commander'
import _ from 'lodash'
import reattempt from 'reattempt'
import { connection, lpPoolForTests } from '../src/config'
import prisma from '../src/lib/prisma'
import { createBookedServiceAndWallet, getActiveBookedServiceByBotCustomerId } from '../src/modules/customer/bookedService'
import { createBotCustomer, getBotCustomerByName } from '../src/modules/customer/botCustomer'
import { scheduleNextBuyJob, updateBuyJobsWithValues } from '../src/modules/marketMaking/buyMarketMakingHandler'
import {
  getActiveMarketMakingCycleByBotCustomerId,
  setupMarketMakingCycle,
} from '../src/modules/marketMaking/marketMakingService'
import { executeJupiterSwap, getBalances } from '../src/modules/markets/jupiter'
import { getBirdEyeUsdcRate } from '../src/modules/monitor/birdeye'
import { sendAndConfirmTransactionAndRetry } from '../src/modules/solTransaction/solSendTransactionUtils'
import {
  createQuickTransactionForInstructions,
  createTransactionForInstructions,
  groupSendAndConfirmTransactions,
} from '../src/modules/solTransaction/solTransactionUtils'
import { overwriteConsoleLog } from '../src/modules/utils/changeConsoleLogWithTimestamp'
import { exportSniperWallets, exportWallets, jsonToTextForFundingWallets } from '../src/modules/utils/exportUtils'
import { getTokenBalanceForOwner, parseTokenAmount, transferTokenInstruction } from '../src/modules/utils/splUtils'
import { createAndStoreBotCustomerWallets, pickRandomWalletFromCustomer } from '../src/modules/wallet/walletService'
import { sendSolFromWalletToWalletWithCycles } from '../src/modules/solTransaction/solFundingService'
import {
  base58ToUint8Array,
  decryptWallet,
  loadWalletFromU8IntArrayStringified,
  uint8ArrayToBase58,
} from '../src/modules/wallet/walletUtils'
import { closeWallet, getBalanceFromWallets, sendSol, Sol, waitUntilBalanceIsGreaterThan } from '../src/solUtils'
import { sleep } from '../src/utils'
import { getSplTokenByMint } from '../src/modules/splToken/splTokenDBService'
import { buyPumpFunTokens, sellAllPumpFunTokensFromMultipleWalletsInstruction, sellPumpFunTokens, setupPumpFunToken } from '../src/modules/pumpfun/pumpfunService'
import { distributeTotalAmountRandomlyAcrossWallets } from '../src/calculationUtils'
import { rug } from "../src/modules/actions/getRichFast";
import asyncBatch from 'async-batch'

const program = new Command();

const drewTokenMint = new PublicKey("14h6AkD5uSNzprMKm4yoQuQTymuYVMmmWo8EADEtTNUT");

overwriteConsoleLog();

program.command("initMarketMaking").action(async () => {
  const botCustomer = await createBotCustomer({
    name: "Rajeet",
  });

  console.log(`created bot customer ${botCustomer.id}: ${botCustomer.name}`);

  const { walletCount } = await createAndStoreBotCustomerWallets({
    subWalletCount: 24,
    walletType: EWalletType.MARKET_MAKING,
    customerId: botCustomer.id,
  });

  console.log(`created ${walletCount} wallets for market making`);

  const foundWallets = await prisma.botCustomerWallet.findMany({
    where: {
      botCustomerId: botCustomer.id,
      type: EWalletType.MARKET_MAKING,
    },
  });

  console.log(`found ${foundWallets.length} wallets for market making`);

  console.log(foundWallets.map((wallet) => wallet.pubkey));

  const testWallet = foundWallets[0];

  console.log(decryptWallet(testWallet.encryptedPrivKey), "for", testWallet.pubkey);
});

program.command("getParsedTx").action(async () => {
  const detectedTransaction = await connection.getParsedTransaction(
    "5yJEMQTsBguRwsNBbwTX9oV8su5Rcj5BqLVZk4Ynfs63RxUss37XxwE119H94xHSLqqUvafaYYqUgwhmkdhmF78m",
    { commitment: "confirmed", maxSupportedTransactionVersion: 200 }
  );
  console.log(detectedTransaction?.meta?.preTokenBalances, detectedTransaction?.meta?.postTokenBalances);
});

program.command("getBalances").action(async () => {
  const balances = await getBalances({
    txSig: "5yJEMQTsBguRwsNBbwTX9oV8su5Rcj5BqLVZk4Ynfs63RxUss37XxwE119H94xHSLqqUvafaYYqUgwhmkdhmF78m",
    tokenMint: drewTokenMint.toBase58(),
    ownerPubkey: new PublicKey("62z1RHg3VpzM12fmDRftXyqPkXngEfWzibXPUk94WaM1"),
  });
  console.log(balances);
});

program.command("initMarketMakingService").action(async () => {
  const botCustomer = await getBotCustomerByName("SniperOne");

  if (!botCustomer) {
    console.error("bot customer not found");
    return;
  }

  const splToken = await prisma.splToken.create({
    data: {
      name: "JEET",
      symbol: "JEET",
      tokenMint: "337BWWbicojq2CQuRayWBvaF7VNKt2XzQkLxM6L4pump",
      decimals: 6,
      isSPL: true,
    },
  });

  const bookedService = await createBookedServiceAndWallet({
    botCustomerId: botCustomer.id,
    solAmount: 20,
    serviceType: EServiceType.MARKET_MAKING,
    usedSplTokenMint: splToken.tokenMint,
  });

  console.log(`created booked service ${bookedService.id} for market making`);

  const cycle = await prisma.marketMakingCycle.create({
    data: {
      buyMinAmount: 0.1,
      buyMaxAmount: 0.4,
      minDurationBetweenBuyAndSellInSeconds: 10,
      maxDurationBetweenBuyAndSellInSeconds: 20,
      minDurationBetweenJobsInSeconds: 15,
      maxDurationBetweenJobsInSeconds: 60,
      solSpentForCycle: 0,
      maxSolSpentForCycle: 10,
      maxSolEarnedForCycle: 10,
      solEarnedForCycle: 0,
      sellToBuyValueRatio: 0.85,
      type: EMarketMakingCycleType.PUSH,
      botCustomerId: botCustomer.id,
      bookedServiceId: bookedService.id,
      plannedTotalDurationInMinutes: 2400,
      startTimestamp: new Date(),
    },
  });

  console.log(`created market making cycle ${cycle.id} for market making`);

  console.log(`scheduling first buy job for market making cycle ${cycle.id}`);

  const nextJob = await prisma.marketMakingJob.create({
    data: {
      buyStatus: EJobStatus.OPEN,
      sellStatus: EJobStatus.OPEN,
      cycle: {
        connect: {
          id: cycle.id,
        },
      },
      earliestExecutionTimestampForBuy: new Date(Date.now() + 360 * 1000),
    },
  });

  console.log(`scheduled first buy job ${nextJob.id} for market making cycle ${cycle.id}`);
});

program.command("migrateSniperToMarketMaking").action(async () => {
  const botCustomer = await getBotCustomerByName("SniperOne");

  const botCustomerWallets = await prisma.botCustomerWallet.findMany({
    where: {
      botCustomerId: botCustomer.id,
      type: EWalletType.SNIPING,
    },
  });

  console.log(`found ${botCustomerWallets.length} sniper wallets`);

  const newWallets: string[] = [];

  for (const wallet of botCustomerWallets) {
    const keypair = decryptWallet(wallet.encryptedPrivKey);

    const balance = await connection.getBalance(keypair.publicKey);

    console.log(`Wallet: ${keypair.publicKey.toBase58()} -> Balance: ${balance / LAMPORTS_PER_SOL} SOL`);

    if (balance > 0.05 * LAMPORTS_PER_SOL) {
      console.log(`Migrating wallet ${keypair.publicKey.toBase58()} with balance ${balance / LAMPORTS_PER_SOL} SOL`);

      await prisma.botCustomerWallet.update({
        where: {
          pubkey: wallet.pubkey,
        },
        data: {
          type: EWalletType.MARKET_MAKING,
        },
      });

      newWallets.push(keypair.publicKey.toBase58());

      console.log(`Wallet ${keypair.publicKey.toBase58()} migrated to market making`);
    } else {
      console.log(`Skipping wallet ${keypair.publicKey.toBase58()} with balance ${balance / LAMPORTS_PER_SOL} SOL`);
    }
  }

  console.log(`New wallets migrated: ${newWallets.length}`);
});

program.command("sellAll").action(async () => {
  const botCustomer = await getBotCustomerByName("EARLY");

  const botCustomerWallets = await prisma.botCustomerWallet.findMany({
    where: {
      botCustomerId: botCustomer.id,
      // type: EWalletType.SNIPING,
      // latestTokenBalance: {
      //   gt: 0,
      // },
    },
    take: 1000,
  });

  const wallets = await Promise.all(
    botCustomerWallets.map(async (wallet) => {
      const keypair = decryptWallet(wallet.encryptedPrivKey);
      return keypair;
    })
  );

  const pool = lpPoolForTests;

  const res = await rug({ wallets, pool });

  await prisma.botCustomerWallet.updateMany({
    where: {
      pubkey: { in: res.successfulSoldWallets.map((w) => w.publicKey.toBase58()) },
    },
    data: {
      latestTokenBalance: 0,
    },
  });
});

program.command("setupMarketMakingCycle").action(async () => {
  const botCustomer = await getBotCustomerByName("Drew");

  const bookedService = await getActiveBookedServiceByBotCustomerId({
    botCustomerId: botCustomer.id,
    serviceType: EServiceType.MARKET_MAKING,
  });

  await setupMarketMakingCycle({
    bookedService,
    createInput: {
      type: EMarketMakingCycleType.MAINTAIN,
      solSpentForCycle: 0,
      solEarnedForCycle: 0,
      maxSolSpentForCycle: 5,
      maxSolEarnedForCycle: 5,
      buyMinAmount: 0.11,
      buyMaxAmount: 0.63,
      minDurationBetweenBuyAndSellInSeconds: 10,
      maxDurationBetweenBuyAndSellInSeconds: 90,
      minDurationBetweenJobsInSeconds: 50,
      maxDurationBetweenJobsInSeconds: 190,
      isActive: true,
      sellToBuyValueRatio: 0.98,
      startTimestamp: new Date(),
    },
  });
});

program.command("setRequiredFieldsForDrewMarketMaking").action(async () => {
  const botCustomer = await getBotCustomerByName("Drew");

  const cycles = await prisma.marketMakingCycle.findMany({
    where: {
      botCustomerId: botCustomer.id,
    },
  });
});

program
  .command("inspectMarketMakingCycle")
  .option("-c, --customer <customer>", "The customer to inspect")
  .action(async (opts) => {
    const customer = opts.customer;

    const botCustomer = await getBotCustomerByName(customer);

    const cycle = await getActiveMarketMakingCycleByBotCustomerId({
      botCustomerId: botCustomer.id,
    });

    if (!cycle) {
      console.error("no active market making cycle found");
      return;
    }

    const jobs = await prisma.marketMakingJob.findMany({
      where: {
        cycleId: cycle.id,
      },
    });

    const totalBuyAmount = jobs.reduce((acc, curr) => acc + (curr.solSpent ?? 0), 0);
    const totalSellAmount = jobs.reduce((acc, curr) => acc + (curr.solEarned ?? 0), 0);

    console.log(`total buy amount: ${totalBuyAmount} SOL`);
    console.log(`total sell amount: ${totalSellAmount} SOL`);

    const buyAmount24Hr = jobs.reduce(
      (acc, curr) => acc + (curr.executedAtForBuy && curr.executedAtForBuy > new Date(Date.now() - 24 * 60 * 60 * 1000) ? curr.solSpent ?? 0 : 0),
      0
    );
    const sellAmount24Hr = jobs.reduce(
      (acc, curr) => acc + (curr.executedAtForSell && curr.executedAtForSell > new Date(Date.now() - 24 * 60 * 60 * 1000) ? curr.solEarned ?? 0 : 0),
      0
    );

    console.log(`buy amount 24hr: ${buyAmount24Hr} SOL`);
    console.log(`sell amount 24hr: ${sellAmount24Hr} SOL`);
  });

program.command("inspectSniperWallets").action(async () => {
  const botCustomer = await getBotCustomerByName("SniperOne");
});



program.command('getTotalSOLInDB').action(async (e) => {
  const botCustomer = await getBotCustomerByName('Puff')
  const allWallets = await prisma.botCustomerWallet.findMany({
    where: {
      botCustomerId: {
        not: botCustomer.id,
      },
      
    }
  })

  const balances = await Promise.all(
    allWallets.map(async (w) => {
      return reattempt.run({ times: 5, delay: 200 }, async () => {
        const balance = await connection.getBalance(new PublicKey(w.pubkey))
        const solBalance = balance / LAMPORTS_PER_SOL

        console.log(`${w.pubkey} has ${solBalance} SOL`)

        return { solBalance, wallet: w }
      })
    }),
  )

  const totalSOL = balances.reduce((acc, curr) => acc + curr.solBalance, 0)

  const solBalanceByType = balances.reduce((acc, curr) => {
    const walletType = curr.wallet.type
    if (!acc[walletType]) {
      acc[walletType] = 0
    }
    acc[walletType] += curr.solBalance
    return acc
  }, {})

  for (const [type, balance] of Object.entries(solBalanceByType)) {
    console.log(`Total SOL for ${type}: ${balance}`)
  }

  console.log(`Total SOL in DB: ${totalSOL}`)
})

program
  .command("inspectCustomerWallets")
  .option("-c, --customer <customer>", "The customer to inspect")
  .action(async (opts) => {
    const customer = opts.customer;
    const botCustomer = await getBotCustomerByName(customer);

    const bookedService = await getActiveBookedServiceByBotCustomerId({
      botCustomerId: botCustomer.id,
      serviceType: EServiceType.SNIPER,
    })

    if (!botCustomer || !bookedService) {
      console.error("bot customer or booked service not found");
      return;
    }

    const tokenMint = bookedService?.usedSplToken?.tokenMint;
    const splToken = bookedService?.usedSplToken;

    const foundWallets = await prisma.botCustomerWallet.findMany({
      where: {
        botCustomerId: botCustomer.id,
        type: {
          in: [EWalletType.MARKET_MAKING],
        },
      },
    });

    console.log(`found ${foundWallets.length} wallets for market making`);

    console.log(foundWallets.map((wallet) => wallet.pubkey));

    const balances = await Promise.all(
      foundWallets.map(async (w) => {
        const balance = await connection.getBalance(new PublicKey(w.pubkey));
        const solBalance = balance / LAMPORTS_PER_SOL;

        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(new PublicKey(w.pubkey), {
          mint: new PublicKey(tokenMint),
        });

        const tokenAccount = tokenAccounts.value.find((ta) => ta.account.data.parsed.info.mint === tokenMint);

        const tokenBalance = tokenAccount?.account.data.parsed.info.tokenAmount.uiAmount ?? 0;

        console.log(`${w.pubkey} has ${solBalance} SOL & ${tokenBalance} ${splToken.symbol}`);

        await prisma.botCustomerWallet.update({
          where: {
            pubkey: w.pubkey,
          },
          data: {
            latestSolBalance: solBalance,
            latestTokenBalance: tokenBalance,
          },
        });

        return { solBalance, tokenAmount: tokenBalance };
      })
    );

    const solBalance = balances.reduce((acc, curr) => acc + curr.solBalance, 0);
    const tokenBalance = balances.reduce((acc, curr) => acc + (curr.tokenAmount ?? 0), 0);

    const birdEyeUsdcRate: number = (await getBirdEyeUsdcRate(tokenMint)).data.value ?? 0;
    const solUsdcRate: number = (await getBirdEyeUsdcRate("So11111111111111111111111111111111111111112")).data.value ?? 0;

    console.log(`${splToken.symbol}/USDC rate: `, birdEyeUsdcRate.toFixed(8));
    console.log("SOL/USDC rate:", solUsdcRate.toFixed(2));
    console.log("Total SOL balance:", solBalance.toFixed(2), `(~${(solBalance * solUsdcRate).toFixed(2)} USDC)`);
    console.log(
      `Total ${splToken.symbol} token balance:`,
      tokenBalance.toFixed(2),
      `(~${(tokenBalance * birdEyeUsdcRate).toFixed(2)} USDC / ~${((tokenBalance * birdEyeUsdcRate) / solUsdcRate).toFixed(2)} SOL)`
    );
  });

program
  .command("sendMarketMakingFundsToOneWallet")
  .option("-c, --customer <customer>", "The customer to send funds to")
  .option("-w, --wallet <wallet>", "The wallet to send funds to")
  .action(async (opts) => {
    const customer = opts.customer;
    const wallet = opts.wallet;

    if (!wallet) {
      console.error("wallet not found");
      return;
    }

    const targetWalletEnt = await prisma.botCustomerWallet.findFirst({
      where: {
        pubkey: wallet,
      },
    });

    if (!targetWalletEnt) {
      console.error("target wallet not found");
      return;
    }

    const targetWallet = new PublicKey(targetWalletEnt.pubkey);

    const targetWalletSigner = decryptWallet(targetWalletEnt.encryptedPrivKey);

    const botCustomer = await getBotCustomerByName(customer);

    if (!botCustomer) {
      console.error("bot customer not found");
      return;
    }

    const bookedService = await getActiveBookedServiceByBotCustomerId({
      botCustomerId: botCustomer.id,
      serviceType: EServiceType.MARKET_MAKING,
    });

    const splToken = bookedService?.usedSplToken;

    if (!splToken) {
      console.error("spl token not found");
      return;
    }

    const marketMakingWallets = await prisma.botCustomerWallet.findMany({
      where: {
        botCustomerId: botCustomer.id,
        type: EWalletType.MARKET_MAKING,
      },
    });

    console.log(`Sending SOL and ${splToken.symbol} funds from ${marketMakingWallets.length} wallets to ${wallet}`);

    const tokenTransferInstructions: { instructions: TransactionInstruction[]; keypair: Keypair }[] = [];

    for (const marketMakingWallet of marketMakingWallets) {
      if (marketMakingWallet.pubkey === targetWallet.toBase58()) {
        continue;
      }

      const from = decryptWallet(marketMakingWallet.encryptedPrivKey);

      const { tokenAccountPubkey, tokenBalance } = await getTokenBalanceForOwner({
        ownerPubkey: from.publicKey.toBase58(),
        tokenMint: splToken.tokenMint,
      });

      if (!tokenAccountPubkey) {
        console.log("Token account not found for wallet", marketMakingWallet.pubkey);
        continue;
      }

      const transferTokenInstr =
        Number(tokenBalance.amount) > 0
          ? await transferTokenInstruction({
              mint: new PublicKey(splToken.tokenMint),
              from: from.publicKey,
              sourceTokenAccountPubkey: new PublicKey(tokenAccountPubkey),
              to: targetWallet,
              amount: tokenBalance.amount,
            })
          : [];

      console.log(`${marketMakingWallet.pubkey} has ${tokenBalance.amount} ${splToken.symbol}`);

      const closeInstruction = createCloseAccountInstruction(new PublicKey(tokenAccountPubkey), targetWallet, from.publicKey, []);

      tokenTransferInstructions.push({
        instructions: [...transferTokenInstr, closeInstruction],
        keypair: from,
      });
    }

    console.log("Sending token funds to target wallet", tokenTransferInstructions.length);

    await groupSendAndConfirmTransactions(tokenTransferInstructions, targetWalletSigner, 3);

    const solTransferInstructions: { instructions: TransactionInstruction[]; keypair: Keypair }[] = [];

    for (const marketMakingWallet of marketMakingWallets) {
      if (marketMakingWallet.pubkey === targetWallet.toBase58()) {
        continue;
      }

      const from = decryptWallet(marketMakingWallet.encryptedPrivKey);

      const balance = await connection.getBalance(new PublicKey(marketMakingWallet.pubkey));
      const solBalance = balance / LAMPORTS_PER_SOL;

      if (solBalance < 0.01) {
        console.log(`${marketMakingWallet.pubkey} has less than 0.01 SOL, skipping`);
        continue;
      }

      console.log(`${marketMakingWallet.pubkey} has ${solBalance} SOL`);

      solTransferInstructions.push({
        instructions: [
          SystemProgram.transfer({
            fromPubkey: new PublicKey(marketMakingWallet.pubkey),
            toPubkey: targetWallet,
            lamports: Math.floor(solBalance * LAMPORTS_PER_SOL),
          }),
        ],
        keypair: from,
      });
    }

    console.log("Sending SOL funds to target wallet");

    await groupSendAndConfirmTransactions(solTransferInstructions, targetWalletSigner);

    console.log("Deactivating booked service");

    await prisma.bookedService.update({
      where: {
        id: bookedService.id,
      },
      data: {
        isActive: false,
      },
    });

    await prisma.botCustomerWallet.updateMany({
      where: {
        botCustomerId: botCustomer.id,
        type: EWalletType.MARKET_MAKING,
      },
      data: {
        isActive: false,
        latestSolBalance: 0,
        latestTokenBalance: 0,
      },
    });

    console.log("Done!");
  });

program.command("fundMarketMakingWallets").action(async () => {
  const botCustomer = await getBotCustomerByName("Puff");
  const fundingWallet = loadWalletFromU8IntArrayStringified(process.env.PUFF_MAIN_FUNDING_WALLET!);
  const tokenFundingWallet = loadWalletFromU8IntArrayStringified(process.env.PUFF_MAIN_TOKEN_FUNDING_WALLET!);
  const tokenMint = "G9tt98aYSznRk7jWsfuz9FnTdokxS6Brohdo9hSmjTRB";
  const splToken = await prisma.splToken.findFirst({
    where: {
      tokenMint,
    },
  });

  if (!splToken) {
    console.error("spl token not found");
    return;
  }

  if (!botCustomer) {
    console.error("bot customer not found");
    return;
  }

  const foundWallets = await prisma.botCustomerWallet.findMany({
    where: {
      botCustomerId: botCustomer.id,
      type: EWalletType.MARKET_MAKING,
    },
  });

  console.log(fundingWallet.publicKey.toBase58());

  const balanceOfWallet = (await connection.getBalance(fundingWallet.publicKey)) / LAMPORTS_PER_SOL;

  console.log("Balance of funding wallet:", balanceOfWallet);

  const solFundingWallets = foundWallets.filter((wallet, index) => {
    return index % 2 === 0;
  });

  const puffFundingWallets = foundWallets.filter((wallet, index) => {
    return index % 2 === 1;
  });

  /*

  const amounts: number[] = []

  const amountUsedToFundSOLWallets = balanceOfWallet - puffFundingWallets.length * 0.1 - 1

  const averageAmountToFundSOLWallets = amountUsedToFundSOLWallets / solFundingWallets.length

  let remainingAmount = amountUsedToFundSOLWallets;

  for (let i = 0; i < solFundingWallets.length; i++) {
    const variance = (Math.random() * 0.4 - 0.2) * averageAmountToFundSOLWallets;
    const amount = averageAmountToFundSOLWallets + variance;

    if (i === solFundingWallets.length - 1) {
      amounts.push(remainingAmount);
    } else {
      amounts.push(amount);
      remainingAmount -= amount;
    }
  }

  const transferInstructionsForSol: TransactionInstruction[] = []

  console.log('Amounts to fund each wallet:', amounts);

  for (let i = 0; i < solFundingWallets.length; i++) {
    const wallet = solFundingWallets[i];
    const amount = amounts[i];
    console.log(`Funding wallet ${wallet.pubkey} with ${amount} SOL`);
    // Add your funding logic here

    transferInstructionsForSol.push(
      SystemProgram.transfer({
        fromPubkey: fundingWallet.publicKey,
        toPubkey: new PublicKey(wallet.pubkey),
        lamports: Math.floor(amount * LAMPORTS_PER_SOL)
      })
    )
  }

  const { transaction: solTransaction, blockhash: solBlockhash } = await createTransactionForInstructions({
    wallet: fundingWallet.publicKey.toBase58(),
    instructions: transferInstructionsForSol,
    signers: [fundingWallet],
  })

  const { txSig: solTxSig, confirmedResult: solConfirmedResult } = await sendAndConfirmTransactionAndRetry(
    solTransaction,
    solBlockhash
  )

  console.log('SOL FUNDING: Transaction sent and confirmed:', solTxSig, solConfirmedResult);

  const transferInstructionsForSOLFundingTokenWallets: TransactionInstruction[] = []

  for (const puffWallet of puffFundingWallets) {
    transferInstructionsForSOLFundingTokenWallets.push(
      SystemProgram.transfer({
        fromPubkey: fundingWallet.publicKey,
        toPubkey: new PublicKey(puffWallet.pubkey),
        lamports: 0.1 * LAMPORTS_PER_SOL
      })
    )
  }

  const { transaction, blockhash } = await createTransactionForInstructions({
    wallet: fundingWallet.publicKey.toBase58(),
    instructions: transferInstructionsForSOLFundingTokenWallets,
    signers: [fundingWallet],
  })

  const { txSig, confirmedResult } = await sendAndConfirmTransactionAndRetry(
    transaction,
    blockhash
  )

  console.log('SOL FUNDING for token wallets: Transaction sent and confirmed:', txSig, confirmedResult); */

  const tokenBalance = await getTokenBalanceForOwner({
    ownerPubkey: tokenFundingWallet.publicKey.toBase58(),
    tokenMint: splToken.tokenMint,
  });

  if (!tokenBalance.tokenAccountPubkey) {
    console.error("Token account not found");
    return;
  }

  const tokenAmount = 1_200_000;

  const averageAmountToFundTokenWallets = tokenAmount / puffFundingWallets.length;

  const transferTokenInstructions: { instructions: TransactionInstruction[]; keypair: Keypair }[] = [];

  for (const puffWallet of puffFundingWallets) {
    const variance = (Math.random() * 0.4 - 0.2) * averageAmountToFundTokenWallets;
    const amountToFund = averageAmountToFundTokenWallets + variance;

    console.log(`Funding wallet ${puffWallet.pubkey} with ${amountToFund} tokens`);

    const transferTokenInstr = await transferTokenInstruction({
      mint: new PublicKey(splToken.tokenMint),
      from: tokenFundingWallet.publicKey,
      sourceTokenAccountPubkey: new PublicKey(tokenBalance.tokenAccountPubkey),
      to: new PublicKey(puffWallet.pubkey),
      amount: Math.floor(amountToFund * Math.pow(10, splToken.decimals)),
    });

    transferTokenInstructions.push({
      instructions: transferTokenInstr,
      keypair: tokenFundingWallet,
    });
  }

  const groupedTransferInstructions: { instructions: TransactionInstruction[]; keypair: Keypair }[][] = [];
  const groupSize = 7;

  for (let i = 0; i < transferTokenInstructions.length; i += groupSize) {
    groupedTransferInstructions.push(transferTokenInstructions.slice(i, i + groupSize));
  }

  for (const group of groupedTransferInstructions) {
    const allInstructions = _.flatten(group.map((item) => item.instructions));
    const allSigners = group.map((item) => item.keypair);

    const { transaction: tokenTransaction, blockhash: tokenBlockhash } = await createTransactionForInstructions({
      wallet: allSigners[0].publicKey.toBase58(),
      instructions: allInstructions,
      signers: allSigners,
    });

    const { txSig: tokenTxSig, confirmedResult: tokenConfirmedResult } = await sendAndConfirmTransactionAndRetry(tokenTransaction, tokenBlockhash);

    console.log("Transaction sent and confirmed:", tokenTxSig, tokenConfirmedResult);
  }
});

program.command("executeJupiterSwap").action(async () => {
  const botCustomer = await getBotCustomerByName("Drew");

  const wallet = await pickRandomWalletFromCustomer({
    customerId: botCustomer.id,
    walletType: EWalletType.MARKET_MAKING,
    minSolBalance: 0.2,
    minTokenBalance: 0,
  });

  const decryptedWallet = decryptWallet(wallet.encryptedPrivKey);

  const { txSig, confirmedResult, actualOutputAmount, slippage, outputTokenBalance, expectedOutputAmount } = await executeJupiterSwap(
    {
      inputAmount: 0.14,
      inputMint: "So11111111111111111111111111111111111111112",
      outputMint: drewTokenMint.toBase58(),
      pubkey: decryptedWallet.publicKey,
      maxSlippage: 500,
    },
    decryptedWallet
  );

  console.log("Transaction sent and confirmed:", txSig);
  console.log("Confirmed result:", confirmedResult);
  console.log("Expected output amount:", expectedOutputAmount);
  console.log("Actual output amount:", actualOutputAmount);
  console.log("Slippage:", slippage);
  console.log("Output token balance:", outputTokenBalance);
});

program.command("updateBuyJobWithValues").action(async () => {
  await updateBuyJobsWithValues();
});

program.command('convertUintPrivateKeyToBase58').action(async () => {
  const keypair = loadWalletFromU8IntArrayStringified(process.env.NEW_KEY_TO_LOAD!)
  const base58 = uint8ArrayToBase58(keypair.secretKey)
  console.log(base58)
  console.log(keypair.publicKey.toBase58())
})

program.command("convertBase58ToUint8").action(async () => {
  const base58Key = "z4PS4JhznMyaknSwVDKWhJYoqAojFHgp4SHGnsVE1fMourqzhsrNQb6SrJ9mFw39LKUCHFckZktzrcqNfZXvZKU";
  const uint8Array = base58ToUint8Array(base58Key);
  console.log(uint8Array.toString());
});

program.command("getTokenHolders").action(async () => {
  const mintPubKey = new PublicKey("337BWWbicojq2CQuRayWBvaF7VNKt2XzQkLxM6L4pump");

  // Get the 250 largest holders
  // Fetch all token accounts associated with the token mint
  const tokenAccounts = await connection.getProgramAccounts(TOKEN_PROGRAM_ID, {
    filters: [
      {
        dataSize: 165, // Token account size
      },
      {
        memcmp: {
          offset: 0, // Token mint starts at offset 0 in the account data
          bytes: mintPubKey.toBase58(),
        },
      },
    ],
  });

  // Map token accounts to useful data
  const holders = tokenAccounts.map((account) => {
    const data = account.account.data;

    const ownerPubKey = new PublicKey(data.slice(32, 64));
    const amount = parseTokenAmount(data.slice(64, 72)); // Parse token amount from account data

    return {
      address: ownerPubKey.toBase58(),
      amount,
    };
  });

  const splToken = await getSplTokenByMint(mintPubKey.toBase58());

  console.log(holders);

  const wallets = await prisma.botCustomerWallet.findMany({
    where: {
      botCustomer: {
        name: "SniperOne",
      },
    },
  });

  let ourTotalTokenBalance = 0;
  const walletsWithBalance: { pubkey: string; amount: number }[] = [];

  for (const holder of holders) {
    const wallet = wallets.find((w) => w.pubkey === holder.address);

    const holderAmount = holder.amount / Math.pow(10, splToken.decimals);

    console.log(`${holder.address} -> ${holderAmount} -> ${wallet?.pubkey}`);

    if (wallet?.pubkey) {
      ourTotalTokenBalance += holderAmount;

      if (holderAmount > 0) {
        walletsWithBalance.push({
          pubkey: wallet.pubkey,
          amount: holderAmount,
        });
      }
    }
  }

  console.log(`Our total token balance: ${ourTotalTokenBalance.toLocaleString()} ${splToken.symbol}`);

  const totalOfAllHolders = holders.reduce((acc, holder) => acc + holder.amount / Math.pow(10, splToken.decimals), 0);
  console.log(`Total of all holders: ${totalOfAllHolders.toLocaleString()} ${splToken.symbol}`);

  console.log(`Our holdings: ${((ourTotalTokenBalance * 100) / totalOfAllHolders).toFixed(2)}%`);

  console.log(`Total holders including past ${holders.length}`);

  console.log(walletsWithBalance);
});

program
  .command("exportSniperWallets")
  .option("-c, --customer <customer>", "The customer to get the wallets for")
  .action(async (opts) => {
    const customer = opts.customer;

    if (!customer) {
      console.error("Customer is required");
      return;
    }

    await exportSniperWallets(customer);
  });

program
  .command("createCustomer")
  .option("-n, --name <name>", "The name of the new customer")
  .action(async (opts) => {
    const name = opts.name;

    if (!name) {
      console.error("Customer name is required");
      return;
    }

    const newCustomer = await createBotCustomer({
      name: name,
    });

    console.log(`Created new customer with ID ${newCustomer.id} and name ${newCustomer.name}`);
  });

program
  .command("setupServiceFunding")
  .option("-c, --customer <customer>", "The customer to setup the service funding for")
  .option("-w, --walletCount <walletCount>", "The number of wallets to generate")
  .action(async (opts) => {
    const customer = opts.customer;
    const walletCount = opts.walletCount ?? 15;

    const botCustomer = await getBotCustomerByName(customer);

    if (!botCustomer.name) {
      console.error("Bot customer not found");
      return;
    }

    const { wallets: serviceFundingWallets, walletCount: serviceFundingWalletCount } = await createAndStoreBotCustomerWallets({
      subWalletCount: walletCount,
      walletType: EWalletType.SERVICE_FUNDING,
      customerId: botCustomer.id,
    });

    console.log(`created ${serviceFundingWalletCount} wallets for service funding`);

    await exportWallets({
      customerName: botCustomer.name,
      wallets: serviceFundingWallets,
      type: EWalletType.SERVICE_FUNDING,
    });
  });

program.command("sendAllFundsFromOneSetOfWalletsToAnother").action(async () => {
  const privateKeys = [
    "3Vga1b1XnDcqfm9PLUmNwSAAehfsJr86mVS8kFxM3Z4myiEmDwsv9n2wVfnLM7YqaSQEHYFM6GVdD7GhxFebj1k3",
    "3TQ7ruLZewHuPgsLG2s5fujMEFQDjzNpkqkfwGgQ1gL7H8Uyw6TQ79WdbgBazYqKRySPFTs4z1rP9xUJpq28UNd3",
    "dBeXvGgxxvxNry6RU9BA4p8W6nHiSPFifRsFtsfZt3ye9vvJkMFzxPWhpkXWWzd5YRDJCTGwVV65rTZ83CVoawq",
    "2ZLkJ81Ad37DG9638uwiQA44CXf1WpnAjR7wVRRpG5qzBn6CRqyMM329iVgAsfEA9c2SAsRab6tjHKQ5fNYEeFQD",
    "2c5Etrjt1XMUEkW9TkDKieJzmN8VzmdgXKCTYjggxnEMETPr4cgAVXBaqTJrevLVVbrMDSUMQAkwsH8pABRGB5ZV",
    "61dXcrE6B6XfbFsZpApcuydLmaQZ1nDTBt4w6EXSvd1Ayd9CFxZwc9vNfb1hrZXFdN9pEkuE8E18Pg623KYSBWXQ",
    "3JGAZR253kfbZ6kS5SpJ1y7XX8yQtVd8t292hBDwjdggYJ21Q7G6vXn2VWkn6TETSavK9KLPuHqne2H9X9wNxa1R",
    "4XLQ6j1wG9JGNE41Frp7opRyMw4Q8PV553tNFUQSkkwQNd7qpC3mTvy7aXZ2j9L9SFrKTE3QmqBntbhBRNr5Ack1",
  ];

  const botCustomer = await getBotCustomerByName("SniperOne");
  const serviceFundingWallets = await prisma.botCustomerWallet.findMany({
    where: {
      botCustomerId: botCustomer.id,
      type: EWalletType.SERVICE_FUNDING,
    },
  });

  for (const privateKey of privateKeys) {
    const uIntArray = base58ToUint8Array(privateKey);
    const keypair = Keypair.fromSecretKey(uIntArray);

    const balance = await connection.getBalance(keypair.publicKey);

    console.log(`Wallet: ${keypair.publicKey.toBase58()} -> Balance: ${balance / LAMPORTS_PER_SOL} SOL`);

    if (balance < 0.05 * LAMPORTS_PER_SOL) {
      console.log(`Skipping ${keypair.publicKey.toBase58()} with balance ${balance / LAMPORTS_PER_SOL} SOL`);
      continue;
    }

    const serviceFundingWallet = _.sample(serviceFundingWallets);

    if (!serviceFundingWallet) {
      console.error("No service funding wallet found");
      return;
    }

    console.log(`Funding ${serviceFundingWallet.pubkey} with ${balance / LAMPORTS_PER_SOL} SOL`);

    await reattempt.run({ times: 10, delay: 1000 }, async () => {
      const fromKeypair = keypair;
      const toKeypair = decryptWallet(serviceFundingWallet.encryptedPrivKey);

      const { txSig, confirmedResult } = await closeWallet({
        waitTime: 10000,
        from: fromKeypair,
        to: toKeypair,
        feePayer: toKeypair,
      });

      if (confirmedResult.value.err) {
        console.log(`Error closing ${fromKeypair.publicKey.toBase58()} and funding ${toKeypair.publicKey.toBase58()}: ${confirmedResult.value.err}`);
        throw new Error(`Error closing ${fromKeypair.publicKey.toBase58()} and funding ${toKeypair.publicKey.toBase58()}: ${confirmedResult.value.err}`);
      }

      console.log(
        "Transaction sent and confirmed:",
        txSig,
        `to close ${fromKeypair.publicKey.toBase58()} and fund ${toKeypair.publicKey.toBase58()} with ${balance / LAMPORTS_PER_SOL} SOL`
      );
    });
  }
});

program.command("decryptWallet").action(async () => {
  const wallet = await prisma.botCustomerWallet.findFirst({
    where: {
      pubkey: "4sXzMkhMn8mrFU4r7YQDGwk6iPgXzt7gccCUyUpAnMXw",
    },
  });

  if (!wallet) {
    console.error("Wallet not found");
    return;
  }

  const decryptedWallet = await decryptWallet(wallet.encryptedPrivKey);

  console.log(uint8ArrayToBase58(decryptedWallet.secretKey));
});

program.command("jsonToTextForFundingWallets").action(async () => {
  await jsonToTextForFundingWallets("./export_wallets/sniping/SniperOne_2024-11-26T11:19:44.json");
});

program
  .command("totalFundingBalanceForType")
  .option("-c, --customer <customer>", "The customer to get the wallets for")
  .option("-t, --type <type>", "The type of wallets to get the balance for")
  .action(async (opts) => {
    const botCustomer = await getBotCustomerByName("SniperOne");
    const serviceFundingWallets = await prisma.botCustomerWallet.findMany({
      where: {
        botCustomerId: botCustomer.id,
        type: opts.type ?? "SERVICE_FUNDING",
      },
    });

    let totalBalance = 0;

    console.log(`${serviceFundingWallets.length} service funding wallets found`);

    for (const wallet of serviceFundingWallets) {
      const balance = await connection.getBalance(new PublicKey(wallet.pubkey));

      console.log(`${wallet.pubkey} -> ${balance / LAMPORTS_PER_SOL} SOL`);

      totalBalance += balance;
    }

    console.log(`Total service funding balance: ${totalBalance / LAMPORTS_PER_SOL} SOL`);
  });

program.command('fundWalletFromAllWallets').action(async () => {
  const botCustomer = await getBotCustomerByName('VENUS')
  const targetKeypair = loadWalletFromU8IntArrayStringified(process.env.TARGET_WALLET!)

  console.log(`Funding from all wallets to ${targetKeypair.publicKey.toBase58()}`)

  const botCustomerWallets = await prisma.botCustomerWallet.findMany({
    where: {
      botCustomerId: botCustomer.id,
      type: {
        in: [EWalletType.SNIPING_FUNDING],
      },
    },
  })

  console.log(`${botCustomerWallets.length} market making wallets found`)

  console.log(`Total balance: ${await getBalanceFromWallets(botCustomerWallets.map((wallet) => new PublicKey(wallet.pubkey)))} SOL`)

  await asyncBatch(botCustomerWallets, async (botCustomerWallet) => {
    const balance = await connection.getBalance(new PublicKey(botCustomerWallet.pubkey))
    const solBalance = balance / LAMPORTS_PER_SOL
    const sourceKeypair = decryptWallet(botCustomerWallet.encryptedPrivKey)

    if (solBalance < 0.001) {
      console.log(`Skipping ${botCustomerWallet.pubkey} with balance ${solBalance} SOL`)
      return
    }

    console.log(`Funding from ${botCustomerWallet.pubkey} with ${solBalance} SOL to ${targetKeypair.publicKey.toBase58()}`)

    await sendSolFromWalletToWalletWithCycles({
      cycles: 5,
      sourceKeypair,
      targetKeypair,
      amount: Sol.fromLamports(balance),
      sendAll: true,
      customerId: botCustomer.id,
      feePayerKeypair: targetKeypair,
    })
  }, 10)
})

program
  .command("setupSniping")
  .option("-c, --customer <customer>", "The customer to setup the sniping for")
  .option("-w, --walletCount <walletCount>", "The number of wallets to generate")
  .option("-f, --fundingCycles <fundingCycles>", "The number of funding cycles to create")
  .option("-minAmount, --minAmount <minAmount>", "The minimum amount to fund the sniping wallets")
  .option("-maxAmount, --maxAmount <maxAmount>", "The maximum amount to fund the sniping wallets")
  .action(async (opts) => {
    const customer = opts.customer;
    const walletCount = opts.walletCount ?? 45;
    const fundingCycles = opts.fundingCycles ?? 5;
    const minAmount = opts.minAmount ?? 0.41;
    const maxAmount = opts.maxAmount ?? 0.52;
    const newWallets = opts.newWallets ?? false;

    const botCustomer = await getBotCustomerByName(customer);

    if (!botCustomer.name) {
      console.error("Bot customer not found");
      return;
    }

    console.log(`got bot customer ${botCustomer.id}: ${botCustomer.name}`);
    console.log(`settings -> walletCount: ${walletCount}, fundingCycles: ${fundingCycles}, minAmount: ${minAmount}, maxAmount: ${maxAmount}`);

    const { wallets: snipingWallets, walletCount: snipingWalletCount } = await createAndStoreBotCustomerWallets({
      subWalletCount: walletCount,
      walletType: EWalletType.SNIPING,
      customerId: botCustomer.id,
    });

    console.log(`created ${snipingWalletCount} wallets for sniping`);

    const serviceFundingWallets = await prisma.botCustomerWallet.findMany({
      where: {
        botCustomerId: botCustomer.id,
        type: EWalletType.SERVICE_FUNDING,
      },
    });

    const serviceFundingWalletsWithBalance: typeof serviceFundingWallets = [];

    for (const wallet of serviceFundingWallets) {
      const balance = await connection.getBalance(new PublicKey(wallet.pubkey));

      if (balance > minAmount * LAMPORTS_PER_SOL) {
        console.log(`taking service funding wallet with balance > 0.1 SOL: ${wallet.pubkey} => balance: ${balance / LAMPORTS_PER_SOL} SOL`);
        serviceFundingWalletsWithBalance.push(wallet);
      } else {
        console.log(`skipping service funding wallet with balance <= 0.1 SOL: ${wallet.pubkey} => balance: ${balance / LAMPORTS_PER_SOL} SOL`);
      }
    }

    console.log(`${serviceFundingWalletsWithBalance.length} service funding wallets with balance > 0.1 SOL`);

    const snipingWalletsExport = await exportWallets({
      customerName: botCustomer.name,
      wallets: snipingWallets,
      type: EWalletType.SNIPING,
    });

    console.log(`Exported sniping wallets to ${snipingWalletsExport}`);

    for (const snipingWallet of snipingWallets) {
      console.log(`sniping wallet: ${snipingWallet.pubkey}`);

      const { wallets: snipingFundingWallets, walletCount: snipingFundingWalletCount } = await createAndStoreBotCustomerWallets({
        subWalletCount: fundingCycles,
        walletType: EWalletType.SNIPING_FUNDING,
        customerId: botCustomer.id,
      });

      console.log(`created ${snipingFundingWalletCount} wallets for sniping funding for sniping wallet ${snipingWallet.pubkey}`)
      const serviceFundingWalletsWithBalance = (
        await Promise.all(
          serviceFundingWallets.map(async (wallet) => {
            const balance = await reattempt.run({ times: 5, delay: 1000 }, async () => {
              return await connection.getBalance(new PublicKey(wallet.pubkey), 'confirmed')
            })

            return {
              solBalance: balance / LAMPORTS_PER_SOL,
              wallet,
            }
          }),
        )
      ).filter((item) => item.solBalance > minAmount)
      const serviceFundingWallet = _.sample(serviceFundingWalletsWithBalance)

      if (!serviceFundingWallet || !serviceFundingWallet.wallet.encryptedPrivKey) {
        console.error(`No service funding wallet found for ${snipingWallet.pubkey}`)
        return
      }

      const maxAmountToSend = maxAmount > serviceFundingWallet.solBalance ? serviceFundingWallet.solBalance : maxAmount
      const amountToSend = _.random(minAmount, maxAmountToSend, true)

      const sourceKeypair = decryptWallet(serviceFundingWallet.wallet.encryptedPrivKey)
      const targetKeypair = decryptWallet(snipingWallet.encryptedPrivKey)

      await sendSolFromWalletToWalletWithCycles({
        cycles: fundingCycles,
        sourceKeypair,
        targetKeypair,
        amount: Sol.fromLamports(amountToSend * LAMPORTS_PER_SOL),
        sendAll: false,
        customerId: botCustomer.id,
      })
    }
  });


program
  .command("generateAndExportSniperWallets")
  .option("-c, --customer <customer>", "The customer to generate the wallets for")
  .option("-w, --walletCount <walletCount>", "The number of wallets to generate")
  .action(async (opts) => {
    const customer = opts.customer;
    const walletCount = opts.walletCount ?? 200;

    if (!customer) {
      console.error("Customer is required");
      return;
    }

    const botCustomer = await getBotCustomerByName(customer);

    console.log(`got bot customer ${botCustomer.id}: ${botCustomer.name}`);

    const botCustomerWalletCreate = await createAndStoreBotCustomerWallets({
      subWalletCount: walletCount,
      walletType: EWalletType.SNIPING,
      customerId: botCustomer.id,
    });

    await exportSniperWallets(customer);
  });

program.command('sellPumpFunFromDistributed').action(async () => {
  const tokenMint = '7k9msjoUnoSQN2ZZwA64mQ9UCp7DA2SMMYTvgwUEqAmQ'
  const fundingWallet = loadWalletFromU8IntArrayStringified(process.env.FUNDING_WALLET!)
  const wallets = [
    '26AvpuwJYbHoTZaUPcfJCvnQsQUJCwqvbPhKDHacVh5Y',
    '2DQdsowaZHYNKhQKNySasA1B3d3ZdyVHtv3aKYRRPA9Y',
    '2G6sK963L6MiNBuHmJUp7Wz6QBDQowh2nFTWTv1sYUEZ',
    '2hz3ogYi5vYqHKXxZ1v3ACQQi7gva85dSk6fsoPUeRV6',
    '2jHnfdczhWk98RsvTE7QjxVvsoXqfnYuWbqpEQvLfLAd',
    '2msMdAsLp6sFFhDx1mJPcbenaUPVaxafUgbYJNoU1XMG',
    '2so2yrAJDbd19FSAETJ2nJWzRQs3L1Ao57kgr7A6jQes',
    '2w9ZHjGmAvC5DnFBxUMCNwjQ9RB7EC4iwViPYUXYMzAK',
    '384XxqdXrdzSDn2pt8oMN6AmxACrCdTDrsr3nNL8pkCc',
    '3BTxmBAEX1ueAMbEjwaPMzyhBz5V8R4yJk6Wd5mRREH8',
  ]

  const marketMakingWallets = await prisma.botCustomerWallet.findMany({
    where: {
      pubkey: {
        in: wallets,
      },
    },
  })

  const keypairs = marketMakingWallets.map((wallet) => decryptWallet(wallet.encryptedPrivKey))

  const instructions = await sellAllPumpFunTokensFromMultipleWalletsInstruction({
    wallets: keypairs,
    tokenMint,
  })



  const { transaction: tokenTransaction, blockhash: tokenBlockhash } = await createQuickTransactionForInstructions({
    wallet: fundingWallet.publicKey.toBase58(),
    instructions: _.flatten(instructions),
    signers: [fundingWallet, ...keypairs],
    priorityFeeLamports: 500_000,
    unitLimit: 500_000,
  })

})

program.command("sendFromMainToSniperForPumpFun").action(async () => {
  const customer = await getBotCustomerByName("PF_SNIPER");

  
})

program.command('sellPumpFunTokens').action(async () => {
  const tokenSymbol = 'VENUS'
  const customer = await getBotCustomerByName(tokenSymbol)

  const activeBookedService = await getActiveBookedServiceByBotCustomerId({ botCustomerId: customer.id, serviceType: EServiceType.SNIPER })

  const tokenBalance = await getTokenBalanceForOwner({
    ownerPubkey: activeBookedService.mainWallet.pubkey,
    tokenMint: '7yM89M2JQZrnp6G3otC6RA9NKSb7Tkxxjy122YiFXJvr',
  })

  console.log(`Token balance for ${tokenSymbol}: ${tokenBalance.tokenBalance.amount}`)

  const amountToSell = Math.floor(Number(tokenBalance.tokenBalance.amount) - 1000)

  console.log(`Selling ${amountToSell} tokens`)

  await sellPumpFunTokens({
    mainWallet: activeBookedService.mainWallet,
    tokenMint: activeBookedService.usedSplTokenMint,
    tokenAmount: amountToSell,
  })
})

program.command('sellMultiplePumpFunTokens').action(async () => {
  const tokenSymbol = 'VENUS'
  const customer = await getBotCustomerByName(tokenSymbol)
  const activeBookedService = await getActiveBookedServiceByBotCustomerId({ botCustomerId: customer.id, serviceType: EServiceType.SNIPER })
  const fundingWallet = loadWalletFromU8IntArrayStringified(process.env.FUNDING_WALLET!)
  const mainWallet = decryptWallet(activeBookedService.mainWallet.encryptedPrivKey)

  const allSellInstructions = await sellAllPumpFunTokensFromMultipleWalletsInstruction({
    wallets: [fundingWallet, mainWallet],
    tokenMint: activeBookedService.usedSplTokenMint,
  })

  const instrsToSend = _.flatten(allSellInstructions)

  const { transaction: tokenTransaction, blockhash: tokenBlockhash } = await createQuickTransactionForInstructions({
    wallet: fundingWallet.publicKey.toBase58(),
    instructions: instrsToSend,
    signers: [fundingWallet, mainWallet],
    priorityFeeLamports: 500_000,
    unitLimit: 500_000,
  })

  const { txSig: tokenTxSig, confirmedResult: tokenConfirmedResult } = await sendAndConfirmTransactionAndRetry(
    tokenTransaction,
    tokenBlockhash,
  )

  console.log('Transaction sent and confirmed:', tokenTxSig, tokenConfirmedResult)
})

program.command('buyPumpFunTokens').action(async () => {
  const tokenSymbol = 'VENUS'
  const customer = await getBotCustomerByName(tokenSymbol)
  const activeBookedService = await getActiveBookedServiceByBotCustomerId({ botCustomerId: customer.id, serviceType: EServiceType.SNIPER })
  const fundingWallet = loadWalletFromU8IntArrayStringified(process.env.FUNDING_WALLET!)

  await buyPumpFunTokens({
    mainWallet: fundingWallet,
    tokenMint: activeBookedService.usedSplTokenMint,
    solAmount: 0.45,
  })
})

program.command('checkWallets').action(async () => {
  const customer = await getBotCustomerByName('VENUS')
  
  const marketMakingWallets = await prisma.botCustomerWallet.findMany({
    where: {
      botCustomerId: customer.id,
      type: EWalletType.MARKET_MAKING,
    },
  })

  console.log(`found ${marketMakingWallets.length} market making wallets`)
})

program.command('distributeTokens').action(async () => {
  const tokenSymbol = 'EARLY'
  const customer = await getBotCustomerByName(tokenSymbol)

  const activeBookedService = await getActiveBookedServiceByBotCustomerId({ botCustomerId: customer.id, serviceType: EServiceType.SNIPER })

  const marketMakingWallets = await prisma.botCustomerWallet.findMany({
    where: {
      botCustomerId: customer.id,
      type: EWalletType.MARKET_MAKING,
    },
  })

  console.log(`Found ${marketMakingWallets.length} market making wallets`)

  const { tokenBalance, tokenAccountPubkey } = await getTokenBalanceForOwner({
    ownerPubkey: activeBookedService.mainWallet.pubkey,
    tokenMint: activeBookedService.usedSplTokenMint,
  })

  if (!tokenAccountPubkey || !tokenBalance) {
    console.error('No token balance found for main wallet')
    return
  }

  const tokenMint = new PublicKey(activeBookedService.usedSplTokenMint)
  const mainWalletKeypair = decryptWallet(activeBookedService.mainWallet.encryptedPrivKey)

  const amountsToReceive = distributeTotalAmountRandomlyAcrossWallets(tokenBalance.amount, marketMakingWallets.length, 5)
  const transferInstructions: { instructions: TransactionInstruction[]; keypair?: Keypair }[] = []

  for (let i = 0; i < marketMakingWallets.length; i++) {
    if (i >= amountsToReceive.length) {
      break
    }

    const amountToSend = amountsToReceive[i]

    console.log(`${marketMakingWallets[i].pubkey} will receive ${amountToSend} ${tokenMint.toBase58()}`)

    if (amountToSend > 0) {
      const transferTokenInstr = await transferTokenInstruction({
        mint: tokenMint,
        from: mainWalletKeypair.publicKey,
        sourceTokenAccountPubkey: new PublicKey(tokenAccountPubkey),
        to: new PublicKey(marketMakingWallets[i].pubkey),
        amount: Math.floor(amountToSend),
      })

      transferInstructions.push({
        instructions: transferTokenInstr,
      })
    }
  }

  const transactionResults = await groupSendAndConfirmTransactions(transferInstructions, mainWalletKeypair, 6)
    
});

program.command('setupPumpFun').action(async () => {
  const fromCustomer = await getBotCustomerByName('VENUS')
  const tokenSymbol = 'EARLY'
  const tokenImage = './assets/early.jpg'
  const description = 'Missed out on 100x trades so far? Be $early this time.'
  const twitter = 'https://x.com/WayTooEarly'
  const shouldDistributeTokens = false
  const fundingWallet = loadWalletFromU8IntArrayStringified(process.env.FUN_WALLET!)

  let customer = await await prisma.botCustomer.findFirst({
    where: {
      name: tokenSymbol,
    },
  })
  let activeBookedService = !!customer ? await getActiveBookedServiceByBotCustomerId({ botCustomerId: customer.id, serviceType: EServiceType.SNIPER }) : null

  const newSPLToken = Keypair.generate()

  console.log(`Launching pump fun token ${newSPLToken.publicKey.toBase58()}`)
  console.log(`Pump URL: https://pump.fun/${newSPLToken.publicKey.toBase58()}`)
  
  const splToken = await prisma.splToken.create({
    data: {
      name: tokenSymbol,
      symbol: tokenSymbol,
      tokenMint: newSPLToken.publicKey.toBase58(),
      decimals: 6,
      isSPL: true,
    },
  })

  if (!customer) {
    console.log(`Creating new customer ${tokenSymbol}`)

    customer = await createBotCustomer({
      name: tokenSymbol,
    })
  
    activeBookedService = await createBookedServiceAndWallet({
      botCustomerId: customer.id,
      serviceType: EServiceType.SNIPER,
      solAmount: 88,
      usedSplTokenMint: splToken.tokenMint,
    })

    const mainWalletForNewCustomer = activeBookedService.mainWallet
    const mainWalletForNewCustomerKeypair = decryptWallet(mainWalletForNewCustomer.encryptedPrivKey)

    const { txSig, confirmedResult } = await sendSol({
      from: fundingWallet,
      to: mainWalletForNewCustomerKeypair.publicKey,
      amount: Sol.fromLamports(87 * LAMPORTS_PER_SOL),
      feePayer: fundingWallet,
    })

    console.log(`Funded main wallet with 1 SOL`, txSig)

    const { balanceFound, balance } = await waitUntilBalanceIsGreaterThan({ from: mainWalletForNewCustomerKeypair.publicKey, amount: 0.1, waitTime: 20000 })

    if (!balanceFound) {
      console.error('Balance is not greater than 0.1 SOL, cannot continue')
      return
    }

    console.log(`Balance is ${balance} SOL, continuing`)

    const updatedMarketMakingWallets = await prisma.botCustomerWallet.updateMany({
      data: {
        botCustomerId: customer.id,
      },
      where: {
        latestSolBalance: {
          gt: 0.01,
        },
        type: EWalletType.MARKET_MAKING,
        botCustomerId: fromCustomer.id,
      },
    })

    console.log(`Updated ${updatedMarketMakingWallets.count} market making wallets to new customer`)
  } else {
    if (!activeBookedService) {
      console.error('No active booked service found')
      return
    }

    await prisma.bookedService.update({
      data: {
        usedSplTokenMint: splToken.tokenMint,
      },
      where: {
        id: activeBookedService.id,
      },
    })
  }

  if (!activeBookedService || !splToken) {
    console.error('No active booked service or spl token found')
    return
  }

  const mainWalletKey = activeBookedService?.mainWallet ? decryptWallet(activeBookedService.mainWallet.encryptedPrivKey) : null

  console.log(`Using main wallet: ${uint8ArrayToBase58(mainWalletKey?.secretKey!)}`)

  console.log(`Setting up pump fun token for ${tokenSymbol}`)

  const mainWallet = activeBookedService.mainWallet
  const mainWalletKeypair = decryptWallet(mainWallet.encryptedPrivKey)
  const marketMakingWallets = await prisma.botCustomerWallet.findMany({
    where: {
      botCustomerId: customer.id,
      type: EWalletType.MARKET_MAKING,
    },
  })

  const tokenMint = new PublicKey(splToken.tokenMint)

  const pumpFunTokenBalance = await setupPumpFunToken({
    mainWallet,
    mint: newSPLToken,
    tokenSymbol,
    description,
    twitter,
    tokenImage,
    solAmount: 85
  })

  if (!pumpFunTokenBalance) {
    console.error('No pump fun token balance found')
    return
  }

  const { splTokenAccount } = pumpFunTokenBalance
  const { tokenAccountPubkey, tokenBalance, uiAmount } = splTokenAccount

  console.log(`Token balance for main wallet: ${uiAmount}`)

  if (!tokenAccountPubkey || !tokenBalance || tokenBalance.amount === 0) {
    console.error('No token balance found for main wallet')
    return
  }

  const amountsToReceive = distributeTotalAmountRandomlyAcrossWallets(tokenBalance.amount, marketMakingWallets.length, 5)
  const transferInstructions: { instructions: TransactionInstruction[]; keypair?: Keypair }[] = []

  if (!shouldDistributeTokens) {
    console.log(`Not distributing tokens, skipping`)
    return
  }

  for (let i = 0; i < marketMakingWallets.length; i++) {
    if (i >= amountsToReceive.length) {
      break
    }

    const amountToSend = amountsToReceive[i]

    console.log(`${marketMakingWallets[i].pubkey} will receive ${amountToSend} ${tokenMint.toBase58()}`)

    if (amountToSend > 0) {
      const transferTokenInstr = await transferTokenInstruction({
        mint: tokenMint,
        from: mainWalletKeypair.publicKey,
        sourceTokenAccountPubkey: new PublicKey(tokenAccountPubkey),
        to: new PublicKey(marketMakingWallets[i].pubkey),
        amount: Math.floor(amountToSend),
      })

      transferInstructions.push({
        instructions: transferTokenInstr,
      })
    }
  }

  const transactionResults = await groupSendAndConfirmTransactions(transferInstructions, mainWalletKeypair, 6)

  console.log(
    'Transaction sent and confirmed:',
    transactionResults.map((item) => item.txSig),
    `with ${transactionResults.filter((item) => !item.confirmedResult.value.err).length} successes and ${
      transactionResults.filter((item) => !!item.confirmedResult.value.err).length
    } failures`,
  )
})

program.command('randomDistribution').action(async () => {

  const totalAmount = 1_000_000_000
  const walletCount = 126

  const walletsToReceive = distributeTotalAmountRandomlyAcrossWallets(totalAmount, walletCount, 5)
  console.log(walletsToReceive)
})



program.command('closeTokenAccountsForMarketMakingWallets').action(async () => {
  const customer = await getBotCustomerByName('VENUS')
  const tokenMint = new PublicKey('7k9msjoUnoSQN2ZZwA64mQ9UCp7DA2SMMYTvgwUEqAmQ')
  const toWallet = new PublicKey('9FPqaSBG8EY1KuANnWbLqDhtwuakDfhJ1v5cKG2uvaRj')


})

program.command("sendFromSniperToMain").action(async () => {
  const customer = await getBotCustomerByName("PF_SNIPER");
  const tokenMint = new PublicKey("Bv9jYA2MTLQM4qtUtWsBo6ovCWbeoKEZxnszL1nYpump");
  const toWallet = new PublicKey("8ts4iTomEGiBfYME18Dz53HAT8XMpAVUEiPiLMwjRU8r");

  const snipingWallets = await prisma.botCustomerWallet.findMany({
    where: {
      botCustomerId: customer.id,
      type: EWalletType.MARKET_MAKING,
    },
  });

  const transferInstructions: { instructions: TransactionInstruction[]; keypair: Keypair }[] = [];

  for (const snipingWallet of snipingWallets) {
    const { tokenAccountPubkey, tokenBalance } = await getTokenBalanceForOwner({
      ownerPubkey: snipingWallet.pubkey,
      tokenMint: tokenMint.toBase58(),
    });

    console.log(`${snipingWallet.pubkey} has ${tokenBalance?.uiAmount} `);

    //await createCloseAccountInstruction({ botCustomerId: customer.id })
  }

  
})

program.command('sendFromSniperToMain').action(async () => {
  const customer = await getBotCustomerByName('VENUS')
  const tokenMint = new PublicKey('7k9msjoUnoSQN2ZZwA64mQ9UCp7DA2SMMYTvgwUEqAmQ')
  const toWallet = new PublicKey('9FPqaSBG8EY1KuANnWbLqDhtwuakDfhJ1v5cKG2uvaRj')

  const snipingWallets = await prisma.botCustomerWallet.findMany({
    where: {
      botCustomerId: customer.id,
      type: EWalletType.MARKET_MAKING,
    },
  })

  const transferInstructions: { instructions: TransactionInstruction[]; keypair: Keypair }[] = []

  for (const snipingWallet of snipingWallets) {
    const { tokenAccountPubkey, tokenBalance } = await getTokenBalanceForOwner({
      ownerPubkey: snipingWallet.pubkey,
      tokenMint: tokenMint.toBase58(),
    })

    console.log(`${snipingWallet.pubkey} has ${tokenBalance?.uiAmount} `)

    if (!!tokenAccountPubkey && !!tokenBalance && tokenBalance?.uiAmount && tokenBalance.uiAmount > 0) {
      const transferTokenInstructions = await transferTokenInstruction({
        mint: tokenMint,
        from: new PublicKey(snipingWallet.pubkey),
        sourceTokenAccountPubkey: tokenAccountPubkey,
        to: toWallet,
        amount: tokenBalance.amount,
      });

      const keypair = decryptWallet(snipingWallet.encryptedPrivKey);

      transferInstructions.push({
        instructions: transferTokenInstructions,
        keypair,
      });
    }
  }

  const groupedTransferInstructions: { instructions: TransactionInstruction[]; keypair: Keypair }[][] = [];
  const groupSize = 7;

  for (let i = 0; i < transferInstructions.length; i += groupSize) {
    groupedTransferInstructions.push(transferInstructions.slice(i, i + groupSize));
  }

  for (const group of groupedTransferInstructions) {
    const allInstructions = _.flatten(group.map((item) => item.instructions));
    const allSigners = group.map((item) => item.keypair);

    const { transaction, blockhash } = await createTransactionForInstructions({
      wallet: allSigners[0].publicKey.toBase58(),
      instructions: allInstructions,
      signers: allSigners,
    });

    const { txSig, confirmedResult } = await sendAndConfirmTransactionAndRetry(transaction, blockhash);

    console.log("Transaction sent and confirmed:", txSig, confirmedResult);
  }
});

program
  .command("scheduleNextBuyJob")
  .option("-c, --customer <customer>", "The customer to schedule the next buy job for")
  .action(async (opts) => {
    const customer = opts.customer;

    console.log(`Passed customer: ${customer}`);

    if (!customer) {
      console.error("Customer is required");
      return;
    }
    const botCustomer = await getBotCustomerByName(customer);
    const activeCycle = await getActiveMarketMakingCycleByBotCustomerId({
      botCustomerId: botCustomer.id,
    });

    if (!activeCycle) {
      console.error("No active market making cycle found");
      return;
    }

    await scheduleNextBuyJob({
      cycleId: activeCycle.id,
      startInSeconds: 10,
    });
  });

program.parse(process.argv)


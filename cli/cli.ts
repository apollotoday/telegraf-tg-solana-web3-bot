import { Command } from 'commander';
import { createBotCustomer, getBotCustomerByName } from '../src/modules/customer/botCustomer';
import { createAndStoreBotCustomerWallets, pickRandomWalletFromCustomer } from '../src/modules/wallet/walletService';
import { EJobStatus, EMarketMakingCycleType, EServiceType, EWalletType } from '@prisma/client';
import prisma from '../src/lib/prisma';
import { decryptWallet, loadWalletFromU8IntArrayStringified, uint8ArrayToBase58 } from '../src/modules/wallet/walletUtils';
import { connection } from '../src/config';
import { LAMPORTS_PER_SOL, PublicKey, SystemProgram, TransactionInstruction } from '@solana/web3.js';
import { createTransactionForInstructions } from '../src/modules/solTransaction/solTransactionUtils';
import { sendAndConfirmTransactionAndRetry } from '../src/modules/solTransaction/solSendTransactionUtils';
import { createBookedServiceAndWallet } from '../src/modules/customer/bookedService';
import { getBirdEyeUsdcRate } from '../src/modules/monitor/birdeye';
import { executeJupiterSwap, getBalances } from '../src/modules/markets/jupiter';
import { overwriteConsoleLog } from '../src/modules/utils/changeConsoleLogWithTimestamp';
import { updateBuyJobsWithValues } from '../src/modules/marketMaking/buyMarketMakingHandler';

const program = new Command();

const drewTokenMint = new PublicKey('14h6AkD5uSNzprMKm4yoQuQTymuYVMmmWo8EADEtTNUT')

overwriteConsoleLog()

program.command('initDrewMarketMaking').action(async () => {
  const drewBotCustomer = await createBotCustomer({
    name: 'Drew'
  })

  console.log(`created bot customer ${drewBotCustomer.id}: ${drewBotCustomer.name}`);

  const botCustomerWallets = await createAndStoreBotCustomerWallets({
    subWalletCount: 16,
    walletType: EWalletType.MARKET_MAKING,
    customerId: drewBotCustomer.id,
  })

  console.log(`created ${botCustomerWallets.count} wallets for market making`);

  const foundWallets = await prisma.botCustomerWallet.findMany({
    where: {
      botCustomerId: drewBotCustomer.id,
      type: EWalletType.MARKET_MAKING
    }
  })

  console.log(`found ${foundWallets.length} wallets for market making`);

  console.log(foundWallets.map((wallet) => wallet.pubkey));

  const testWallet = foundWallets[0];

  console.log(decryptWallet(testWallet.encryptedPrivKey), 'for', testWallet.pubkey);


})

program.command('getParsedTx').action(async () => {
  const detectedTransaction = await connection.getParsedTransaction('5yJEMQTsBguRwsNBbwTX9oV8su5Rcj5BqLVZk4Ynfs63RxUss37XxwE119H94xHSLqqUvafaYYqUgwhmkdhmF78m', {commitment: 'confirmed', maxSupportedTransactionVersion: 200})
  console.log(detectedTransaction?.meta?.preTokenBalances, detectedTransaction?.meta?.postTokenBalances)
})

program.command('getBalances').action(async () => {
  const balances = await getBalances({
    txSig: '5yJEMQTsBguRwsNBbwTX9oV8su5Rcj5BqLVZk4Ynfs63RxUss37XxwE119H94xHSLqqUvafaYYqUgwhmkdhmF78m',
    tokenMint: drewTokenMint.toBase58(),
    ownerPubkey: new PublicKey('62z1RHg3VpzM12fmDRftXyqPkXngEfWzibXPUk94WaM1')
  })
  console.log(balances)
})

program.command('initDrewMarketMakingService').action(async () => {
  const botCustomer = await prisma.botCustomer.findFirst({
    where: {
      name: 'Drew'
    }
  })

  if (!botCustomer) {
    console.error('bot customer not found');
    return;
  }

  await prisma.splToken.create({
    data: {
      name: 'DREW',
      symbol: 'DREW',
      tokenMint: drewTokenMint.toBase58(),
      decimals: 9,
      isSPL: true,
    }
  })

  const bookedService = await createBookedServiceAndWallet({
    botCustomerId: botCustomer.id,
    solAmount: 43,
    serviceType: EServiceType.MARKET_MAKING,
    usedSplTokenMint: drewTokenMint.toBase58(),

  })

  console.log(`created booked service ${bookedService.id} for market making`);

  const cycle = await prisma.marketMakingCycle.create({
    data: {
      buyMinAmount: 0.15,
      buyMaxAmount: 0.59,
      minDurationBetweenBuyAndSellInSeconds: 14,
      maxDurationBetweenBuyAndSellInSeconds: 300,
      minDurationBetweenJobsInSeconds: 300,
      maxDurationBetweenJobsInSeconds: 350,
      solSpentForCycle: 0,
      maxSolSpentForCycle: 7,
      maxSolEarnedForCycle: 0,
      solEarnedForCycle: 0,
      sellToBuyValueRatio: 0.51,
      type: EMarketMakingCycleType.PUSH,
      botCustomerId: botCustomer.id,
      bookedServiceId: bookedService.id,
      plannedTotalDurationInMinutes: 240,
      startTimestamp: new Date(),
    }
  })

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
      earliestExecutionTimestampForBuy: new Date(Date.now() + 60 * 1000),
    },
  })

  console.log(`scheduled first buy job ${nextJob.id} for market making cycle ${cycle.id}`);


})

program.command('setRequiredFieldsForDrewMarketMaking').action(async () => {
  const botCustomer = await getBotCustomerByName('Drew')

  const cycles = await prisma.marketMakingCycle.findMany({
    where: {
      botCustomerId: botCustomer.id
    },

  })
})

program.command('inspectCustomerWallets').action(async () => {
  const botCustomer = await prisma.botCustomer.findFirst({
    where: {
      name: 'Drew'
    }
  })

  if (!botCustomer) {
    console.error('bot customer not found');
    return;
  }

  const foundWallets = await prisma.botCustomerWallet.findMany({
    where: {
      botCustomerId: botCustomer.id,
      type: EWalletType.MARKET_MAKING
    }
  })

  console.log(`found ${foundWallets.length} wallets for market making`);

  console.log(foundWallets.map((wallet) => wallet.pubkey));

  const mainWallet = loadWalletFromU8IntArrayStringified(process.env.DREW_MAIN_FUNDING_WALLET!)

  const balances = await Promise.all(foundWallets.map(async (w) => {
    const balance = await connection.getBalance(new PublicKey(w.pubkey))
    await prisma.botCustomerWallet.update({
      where: {
        pubkey: w.pubkey
      },
      data: {
        latestSolBalance: balance / LAMPORTS_PER_SOL
      }
    })


    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(new PublicKey(w.pubkey), {
      mint: drewTokenMint
    })

    const drewTokenAccount = tokenAccounts.value.find((ta) => ta.account.data.parsed.info.mint === drewTokenMint.toBase58())

    const solBalance = balance / LAMPORTS_PER_SOL
    const drewTokenBalance = drewTokenAccount?.account.data.parsed.info.tokenAmount.uiAmount ?? 0

    console.log(`${w.pubkey} has ${solBalance} SOL & ${drewTokenBalance} DREW`);

    await prisma.botCustomerWallet.update({
      where: {
        pubkey: w.pubkey
      },
      data: {
        latestSolBalance: solBalance,
        latestTokenBalance: drewTokenBalance
      }
    })

    return { solBalance, tokenAmount: drewTokenBalance }
  }))

  const mainWalletBalance = await connection.getBalance(mainWallet.publicKey)
  const solBalance = balances.reduce((acc, curr) => acc + curr.solBalance, 0) + (mainWalletBalance / LAMPORTS_PER_SOL)
  const drewTokenBalance = balances.reduce((acc, curr) => acc + (curr.tokenAmount ?? 0), 0)

  const birdEyeUsdcRate: number = (await getBirdEyeUsdcRate(drewTokenMint.toBase58())).data.value ?? 0
  const solUsdcRate: number = (await getBirdEyeUsdcRate('So11111111111111111111111111111111111111112')).data.value ?? 0

  console.log('DREW/USDC rate:', birdEyeUsdcRate.toFixed(8));
  console.log('SOL/USDC rate:', solUsdcRate.toFixed(2));
  console.log('Total SOL balance:', solBalance.toFixed(2), `(~${(solBalance * solUsdcRate).toFixed(2)} USDC)`);
  console.log('Total DREW token balance:', drewTokenBalance.toFixed(2), `(~${(drewTokenBalance * birdEyeUsdcRate).toFixed(2)} USDC / ~${(drewTokenBalance * birdEyeUsdcRate / solUsdcRate).toFixed(2)} SOL)`);

})

program.command('fundMarketMakingWallets').action(async () => {
  const botCustomer = await prisma.botCustomer.findFirst({
    where: {
      name: 'Drew'
    }
  })

  if (!botCustomer) {
    console.error('bot customer not found');
    return;
  }

  const foundWallets = await prisma.botCustomerWallet.findMany({
    where: {
      botCustomerId: botCustomer.id,
      type: EWalletType.MARKET_MAKING
    }
  })
  const fundingWallet = loadWalletFromU8IntArrayStringified(process.env.DREW_MAIN_FUNDING_WALLET!);

  console.log(fundingWallet.publicKey.toBase58());

  const balanceOfWallet = await connection.getBalance(fundingWallet.publicKey);

  console.log(balanceOfWallet);

  const filteredWallets = foundWallets.filter((wallet, index) => {
    return index % 2 === 1
  })

  const walletsToFund = filteredWallets;

  const amounts = [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1]

  const transferInstructions: TransactionInstruction[] = []

  console.log('Amounts to fund each wallet:', amounts);

  for (let i = 0; i < walletsToFund.length; i++) {
    const wallet = walletsToFund[i];
    const amount = amounts[i];
    console.log(`Funding wallet ${wallet.pubkey} with ${amount} SOL`);
    // Add your funding logic here

    transferInstructions.push(
      SystemProgram.transfer({
        fromPubkey: fundingWallet.publicKey,
        toPubkey: new PublicKey(wallet.pubkey),
        lamports: amount * LAMPORTS_PER_SOL
      })
    )

    const updatedWallet = await prisma.botCustomerWallet.update({
      where: {
        pubkey: wallet.pubkey
      },
      data: {
        latestSolBalance: amount
      }
    })

    console.log(`Updated wallet ${updatedWallet.pubkey} with ${updatedWallet.latestSolBalance} SOL`);
  }

  const { transaction, blockhash } = await createTransactionForInstructions({
    wallet: fundingWallet.publicKey.toBase58(),
    instructions: transferInstructions,
    signers: [fundingWallet],
  })

  const { txSig, confirmedResult } = await sendAndConfirmTransactionAndRetry(
    transaction,
    blockhash
  )

  console.log('Transaction sent and confirmed:', txSig, confirmedResult);
})

program.command('executeJupiterSwap').action(async () => {
  const botCustomer = await getBotCustomerByName('Drew')

  const wallet = await pickRandomWalletFromCustomer({
    customerId: botCustomer.id,
    walletType: EWalletType.MARKET_MAKING,
    minSolBalance: 0.2,
    minTokenBalance: 0,
  })

  const decryptedWallet = decryptWallet(wallet.encryptedPrivKey)

  const { txSig, confirmedResult, actualOutputAmount, slippage, outputTokenBalance, expectedOutputAmount } = await executeJupiterSwap({
    inputAmount: 0.14,
    inputMint: 'So11111111111111111111111111111111111111112',
    outputMint: drewTokenMint.toBase58(),
    pubkey: decryptedWallet.publicKey,
    maxSlippage: 500
  }, decryptedWallet)

  console.log('Transaction sent and confirmed:', txSig);
  console.log('Confirmed result:', confirmedResult);
  console.log('Expected output amount:', expectedOutputAmount);
  console.log('Actual output amount:', actualOutputAmount);
  console.log('Slippage:', slippage);
  console.log('Output token balance:', outputTokenBalance);
})

program.command('updateBuyJobWithValues').action(async () => {
  await updateBuyJobsWithValues()
})

program.parse(process.argv);
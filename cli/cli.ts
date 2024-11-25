import { Command } from 'commander';
import { createBotCustomer, getBotCustomerByName } from '../src/modules/customer/botCustomer';
import { createAndStoreBotCustomerWallets, pickRandomWalletFromCustomer } from '../src/modules/wallet/walletService';
import { EJobStatus, EMarketMakingCycleType, EServiceType, EWalletType } from '@prisma/client';
import prisma from '../src/lib/prisma';
import { base58ToUint8Array, decryptWallet, loadWalletFromU8IntArrayStringified, uint8ArrayToBase58 } from '../src/modules/wallet/walletUtils';
import { connection } from '../src/config';
import { ComputeBudgetProgram, Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction, TransactionInstruction } from '@solana/web3.js';
import { createTransactionForInstructions, increaseComputePriceInstruction, increaseComputeUnitInstruction } from '../src/modules/solTransaction/solTransactionUtils';
import { sendAndConfirmTransactionAndRetry } from '../src/modules/solTransaction/solSendTransactionUtils';
import { createBookedServiceAndWallet, getActiveBookedServiceByBotCustomerId } from '../src/modules/customer/bookedService';
import { getBirdEyeUsdcRate } from '../src/modules/monitor/birdeye';
import { executeJupiterSwap, getBalances } from '../src/modules/markets/jupiter';
import { overwriteConsoleLog } from '../src/modules/utils/changeConsoleLogWithTimestamp';
import { scheduleNextBuyJob, updateBuyJobsWithValues } from '../src/modules/marketMaking/buyMarketMakingHandler';
import { getActiveMarketMakingCycleByBotCustomerId, setupMarketMakingCycle } from '../src/modules/marketMaking/marketMakingService';
import { getTokenBalanceForOwner, transferTokenInstruction } from '../src/modules/utils/splUtils';
import { exportSniperWallets } from '../src/modules/utils/exportUtils';
import _ from 'lodash';

const program = new Command();

const drewTokenMint = new PublicKey('14h6AkD5uSNzprMKm4yoQuQTymuYVMmmWo8EADEtTNUT')

overwriteConsoleLog()

program.command('initMarketMaking').action(async () => {
  const botCustomer = await createBotCustomer({
    name: 'Puff'
  })

  console.log(`created bot customer ${botCustomer.id}: ${botCustomer.name}`);

  const botCustomerWallets = await createAndStoreBotCustomerWallets({
    subWalletCount: 24,
    walletType: EWalletType.MARKET_MAKING,
    customerId: botCustomer.id,
  })

  console.log(`created ${botCustomerWallets.count} wallets for market making`);

  const foundWallets = await prisma.botCustomerWallet.findMany({
    where: {
      botCustomerId: botCustomer.id,
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

program.command('initMarketMakingService').action(async () => {
  const botCustomer = await getBotCustomerByName('Drew')

  if (!botCustomer) {
    console.error('bot customer not found');
    return;
  }

  const splToken = await prisma.splToken.create({
    data: {
      name: 'PUFF',
      symbol: 'PUFF',
      tokenMint: 'G9tt98aYSznRk7jWsfuz9FnTdokxS6Brohdo9hSmjTRB',
      decimals: 9,
      isSPL: true,
    }
  })

  const bookedService = await createBookedServiceAndWallet({
    botCustomerId: botCustomer.id,
    solAmount: 59,
    serviceType: EServiceType.MARKET_MAKING,
    usedSplTokenMint: splToken.tokenMint,
  })

  console.log(`created booked service ${bookedService.id} for market making`);

  const cycle = await prisma.marketMakingCycle.create({
    data: {
      buyMinAmount: 0.11,
      buyMaxAmount: 0.72,
      minDurationBetweenBuyAndSellInSeconds: 10,
      maxDurationBetweenBuyAndSellInSeconds: 100,
      minDurationBetweenJobsInSeconds: 30,
      maxDurationBetweenJobsInSeconds: 200,
      solSpentForCycle: 0,
      maxSolSpentForCycle: 7,
      maxSolEarnedForCycle: 7,
      solEarnedForCycle: 0,
      sellToBuyValueRatio: 0.95,
      type: EMarketMakingCycleType.PRE_PUSH,
      botCustomerId: botCustomer.id,
      bookedServiceId: bookedService.id,
      plannedTotalDurationInMinutes: 2400,
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
      earliestExecutionTimestampForBuy: new Date(Date.now() + 360 * 1000),
    },
  })

  console.log(`scheduled first buy job ${nextJob.id} for market making cycle ${cycle.id}`);


})

program.command('setupMarketMakingCycle').action(async () => {
  const botCustomer = await getBotCustomerByName('Drew')

  const bookedService = await getActiveBookedServiceByBotCustomerId({
    botCustomerId: botCustomer.id,
    serviceType: EServiceType.MARKET_MAKING
  })

  await setupMarketMakingCycle({
    bookedService,
    createInput: {
      type: EMarketMakingCycleType.MAINTAIN,
      solSpentForCycle: 0,
      solEarnedForCycle: 0,
      maxSolSpentForCycle: 2.5,
      maxSolEarnedForCycle: 2.5,
      buyMinAmount: 0.11,
      buyMaxAmount: 0.63,
      minDurationBetweenBuyAndSellInSeconds: 10,
      maxDurationBetweenBuyAndSellInSeconds: 90,
      minDurationBetweenJobsInSeconds: 50,
      maxDurationBetweenJobsInSeconds: 190,
      isActive: true,
      sellToBuyValueRatio: 0.98,
      startTimestamp: new Date(),
    }
  })
})

program.command('setRequiredFieldsForDrewMarketMaking').action(async () => {
  const botCustomer = await getBotCustomerByName('Drew')

  const cycles = await prisma.marketMakingCycle.findMany({
    where: {
      botCustomerId: botCustomer.id
    },

  })
})

program.command('inspectMarketMakingCycle').option('-c, --customer <customer>', 'The customer to inspect').action(async (opts) => {
  const customer = opts.customer

  const botCustomer = await getBotCustomerByName(customer)

  const cycle = await getActiveMarketMakingCycleByBotCustomerId({
    botCustomerId: botCustomer.id
  })

  if (!cycle) {
    console.error('no active market making cycle found');
    return;
  }

  const jobs = await prisma.marketMakingJob.findMany({
    where: {
      cycleId: cycle.id
    }
  })



  const totalBuyAmount = jobs.reduce((acc, curr) => acc + (curr.solSpent ?? 0), 0)
  const totalSellAmount = jobs.reduce((acc, curr) => acc + (curr.solEarned ?? 0), 0)

  console.log(`total buy amount: ${totalBuyAmount} SOL`)
  console.log(`total sell amount: ${totalSellAmount} SOL`)

  const buyAmount24Hr = jobs.reduce((acc, curr) => acc + (curr.executedAtForBuy && curr.executedAtForBuy > new Date(Date.now() - 24 * 60 * 60 * 1000) ? curr.solSpent ?? 0 : 0), 0)
  const sellAmount24Hr = jobs.reduce((acc, curr) => acc + (curr.executedAtForSell && curr.executedAtForSell > new Date(Date.now() - 24 * 60 * 60 * 1000) ? curr.solEarned ?? 0 : 0), 0)

  console.log(`buy amount 24hr: ${buyAmount24Hr} SOL`)
  console.log(`sell amount 24hr: ${sellAmount24Hr} SOL`)
})

program.command('inspectCustomerWallets').option('-c, --customer <customer>', 'The customer to inspect').action(async (opts) => {

  const customer = opts.customer

  const botCustomer = await getBotCustomerByName(customer)

  const bookedService = await getActiveBookedServiceByBotCustomerId({
    botCustomerId: botCustomer.id,
    serviceType: EServiceType.MARKET_MAKING
  })

  if (!botCustomer || !bookedService) {
    console.error('bot customer or booked service not found');
    return;
  }

  const tokenMint = bookedService?.usedSplToken?.tokenMint
  const splToken = bookedService?.usedSplToken

  const foundWallets = await prisma.botCustomerWallet.findMany({
    where: {
      botCustomerId: botCustomer.id,
      type: EWalletType.MARKET_MAKING
    }
  })

  console.log(`found ${foundWallets.length} wallets for market making`);

  console.log(foundWallets.map((wallet) => wallet.pubkey));

  const balances = await Promise.all(foundWallets.map(async (w) => {
    const balance = await connection.getBalance(new PublicKey(w.pubkey))
    const solBalance = balance / LAMPORTS_PER_SOL

    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(new PublicKey(w.pubkey), {
      mint: new PublicKey(tokenMint)
    })

    const tokenAccount = tokenAccounts.value.find((ta) => ta.account.data.parsed.info.mint === tokenMint)

    const tokenBalance = tokenAccount?.account.data.parsed.info.tokenAmount.uiAmount ?? 0

    console.log(`${w.pubkey} has ${solBalance} SOL & ${tokenBalance} ${splToken.symbol}`);

    await prisma.botCustomerWallet.update({
      where: {
        pubkey: w.pubkey
      },
      data: {
        latestSolBalance: solBalance,
        latestTokenBalance: tokenBalance
      }
    })

    return { solBalance, tokenAmount: tokenBalance }
  }))

  const solBalance = balances.reduce((acc, curr) => acc + curr.solBalance, 0)
  const tokenBalance = balances.reduce((acc, curr) => acc + (curr.tokenAmount ?? 0), 0)

  const birdEyeUsdcRate: number = (await getBirdEyeUsdcRate(tokenMint)).data.value ?? 0
  const solUsdcRate: number = (await getBirdEyeUsdcRate('So11111111111111111111111111111111111111112')).data.value ?? 0

  console.log(`${splToken.symbol}/USDC rate: `, birdEyeUsdcRate.toFixed(8));
  console.log('SOL/USDC rate:', solUsdcRate.toFixed(2));
  console.log('Total SOL balance:', solBalance.toFixed(2), `(~${(solBalance * solUsdcRate).toFixed(2)} USDC)`);
  console.log(`Total ${splToken.symbol} token balance:`, tokenBalance.toFixed(2), `(~${(tokenBalance * birdEyeUsdcRate).toFixed(2)} USDC / ~${(tokenBalance * birdEyeUsdcRate / solUsdcRate).toFixed(2)} SOL)`);

})


program.command('fundMarketMakingWallets').action(async () => {
  const botCustomer = await getBotCustomerByName('Puff')
  const fundingWallet = loadWalletFromU8IntArrayStringified(process.env.PUFF_MAIN_FUNDING_WALLET!);
  const tokenFundingWallet = loadWalletFromU8IntArrayStringified(process.env.PUFF_MAIN_TOKEN_FUNDING_WALLET!);
  const tokenMint = 'G9tt98aYSznRk7jWsfuz9FnTdokxS6Brohdo9hSmjTRB'
  const splToken = await prisma.splToken.findFirst({
    where: {
      tokenMint
    }
  })

  if (!splToken) {
    console.error('spl token not found');
    return;
  }

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

  console.log(fundingWallet.publicKey.toBase58());

  const balanceOfWallet = (await connection.getBalance(fundingWallet.publicKey)) / LAMPORTS_PER_SOL;

  console.log('Balance of funding wallet:', balanceOfWallet);

  const solFundingWallets = foundWallets.filter((wallet, index) => {
    return index % 2 === 0
  })

  const puffFundingWallets = foundWallets.filter((wallet, index) => {
    return index % 2 === 1
  })

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
    tokenMint: splToken.tokenMint
  })

  if (!tokenBalance.tokenAccountPubkey) {
    console.error('Token account not found');
    return;
  }

  const tokenAmount = 1_200_000

  const averageAmountToFundTokenWallets = tokenAmount / puffFundingWallets.length

  const transferTokenInstructions: {instructions: TransactionInstruction[], keypair: Keypair}[] = []

  for (const puffWallet of puffFundingWallets) {
    const variance = (Math.random() * 0.4 - 0.2) * averageAmountToFundTokenWallets;
    const amountToFund = averageAmountToFundTokenWallets + variance;

    console.log(`Funding wallet ${puffWallet.pubkey} with ${amountToFund} tokens`);

    const transferTokenInstr = await transferTokenInstruction({
      mint: new PublicKey(splToken.tokenMint),
      from: tokenFundingWallet.publicKey,
      sourceTokenAccountPubkey: new PublicKey(tokenBalance.tokenAccountPubkey),
      to: new PublicKey(puffWallet.pubkey),
      amount: Math.floor(amountToFund * Math.pow(10, splToken.decimals))
    });

    transferTokenInstructions.push({
      instructions: transferTokenInstr,
      keypair: tokenFundingWallet
    });
  }

  const groupedTransferInstructions: {instructions: TransactionInstruction[], keypair: Keypair}[][] = [];
  const groupSize = 7;

  for (let i = 0; i < transferTokenInstructions.length; i += groupSize) {
    groupedTransferInstructions.push(transferTokenInstructions.slice(i, i + groupSize));
  }

  for (const group of groupedTransferInstructions) {
    const allInstructions = _.flatten(group.map((item) => item.instructions))
    const allSigners = group.map((item) => item.keypair)

    const { transaction: tokenTransaction, blockhash: tokenBlockhash } = await createTransactionForInstructions({
      wallet: allSigners[0].publicKey.toBase58(),
      instructions: allInstructions,
      signers: allSigners,
    })

    const { txSig: tokenTxSig, confirmedResult: tokenConfirmedResult } = await sendAndConfirmTransactionAndRetry(tokenTransaction, tokenBlockhash)

    console.log('Transaction sent and confirmed:', tokenTxSig, tokenConfirmedResult);
  }
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

program.command('convertUintPrivateKeyToBase58').action(async () => {
  const keypair = loadWalletFromU8IntArrayStringified(process.env.KEY_TO_LOAD!)
  const base58 = uint8ArrayToBase58(keypair.secretKey)
  console.log(base58)
})

program.command('convertBase58ToUint8').action(async () => {
  const base58Key = 'z4PS4JhznMyaknSwVDKWhJYoqAojFHgp4SHGnsVE1fMourqzhsrNQb6SrJ9mFw39LKUCHFckZktzrcqNfZXvZKU';
  const uint8Array = base58ToUint8Array(base58Key);
  console.log(uint8Array.toString());
})

program.command('exportSniperWallets').option('-c, --customer <customer>', 'The customer to get the wallets for').action(async (opts) => {
  const customer = opts.customer

  if (!customer) {
    console.error('Customer is required')
    return
  }

  await exportSniperWallets(customer)
})


program.command('createCustomer').option('-n, --name <name>', 'The name of the new customer').action(async (opts) => {
  const name = opts.name

  if (!name) {
    console.error('Customer name is required')
    return
  }

  const newCustomer = await createBotCustomer({
    name: name
  })

  console.log(`Created new customer with ID ${newCustomer.id} and name ${newCustomer.name}`);
})



program.command('generateAndExportSniperWallets').option('-c, --customer <customer>', 'The customer to generate the wallets for').option('-w, --walletCount <walletCount>', 'The number of wallets to generate').action(async (opts) => {

  const customer = opts.customer
  const walletCount = opts.walletCount ?? 200

  if (!customer) {
    console.error('Customer is required')
    return
  }

  const botCustomer = await getBotCustomerByName(customer)

  console.log(`created bot customer ${botCustomer.id}: ${botCustomer.name}`);

  const botCustomerWalletCreate = await createAndStoreBotCustomerWallets({
    subWalletCount: walletCount,
    walletType: EWalletType.SNIPING,
    customerId: botCustomer.id,
  })

  await exportSniperWallets(customer)
})

program.command('sendFromSniperToMain').action(async () => {
  const customer = await getBotCustomerByName('PF_SNIPER')
  const tokenMint = new PublicKey('Bv9jYA2MTLQM4qtUtWsBo6ovCWbeoKEZxnszL1nYpump')
  const toWallet = new PublicKey('8ts4iTomEGiBfYME18Dz53HAT8XMpAVUEiPiLMwjRU8r')

  const snipingWallets = await prisma.botCustomerWallet.findMany({
    where: {
      botCustomerId: customer.id,
      type: EWalletType.SNIPING  
    }
  })

  const transferInstructions: {instructions: TransactionInstruction[], keypair: Keypair}[] = []

  for (const snipingWallet of snipingWallets) {
    const {tokenAccountPubkey, tokenBalance} = await getTokenBalanceForOwner({
      ownerPubkey: snipingWallet.pubkey,
      tokenMint: tokenMint.toBase58()
    })

    console.log(`${snipingWallet.pubkey} has ${tokenBalance?.uiAmount} `);

    if (!!tokenAccountPubkey && tokenBalance?.uiAmount && tokenBalance.uiAmount > 0) {
      const transferTokenInstructions = await transferTokenInstruction({
        mint: tokenMint,
        from: new PublicKey(snipingWallet.pubkey),
        sourceTokenAccountPubkey: tokenAccountPubkey,
        to: toWallet,
        amount: tokenBalance.amount
      })

      const keypair = decryptWallet(snipingWallet.encryptedPrivKey)

      transferInstructions.push({
        instructions: transferTokenInstructions,
        keypair
      })
    }
  }

  const groupedTransferInstructions: {instructions: TransactionInstruction[], keypair: Keypair}[][] = [];
  const groupSize = 7;

  for (let i = 0; i < transferInstructions.length; i += groupSize) {
    groupedTransferInstructions.push(transferInstructions.slice(i, i + groupSize));
  }

  for (const group of groupedTransferInstructions) {
    const allInstructions = _.flatten(group.map((item) => item.instructions))
    const allSigners = group.map((item) => item.keypair)

    const { transaction, blockhash } = await createTransactionForInstructions({
      wallet: allSigners[0].publicKey.toBase58(),
      instructions: allInstructions,
      signers: allSigners,
    })

    const { txSig, confirmedResult } = await sendAndConfirmTransactionAndRetry(transaction, blockhash)

    console.log('Transaction sent and confirmed:', txSig, confirmedResult);
  }
})

program.command('scheduleNextBuyJob').option('-c, --customer <customer>', 'The customer to schedule the next buy job for').action(async (opts) => {
  const customer = opts.customer

  console.log(`Passed customer: ${customer}`)

  if (!customer) {
    console.error('Customer is required')
    return
  }
  const botCustomer = await getBotCustomerByName(customer)
  const activeCycle = await getActiveMarketMakingCycleByBotCustomerId({
    botCustomerId: botCustomer.id
  })

  if (!activeCycle) {
    console.error('No active market making cycle found')
    return
  }

  await scheduleNextBuyJob({
    cycleId: activeCycle.id,
    startInSeconds: 10
  })
})

program.parse(process.argv);
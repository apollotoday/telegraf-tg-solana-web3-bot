import { EJobStatus, EOnChainTransactionStatus, EWalletType, MarketMakingJob } from '@prisma/client'
import { pickRandomWalletFromCustomer } from '../wallet/walletService'
import { MarketMakingJobWithCycleAndBookedService } from './typesMarketMaking'
import { executeJupiterSwap, getBalances } from '../markets/jupiter'
import { getRandomInt, randomAmount } from '../../calculationUtils'
import { solTokenMint } from '../../config'
import { decryptWallet } from '../wallet/walletUtils'
import { PublicKey } from '@solana/web3.js'
import reattempt from 'reattempt'
import prisma from '../../lib/prisma'

export async function handleBuyMarketMakingJob(job: MarketMakingJobWithCycleAndBookedService) {
  try {
    console.log(
      `Handling buy job ${job.id} for ${job.cycle.bookedService.usedSplTokenMint} token mint for customer ${job.cycle.botCustomerId}`,
    )

    const tokenDecimals = job.cycle.bookedService.usedSplToken.decimals

    const wallet = await pickRandomWalletFromCustomer({
      customerId: job.cycle.botCustomerId,
      walletType: EWalletType.MARKET_MAKING,
      minSolBalance: job.cycle.buyMinAmount,
      minTokenBalance: -1,
    })

    console.log(`Using wallet ${wallet.pubkey} for buy job ${job.id}`)

    const solBalance = (wallet.latestSolBalance ?? 0) - 0.01

    const randomBuyAmount = randomAmount(job.cycle.buyMaxAmount, job.cycle.buyMinAmount, solBalance)

    const keypair = decryptWallet(wallet.encryptedPrivKey)

    const {
      txSig,
      confirmedResult,
      expectedOutputAmount,
      inputAmount,
      inputTokenBalance,
      slippage,
      actualOutputAmount,
      outputTokenBalance,
    } = await reattempt.run({ times: 4, delay: 200 }, async () => {
      return await executeJupiterSwap(
        {
          pubkey: new PublicKey(wallet.pubkey),
          maxSlippage: 500,
          inputAmount: randomBuyAmount,
          inputMint: solTokenMint,
          outputMint: job.cycle.bookedService.usedSplTokenMint,
        },
        keypair,
      )
    })

    console.log(
      `Finished buy job ${job.id} with txSig ${txSig}, inputAmount ${inputAmount} SOL, expected: ${expectedOutputAmount / tokenDecimals} tokens, actual: ${actualOutputAmount} tokens, post balance: ${outputTokenBalance?.uiAmount}`,
    )

    const minSecondsUntilSell = getRandomInt(
      job.cycle.minDurationBetweenBuyAndSellInSeconds,
      job.cycle.maxDurationBetweenBuyAndSellInSeconds,
    )

    const minDurationBetweenJobs = job.cycle.minDurationBetweenJobsInSeconds > minSecondsUntilSell ? job.cycle.minDurationBetweenJobsInSeconds : minSecondsUntilSell + 5

    // minSecondsUntilNextJob is the minimum time until the next job starts, minimum is minSecondsUntilSell + 5 seconds
    const minSecondsUntilNextJob = getRandomInt(minDurationBetweenJobs, job.cycle.maxDurationBetweenJobsInSeconds)

    // SCHEDULE SELL
    const updatedJob = await prisma.marketMakingJob.update({
      where: { id: job.id },
      data: {
        buyTransaction: {
          create: {
            transactionSignature: txSig,
            status: EOnChainTransactionStatus.SUCCESS,
          },
        },
        buyWallet: {
          connect: {
            pubkey: wallet.pubkey,
          },
        },
        solSpent: inputAmount,
        buyExpectedTokenOutputAmount: expectedOutputAmount,
        buyOutputTokenBalance: outputTokenBalance?.uiAmount,
        buyStatus: EJobStatus.FINISHED,
        tokenBought: actualOutputAmount,
        earliestExecutionTimestampForSell: new Date(Date.now() + minSecondsUntilSell * 1000),
        executedAtForBuy: new Date(),
      },
    })
    console.log(`Updated market making buy job and scheduled sell for job ${job.id} in ${minSecondsUntilSell} seconds`)

    const updatedWallet = await prisma.botCustomerWallet.update({
      where: { pubkey: wallet.pubkey },
      data: {
        latestTokenBalance: {
          increment: actualOutputAmount,
        },
        latestSolBalance: {
          decrement: inputAmount,
        },
      },
    })

    console.log(
      `Updated wallet ${wallet.pubkey} with latest token balance ${updatedWallet.latestTokenBalance} and latest sol balance ${updatedWallet.latestSolBalance}`,
    )

    const updatedCycle = await prisma.marketMakingCycle.update({
      where: { id: job.cycleId },
      data: {
        solSpentForCycle: {
          increment: inputAmount,
        },
      },
    })

    console.log(`Updated market making cycle ${job.cycleId} with sol spent for cycle ${updatedCycle.solSpentForCycle}`)

    if (updatedCycle.solSpentForCycle && updatedCycle.solSpentForCycle > updatedCycle.maxSolSpentForCycle) {
      console.log(`Market making cycle ${job.cycleId} has spent more than maxSolSpentForCycle, deactivating cycle`)
      await prisma.marketMakingCycle.update({
        where: { id: job.cycleId },
        data: { isActive: false, endTimestamp: new Date() },
      })
    } else {
      console.log(`Market making cycle ${job.cycleId} has not spent more than maxSolSpentForCycle, keeping cycle active`)
      
      await scheduleNextBuyJob({
        cycleId: job.cycleId,
        startInSeconds: minSecondsUntilNextJob,
      })
    }
  } catch (e) {
    console.log(`ERROR while handling buy job ${job.id}: ${e}`)
  }
}

export async function updateBuyJobsWithValues() {
  const buyJobs = await prisma.marketMakingJob.findMany({
    where: {
      buyTransactionSignature: {
        not: null
      },
      buyWalletPubkey: {
        not: null
      },
      tokenBought: 0,
      buyStatus: {
        not: EJobStatus.FAILED
      }
    },
    include: {
      cycle: {
        include: {
          bookedService: true
        }
      }
    }
  })

  for (const job of buyJobs) {
    console.log(`Updating buy job ${job.id} with signature ${job.buyTransactionSignature}`)

    if (!job.buyTransactionSignature || !job.buyWalletPubkey) {
      console.log(`Buy job ${job.id} has no transaction signature or wallet pubkey, skipping`)
      continue
    }

    try {


      const { tokenDifference, solPreBalance, solPostBalance, outputTokenBalance, lamportsDifference, inputTokenBalance } = await getBalances({
        txSig: job.buyTransactionSignature,
        tokenMint: job.cycle.bookedService.usedSplTokenMint,
        ownerPubkey: new PublicKey(job.buyWalletPubkey),
      })
  
      console.log(`Found token difference ${tokenDifference}, sol pre balance ${solPreBalance}, sol post balance ${solPostBalance}, output token balance ${outputTokenBalance?.uiAmount}, lamports difference ${lamportsDifference}, input token balance ${inputTokenBalance}`)
    
      
      const updatedWallet = await prisma.botCustomerWallet.update({
        where: { pubkey: job.buyWalletPubkey },
        data: {
          latestTokenBalance: {
            increment: tokenDifference,
          },
        },
      })
  
      console.log(`Updated wallet ${job.buyWalletPubkey} with latest token balance ${updatedWallet.latestTokenBalance}`)
  
      const updatedJob = await prisma.marketMakingJob.update({
        where: { id: job.id },
        data: {
          buyOutputTokenBalance: outputTokenBalance?.uiAmount,
          tokenBought: tokenDifference,
        },
      })
  
      console.log(`Updated buy job ${job.id} with token bought ${updatedJob.tokenBought}`)
    } catch (e: any) {
      console.log(`Error while updating buy job ${job.id}: ${e}`)

      if (e.message.includes('Transaction failed')) {
        await prisma.marketMakingJob.update({
          where: { id: job.id },
          data: { buyStatus: EJobStatus.FAILED },
        })
      }
    }
  }
}

export async function scheduleNextBuyJob({
  cycleId,
  startInSeconds,
}: {
  cycleId: string
  startInSeconds: number
}) {
  const nextJob = await prisma.marketMakingJob.create({
    data: {
      buyStatus: EJobStatus.OPEN,
      sellStatus: EJobStatus.OPEN,
      cycle: {
        connect: {
          id: cycleId,
        },
      },
      earliestExecutionTimestampForBuy: new Date(Date.now() + startInSeconds * 1000),
    },
  })

  console.log(`Scheduled next buy job ${nextJob.id} for cycle ${cycleId} in ${startInSeconds} seconds`)

  return nextJob
}
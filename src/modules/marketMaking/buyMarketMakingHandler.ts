import { EJobStatus, EOnChainTransactionStatus, EWalletType, MarketMakingJob } from '@prisma/client'
import { pickRandomWalletFromCustomer } from '../wallet/walletService'
import { MarketMakingJobWithCycleAndBookedService } from './typesMarketMaking'
import { executeJupiterSwap } from '../markets/jupiter'
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

    const wallet = await pickRandomWalletFromCustomer({
      customerId: job.cycle.botCustomerId,
      walletType: EWalletType.MARKET_MAKING,
      minSolBalance: job.cycle.buyMinAmount,
      minTokenBalance: 0,
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
      `Finished buy job ${job.id} with txSig ${txSig}, inputAmount ${inputAmount} SOL, expected: ${expectedOutputAmount} tokens, actual: ${actualOutputAmount} tokens, post balance: ${outputTokenBalance}`,
    )

    const minSecondsUntilSell = getRandomInt(
      job.cycle.minDurationBetweenBuyAndSellInSeconds,
      job.cycle.maxDurationBetweenBuyAndSellInSeconds,
    )

    // minSecondsUntilNextJob is the minimum time until the next job starts, minimum is minSecondsUntilSell + 5 seconds
    const minSecondsUntilNextJob = getRandomInt(minSecondsUntilSell + 5, job.cycle.maxDurationBetweenJobsInSeconds)

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
        buyOutputTokenBalance: outputTokenBalance,
        buyStatus: EJobStatus.FINISHED,
        tokenBought: actualOutputAmount,
        earliestExecutionTimestampForSell: new Date(Date.now() + minSecondsUntilSell * 1000),
        executedAtForBuy: new Date(),
      },
    })
    console.log(`Updated market making buy job and scheduled sell for job ${job.id} in ${minSecondsUntilNextJob} seconds`)

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
      const nextJob = await prisma.marketMakingJob.create({
        data: {
          buyStatus: EJobStatus.OPEN,
          sellStatus: EJobStatus.OPEN,
          cycle: {
            connect: {
              id: job.cycleId,
            },
          },
          earliestExecutionTimestampForBuy: new Date(Date.now() + minSecondsUntilNextJob * 1000),
        },
      })

      console.log(
        `Scheduled next market making buy job ${nextJob.id} for cycle ${job.cycleId} in ${minSecondsUntilNextJob} seconds`,
      )
    }
  } catch (e) {
    console.log(`ERROR while handling buy job ${job.id}: ${e}`)
  }
}

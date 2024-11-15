
import { EJobStatus, EOnChainTransactionStatus, EWalletType } from '@prisma/client';
import { pickRandomWalletFromCustomer } from '../wallet/walletService';
import { MarketMakingJobWithCycleAndBookedService } from './typesMarketMaking';
import { getRandomFloat, getRandomInt, randomAmount } from '../../calculationUtils';
import { decryptWallet } from '../wallet/walletUtils';
import reattempt from 'reattempt';
import { executeJupiterSwap } from '../markets/jupiter';
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { connection, solTokenMint } from '../../config';
import prisma from '../../lib/prisma';

export async function handleSellMarketMakingJob(job: MarketMakingJobWithCycleAndBookedService) {
  try {
    console.log(
      `Handling sell job ${job.id} for ${job.cycle.bookedService.usedSplTokenMint} token mint for customer ${job.cycle.botCustomerId}`,
    )

    if (!job.tokenBought) {
      console.log(`Job ${job.id} has no token bought, skipping`)
      return
    }

    const variance = 0.3;
    const minSellAmount = job.cycle.sellToBuyValueRatio! * job.tokenBought * (1 - variance);
    const maxSellAmount = job.cycle.sellToBuyValueRatio! * job.tokenBought * (1 + variance);


    const wallet = await pickRandomWalletFromCustomer({
      customerId: job.cycle.botCustomerId,
      walletType: EWalletType.MARKET_MAKING,
      minSolBalance: 0.005,
      minTokenBalance: minSellAmount,
    })

    const preSolBalanceFromConn = await connection.getBalance(new PublicKey(wallet.pubkey), 'recent')

    const inputSellAmount = randomAmount(maxSellAmount, minSellAmount, wallet.latestTokenBalance ?? 0);

    console.log(`Using wallet ${wallet.pubkey} for buy job ${job.id} to sell ${inputSellAmount} tokens`)

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
      solPreBalance,
      solPostBalance,
    } = await reattempt.run({ times: 4, delay: 200 }, async () => {
      return await executeJupiterSwap(
        {
          pubkey: new PublicKey(wallet.pubkey),
          maxSlippage: 500,
          inputAmount: inputSellAmount,
          inputMint: job.cycle.bookedService.usedSplTokenMint,
          outputMint: solTokenMint,
        },
        keypair,
      )
    })


    const postSolBalanceFromConn = await connection.getBalance(new PublicKey(wallet.pubkey), 'recent')

    const expectedSolEarned = expectedOutputAmount / LAMPORTS_PER_SOL
    const lamportsEarned = postSolBalanceFromConn - preSolBalanceFromConn
    const solEarned = lamportsEarned > 0 ? (lamportsEarned / LAMPORTS_PER_SOL) : (expectedSolEarned - 0.0001)

    console.log({ postSolBalanceFromConn, preSolBalanceFromConn, solEarned })

    console.log(`Finished sell job ${job.id} with txSig ${txSig}, sold ${inputAmount} tokens, expected: ${expectedSolEarned} SOL, actual: ${solEarned} SOL, post balance: ${solPostBalance / LAMPORTS_PER_SOL} SOL`)

    // SCHEDULE SELL
    const updatedJob = await prisma.marketMakingJob.update({
      where: { id: job.id },
      data: {
        sellTransaction: {
          create: {
            transactionSignature: txSig,
            status: EOnChainTransactionStatus.SUCCESS,
          }
        },
        sellWallet: {
          connect: {
            pubkey: wallet.pubkey,
          }
        },
        solEarned,
        sellExpectedSolOutputAmount: expectedOutputAmount,
        sellOutputSolBalance: postSolBalanceFromConn,
        sellStatus: EJobStatus.FINISHED,
        tokenSold: inputAmount,
        executedAtForSell: new Date(),
      },
    })
    console.log(`Updated market making sell job for job ${job.id}`)

    const updatedWallet = await prisma.botCustomerWallet.update({
      where: { pubkey: wallet.pubkey },
      data: {
        latestTokenBalance: {
          decrement: inputAmount,
        },
        latestSolBalance: {
          increment: lamportsEarned,
        },
      },
    })

    console.log(`Updated wallet ${wallet.pubkey} with latest token balance ${updatedWallet.latestTokenBalance} and latest sol balance ${updatedWallet.latestSolBalance}`)

    const updatedCycle = await prisma.marketMakingCycle.update({
      where: { id: job.cycleId },
      data: {
        solSpentForCycle: {
          decrement: solEarned,
        },
      },
    })

    console.log(`Updated market making cycle ${job.cycleId} with sol spent for cycle ${updatedCycle.solSpentForCycle}`)
  } catch (e) {
    console.log(`ERROR while handling sell job ${job.id}: ${e}`)
  }

}
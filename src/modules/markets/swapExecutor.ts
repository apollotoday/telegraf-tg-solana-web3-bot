import { Keypair, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { MarketMakingJobWithCycleAndBookedService } from '../marketMaking/typesMarketMaking';
import { executeJupiterSwap } from './jupiter';
import { executeRaydiumSwapAndRetry, swapRaydium } from './raydium';
import { Percent } from '@raydium-io/raydium-sdk';
import { sleep } from '../utils/timeUtils';
import { solTokenMint } from '../../config';
import { getBalancesFromTxSig } from '../solTransaction/solTransactionUtils';

export type TSwapExecutorInput = {
  inputAmount: number
  inputMint: string
  outputMint: string
  pubkey: PublicKey
  maxSlippage: number
  type: 'buy' | 'sell'
  poolId?: PublicKey,
  poolSource?: 'Raydium' | 'Jupiter'
}

export async function executeAndParseSwap(
  { type, inputAmount, inputMint, outputMint, pubkey, maxSlippage: slippage, poolId, poolSource }: TSwapExecutorInput,
  feePayer: Keypair
) {
  const {txSig, confirmedResult, minAmountOut, expectedOutputAmount} = await executeSwap({ type, inputAmount, inputMint, outputMint, pubkey, maxSlippage: slippage, poolId, poolSource }, feePayer)

  const mintForTokenBalance = inputMint === solTokenMint ? outputMint : inputMint

  await sleep(2500)

  const { inputTokenBalance, outputTokenBalance, tokenDifference, solPreBalance, solPostBalance, solSpent } = await getBalancesFromTxSig({
    txSig,
    tokenMint: mintForTokenBalance,
    ownerPubkey: pubkey,
  })
  

  return {
    txSig,
    confirmedResult,
    inputAmount,
    minAmountOut,
    expectedOutputAmount,
    actualOutputAmount: tokenDifference,
    slippage: Math.abs(((tokenDifference - expectedOutputAmount) / expectedOutputAmount) * 100),
    inputTokenBalance,
    outputTokenBalance,
    solPreBalance,
    solPostBalance,
    solSpent,
  }

}

export async function executeSwap(
  { type, inputAmount, inputMint, outputMint, pubkey, maxSlippage: slippage, poolId, poolSource }: TSwapExecutorInput,
  feePayer: Keypair
) {
  
  if (!!poolId && poolSource === 'Raydium') {

    const {
      amountIn,
      minAmountOut,
      expectedAmountOut,
      txSig,
      confirmedResult,
    } = await executeRaydiumSwapAndRetry({
      swapParams: {
        poolId,
        keypair: feePayer,
        type,
        amountSide: 'in',
        amount: inputAmount,
        slippage: new Percent(slippage, 100),
      },
      priorityFeeLamports: 1_000_001,
    })

    return {
      txSig,
      confirmedResult,
      minAmountOut,
      expectedOutputAmount: Number(expectedAmountOut?.toExact() ?? minAmountOut?.toExact())
    }
    
  } else {
    const jupiterSwapRes =  await executeJupiterSwap(
      { inputAmount, inputMint, outputMint, pubkey, maxSlippage: slippage },
      feePayer
    )

    return {
      txSig: jupiterSwapRes.txSig,
      confirmedResult: jupiterSwapRes.confirmedResult,
      expectedOutputAmount: jupiterSwapRes.expectedOutputAmount / LAMPORTS_PER_SOL,
    }
  }
}
import { Keypair, PublicKey } from '@solana/web3.js';
import { MarketMakingJobWithCycleAndBookedService } from '../marketMaking/typesMarketMaking';
import { executeJupiterSwap } from './jupiter';
import { executeRaydiumSwap, swapRaydium } from './raydium';
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
  const {txSig, confirmedResult, expectedOutputAmount} = await executeSwap({ type, inputAmount, inputMint, outputMint, pubkey, maxSlippage: slippage, poolId, poolSource }, feePayer)

  const mintForTokenBalance = inputMint === solTokenMint ? outputMint : inputMint

  await sleep(2500)

  const { inputTokenBalance, outputTokenBalance, tokenDifference, lamportsDifference, solPreBalance, solPostBalance } = await getBalancesFromTxSig({
    txSig,
    tokenMint: mintForTokenBalance,
    ownerPubkey: pubkey,
  })

  console.log('lamports difference', lamportsDifference)

  return {
    txSig,
    confirmedResult,
    inputAmount,
    expectedOutputAmount,
    actualOutputAmount: tokenDifference,
    slippage: Math.abs(((lamportsDifference - expectedOutputAmount) / expectedOutputAmount) * 100),
    inputTokenBalance,
    outputTokenBalance,
    solPreBalance,
    solPostBalance,
  }

}

export async function executeSwap(
  { type, inputAmount, inputMint, outputMint, pubkey, maxSlippage: slippage, poolId, poolSource }: TSwapExecutorInput,
  feePayer: Keypair
) {
  
  if (!!poolId && poolSource === 'Raydium') {

    const {
      amountIn,
      amountOut,
      txSig,
      confirmedResult,
    } = await executeRaydiumSwap({
      swapParams: {
        poolId,
        keypair: feePayer,
        type,
        amountSide: 'in',
        amount: inputAmount,
        slippage: new Percent(100, 100),
      },
      priorityFeeLamports: 1_000_001,
    })

    return {
      txSig,
      confirmedResult,
      expectedOutputAmount: Number(amountOut.toExact())
    }
    
  } else {
    const jupiterSwapRes =  await executeJupiterSwap(
      { inputAmount, inputMint, outputMint, pubkey, maxSlippage: slippage },
      feePayer
    )

    return {
      txSig: jupiterSwapRes.txSig,
      confirmedResult: jupiterSwapRes.confirmedResult,
      expectedOutputAmount: jupiterSwapRes.expectedOutputAmount,
    }
  }
}
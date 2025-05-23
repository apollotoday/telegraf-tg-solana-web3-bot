import { Keypair, LAMPORTS_PER_SOL, PublicKey, VersionedTransaction } from '@solana/web3.js'
import { sendAndConfirmVersionedTransactionAndRetry } from '../../solUtils'
import { primaryRpcConnection, solTokenMint } from '../../config'
import { sleep } from '../../utils'
import { getBalancesFromTxSig } from '../solTransaction/solTransactionUtils'

export const fetchJupiterQuoteLink = async (
  inputMint: string,
  outputMint: string,
  amount: string,
  slippageBps: string,
  swapMode: 'ExactOut' | 'ExactIn',
  dex: boolean,
) => {
  const link = `https://quote-api.jup.ag/v6/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippageBps=${slippageBps}&swapMode=${swapMode}${
    dex ? '&dexes=Raydium%20CP' : ''
  }`
  console.log(link)
  while (true) {
    try {
      const res = await fetch(link)
      return res
    } catch (e) {}
  }
}

export type JupiterSwapInput = {
  pubkey: PublicKey
  inputAmount: number
  maxSlippage: number
  inputMint: string
  outputMint: string
}

export async function getJupiterQuote(
  input: JupiterSwapInput,
): Promise<{ inputAmount: number; tokenOutputAmount: number; quote: any }> {
  try {
    const { inputAmount, maxSlippage: slippage, inputMint, outputMint } = input
    const initAmount = Math.round(inputAmount * LAMPORTS_PER_SOL)

    const link1 = await fetchJupiterQuoteLink(inputMint, outputMint, initAmount.toString(), slippage.toString(), 'ExactIn', false)

    const getQuoteEst = await link1.json()

    const outAmount = Number(getQuoteEst.outAmount)

    console.log(`Fetching jupiter quote ${inputAmount} ${inputMint} to ${outAmount} ${outputMint}`)

    return {
      inputAmount: inputAmount,
      tokenOutputAmount: outAmount,
      quote: getQuoteEst,
    }
  } catch (e) {
    console.log('Failed to fetch jupiter quote', e)
    throw e
  }
}

export async function setupJupiterSwap({
  quote,
  swapInput,
}: {
  quote: any
  swapInput: JupiterSwapInput
}): Promise<{ transaction: VersionedTransaction; outputAmount: number }> {
  try {
    const { pubkey, inputAmount, maxSlippage: slippage, inputMint, outputMint } = swapInput
    const outputAmount = Number(quote.outAmount)
    console.log(`Swapping ${inputAmount} ${inputMint} to ${outputAmount} ${outputMint}`)
    const { swapTransaction } = await (
      await fetch('https://quote-api.jup.ag/v6/swap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quoteResponse: quote,
          userPublicKey: pubkey.toString(),
          wrapAndUnwrapSol: true,
          dynamicComputeUnitLimit: true,
          prioritizationFeeLamports: 'auto',
          dynamicSlippage: {
            maxBps: slippage,
          },
        }),
      })
    ).json()

    const swapTransactionBuf = Buffer.from(swapTransaction, 'base64')
    const transaction = VersionedTransaction.deserialize(swapTransactionBuf)

    return {
      transaction,
      outputAmount,
    }
  } catch (e) {
    console.log('Failed to setup jupiter swap', e)
    throw e
  }
}

export async function executeJupiterSwap(
  { inputAmount, inputMint, outputMint, pubkey, maxSlippage: slippage }: JupiterSwapInput,
  feePayer: Keypair
) {
  const {
    quote,
    inputAmount: tokenInputAmount,
    tokenOutputAmount,
  } = await getJupiterQuote({ inputAmount, inputMint, outputMint, pubkey, maxSlippage: slippage })

  const { transaction, outputAmount } = await setupJupiterSwap({
    quote,
    swapInput: { inputAmount, inputMint, outputMint, pubkey, maxSlippage: slippage },
  })

  transaction.sign([feePayer]);

  const { txSig, confirmedResult } = await sendAndConfirmVersionedTransactionAndRetry({
    transaction,
    useStakedRpc: true,
  })

  return {
    txSig,
    confirmedResult,
    inputAmount,
    expectedOutputAmount: outputAmount,
  }
}


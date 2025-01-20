import reattempt from 'reattempt'
import { primaryRpcConnection } from '../../config'
import { EOnChainTransactionStatus } from '@prisma/client'
import { Transaction } from '@solana/web3.js'


export async function sendAndConfirmTransactionAndRetry(
  transaction: Transaction,
  blockhash: {
    blockhash: string
    lastValidBlockHeight: number
  }
) {
  const serializedTransaction = transaction.serialize({
    requireAllSignatures: false,
  })

  return sendAndConfirmRawTransactionAndRetry(serializedTransaction, blockhash)
}

export async function sendAndConfirmRawTransactionAndRetry(
  serializedTransaction: Buffer,
  blockhash: {
    blockhash: string
    lastValidBlockHeight: number
  }
) {
  try {
    const { txSig, confirmedResult } = await reattempt.run(
      { times: 6, delay: 600 },
      async () => {
        console.log(`Sending transaction`)
        const [tx1, tx2, tx3] = await Promise.all([
          primaryRpcConnection.sendRawTransaction(serializedTransaction, {
            skipPreflight: true,
          }),
          primaryRpcConnection.sendRawTransaction(serializedTransaction, {
            skipPreflight: true,
          }),
          primaryRpcConnection.sendRawTransaction(serializedTransaction, {
            skipPreflight: true,
          }),
        ])

        console.log(`Sent transaction`, { tx1, tx2, tx3 })

        const confirmedResult = await confirmTransactionSignatureAndRetry(tx1, {
          ...blockhash,
        })

        console.log(`Confirmed transaction`, confirmedResult)

        return { txSig: tx1, confirmedResult }
      }
    )
    console.log({ txSig, confirmedResult })
    console.log('Successfully sent transaction: ', txSig)
    return { txSig, confirmedResult }
  } catch (e) {
    console.error('Failed to send transaction: ', e)
    throw new Error('Please retry! Failed to send transaction: ' + e)
  }
}

export async function confirmTransactionSignatureAndRetry(
  txSig: string,
  blockhash: {
    blockhash: string
    lastValidBlockHeight: number
  },
) {
  try {
    const confirmedSigResult = await reattempt.run({ times: 2, delay: 200 }, async () => {
      return await primaryRpcConnection.confirmTransaction(
        {
          blockhash: blockhash.blockhash,
          lastValidBlockHeight: blockhash.lastValidBlockHeight,
          signature: txSig,
        },
        'confirmed',
      )
    })
    
    console.log('Successfully confirmed transaction: ', txSig, confirmedSigResult, 'err', confirmedSigResult.value?.err)

    return {
      status: !!confirmedSigResult.value?.err ? EOnChainTransactionStatus.FAILED : EOnChainTransactionStatus.SUCCESS,
      value: confirmedSigResult.value,
      errorMessage: !!confirmedSigResult.value?.err ? confirmedSigResult.value.err.toString() : undefined,
    }
  } catch (e) {
    console.error('Failed to confirm transaction: ', e)
    throw new Error('Please retry! Failed to confirm transaction: ' + e)
  }
}

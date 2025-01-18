import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js'
import axios, { AxiosError } from 'axios'
import base58 from 'bs58'
import { primaryRpcConnection, jitoFee as configJitoFee, jitoFee } from './config'
import { sleep } from './utils'
import { confirmTransactionSignatureAndRetry } from './modules/solTransaction/solSendTransactionUtils'
const { JitoJsonRpcClient } = require('jito-js-rpc')

export const sendAndConfirmJitoTransactions = async ({
  transactions,
  payer,
  signers,
  feeTxInstructions,
  ...args
}: {
  transactions: VersionedTransaction[] | Transaction[]
  payer: Keypair
  signers?: Keypair[]
  feeTxInstructions?: TransactionInstruction[]
  jitoFee?: number
}) => {
  const tipAccounts = [
    'Cw8CFyM9FkoMi7K7Crf6HNQqf4uEMzpKw6QNghXLvLkY',
    'DttWaMuVvTiduZRnguLF7jNxTgiMBZ1hyAumKUiL2KRL',
    '96gYZGLnJYVFmbjzopPSU6QiEV5fGqZNyN9nmNhvrZU5',
    '3AVi9Tg9Uo68tJfuvoKvqKNWKkC5wPdSSdeBnizKZ6jT',
    'HFqU5x63VTqvQss8hp11i4wVV8bD44PvwucfZ2bU7gRe',
    'ADaUMid9yfUytqMBgopwjb2DTLSokTSzL1zt6iGPaS49',
    'ADuUkR4vqLUMWXxW9gh6D6L8pMSawimctcNZ5pGwDcEt',
    'DfXygSm4jCyNCybVYYK6DwvWqjKee8pbDmJGcLWNDXjh',
  ]
  const jitoFeeWallet = new PublicKey(tipAccounts[Math.floor(tipAccounts.length * Math.random())])

  const jitoFee = args.jitoFee ?? configJitoFee

  // console.log(`Selected Jito fee wallet: ${jitoFeeWallet.toBase58()}`);

  try {
    console.log(`Calculated fee: ${jitoFee / LAMPORTS_PER_SOL} sol`)
    let latestBlockhash = await primaryRpcConnection.getLatestBlockhash()
    const jitTipTxFeeMessage = new TransactionMessage({
      payerKey: payer.publicKey,
      recentBlockhash: latestBlockhash.blockhash,
      instructions: [
        ...(feeTxInstructions ?? []),
        SystemProgram.transfer({
          fromPubkey: payer.publicKey,
          toPubkey: jitoFeeWallet,
          lamports: jitoFee,
        }),
      ],
    }).compileToV0Message()

    const jitoFeeTx = new VersionedTransaction(jitTipTxFeeMessage)
    jitoFeeTx.sign([payer, ...(signers ?? [])])

    const jitoTxsignature = base58.encode(jitoFeeTx.signatures[0])

    // Serialize the transactions once here
    const serializedjitoFeeTx = base58.encode(jitoFeeTx.serialize())
    const serializedTransactions = [serializedjitoFeeTx]
    for (let i = 0; i < transactions.length; i++) {
      const serializedTransaction = base58.encode(transactions[i].serialize())
      serializedTransactions.push(serializedTransaction)
    }

    const endpoints = [
      'https://ny.mainnet.block-engine.jito.wtf/api/v1/bundles',
      // "https://tokyo.mainnet.block-engine.jito.wtf/api/v1/bundles",
      // "https://amsterdam.mainnet.block-engine.jito.wtf/api/v1/bundles",
      // "https://frankfurt.mainnet.block-engine.jito.wtf/api/v1/bundles",
      // 'https://mainnet.block-engine.jito.wtf/api/v1/bundles',
    ]

    const requests = endpoints.map((url) =>
      axios.post(url, {
        jsonrpc: '2.0',
        id: 1,
        method: 'sendBundle',
        params: [serializedTransactions],
      }),
    )

    const results = await Promise.all(requests.map((p) => p.catch((e) => e)))

    console.log('jito bundle tx', results[0].data.result)

    const signatures = transactions.map((tx) => {
      if (tx instanceof VersionedTransaction) {
        return base58.encode(tx.signatures[0])
      } else {
        return base58.encode(tx.signatures[0].signature!)
      }
    })
    console.log('jito results', [jitoTxsignature, ...signatures])

    const successfulResults = results.filter((result) => !(result instanceof Error))

    if (successfulResults.length > 0) {
      console.log(`Successful response`)

      const confirmation = await primaryRpcConnection.confirmTransaction(
        {
          signature: jitoTxsignature,
          lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
          blockhash: latestBlockhash.blockhash,
        },
        'confirmed',
      )

      console.log(confirmation)

      return { confirmed: !confirmation.value.err, jitoTxsignature }
    } else {
      console.log(`No successful responses received for jito`)
    }

    return { confirmed: false }
  } catch (error) {
    if (error instanceof AxiosError) {
      console.log('Failed to execute jito transaction')
    }
    console.log('Error during transaction execution', error)
    return { confirmed: false }
  }
}

export const sendAndConfirmJitoTransactionsRpc = async ({
  transactions,
  payer,
  signers,
  feeTxInstructions,
}: {
  transactions: VersionedTransaction[] | Transaction[]
  payer: Keypair
  signers?: Keypair[]
  feeTxInstructions?: TransactionInstruction[]
}) => {
  const tipAccounts = [
    'Cw8CFyM9FkoMi7K7Crf6HNQqf4uEMzpKw6QNghXLvLkY',
    'DttWaMuVvTiduZRnguLF7jNxTgiMBZ1hyAumKUiL2KRL',
    '96gYZGLnJYVFmbjzopPSU6QiEV5fGqZNyN9nmNhvrZU5',
    '3AVi9Tg9Uo68tJfuvoKvqKNWKkC5wPdSSdeBnizKZ6jT',
    'HFqU5x63VTqvQss8hp11i4wVV8bD44PvwucfZ2bU7gRe',
    'ADaUMid9yfUytqMBgopwjb2DTLSokTSzL1zt6iGPaS49',
    'ADuUkR4vqLUMWXxW9gh6D6L8pMSawimctcNZ5pGwDcEt',
    'DfXygSm4jCyNCybVYYK6DwvWqjKee8pbDmJGcLWNDXjh',
  ]
  const jitoFeeWallet = new PublicKey(tipAccounts[Math.floor(tipAccounts.length * Math.random())])

  // console.log(`Selected Jito fee wallet: ${jitoFeeWallet.toBase58()}`);

  try {
    console.log(`Calculated fee: ${jitoFee / LAMPORTS_PER_SOL} sol`)
    let latestBlockhash = await primaryRpcConnection.getLatestBlockhash()
    const jitTipTxFeeMessage = new TransactionMessage({
      payerKey: payer.publicKey,
      recentBlockhash: latestBlockhash.blockhash,
      instructions: [
        ...(feeTxInstructions ?? []),
        SystemProgram.transfer({
          fromPubkey: payer.publicKey,
          toPubkey: jitoFeeWallet,
          lamports: jitoFee,
        }),
      ],
    }).compileToV0Message()

    const jitoFeeTx = new VersionedTransaction(jitTipTxFeeMessage)
    jitoFeeTx.sign([payer, ...(signers ?? [])])

    const jitoTxsignature = base58.encode(jitoFeeTx.signatures[0])

    // Serialize the transactions once here
    const serializedjitoFeeTx = base58.encode(jitoFeeTx.serialize())
    const serializedTransactions = [serializedjitoFeeTx]
    for (let i = 0; i < transactions.length; i++) {
      const serializedTransaction = base58.encode(transactions[i].serialize())
      serializedTransactions.push(serializedTransaction)
    }

    const endpoints = [
      'https://ny.mainnet.block-engine.jito.wtf/api/v1',
      // "https://tokyo.mainnet.block-engine.jito.wtf/api/v1/bundles",
      // "https://amsterdam.mainnet.block-engine.jito.wtf/api/v1",
      // "https://frankfurt.mainnet.block-engine.jito.wtf/api/v1/bundles",
      // 'https://mainnet.block-engine.jito.wtf/api/v1/bundles',
    ]

    const jitoClient = new JitoJsonRpcClient(endpoints[0], '')

    // const requests = endpoints.map((url) =>
    //   axios.post(url, {
    //     jsonrpc: "2.0",
    //     id: 1,
    //     method: "sendBundle",
    //     params: [serializedTransactions],
    //   })
    // );

    const result = await jitoClient.sendBundle([serializedTransactions])
    console.log('Bundle send result:', result)

    const bundleId = result.result

    console.log('jito bundle tx', bundleId)

    const signatures = transactions.map((tx) => {
      if (tx instanceof VersionedTransaction) {
        return base58.encode(tx.signatures[0])
      } else {
        return base58.encode(tx.signatures[0].signature!)
      }
    })
    console.log('jito results', [jitoTxsignature, ...signatures])

    const inflightStatus = await jitoClient.confirmInflightBundle(bundleId, 120000)

    if (inflightStatus.confirmation_status === 'confirmed') {
      console.log(`Successful response`)

      const confirmation = await primaryRpcConnection.confirmTransaction(
        {
          signature: jitoTxsignature,
          lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
          blockhash: latestBlockhash.blockhash,
        },
        'confirmed',
      )

      console.log(confirmation)

      return { confirmed: !confirmation.value.err, jitoTxsignature }
    } else {
      console.log(`No successful responses received for jito`)
    }

    return { confirmed: false }
  } catch (error) {
    if (error instanceof AxiosError) {
      console.log('Failed to execute jito transaction')
    }
    console.log('Error during transaction execution', error)
    return { confirmed: false }
  }
}

export const getJitoFeeInstructions = (payer: Keypair) => {
  const tipAccounts = [
    'Cw8CFyM9FkoMi7K7Crf6HNQqf4uEMzpKw6QNghXLvLkY',
    'DttWaMuVvTiduZRnguLF7jNxTgiMBZ1hyAumKUiL2KRL',
    '96gYZGLnJYVFmbjzopPSU6QiEV5fGqZNyN9nmNhvrZU5',
    '3AVi9Tg9Uo68tJfuvoKvqKNWKkC5wPdSSdeBnizKZ6jT',
    'HFqU5x63VTqvQss8hp11i4wVV8bD44PvwucfZ2bU7gRe',
    'ADaUMid9yfUytqMBgopwjb2DTLSokTSzL1zt6iGPaS49',
    'ADuUkR4vqLUMWXxW9gh6D6L8pMSawimctcNZ5pGwDcEt',
    'DfXygSm4jCyNCybVYYK6DwvWqjKee8pbDmJGcLWNDXjh',
  ]

  const jitoFeeWallet = new PublicKey(tipAccounts[Math.floor(tipAccounts.length * Math.random())])

  console.log(`Sending Jito fee to ${jitoFeeWallet.toBase58()} with amount ${jitoFee / LAMPORTS_PER_SOL} SOL`)
  
  return [
    SystemProgram.transfer({
      fromPubkey: payer.publicKey,
      toPubkey: jitoFeeWallet,
      lamports: jitoFee,
    }),
  ]
}

export const sendAndConfirmJitoTransactionViaRPC = async ({
  transaction,
  latestBlockhash,
}: {
  transaction: VersionedTransaction | Transaction
  latestBlockhash: {
    blockhash: string
    lastValidBlockHeight: number
  }
}) => {

  try {
    const serializedTransaction = base58.encode(transaction.serialize())

    const endpoints = [
      'https://ny.mainnet.block-engine.jito.wtf/api/v1',
      // "https://tokyo.mainnet.block-engine.jito.wtf/api/v1/bundles",
      // "https://amsterdam.mainnet.block-engine.jito.wtf/api/v1",
      // "https://frankfurt.mainnet.block-engine.jito.wtf/api/v1/bundles",
      // 'https://mainnet.block-engine.jito.wtf/api/v1/bundles',
    ]

    const jitoClient = new JitoJsonRpcClient(endpoints[0], '')

    // const requests = endpoints.map((url) =>
    //   axios.post(url, {
    //     jsonrpc: "2.0",
    //     id: 1,
    //     method: "sendBundle",
    //     params: [serializedTransactions],
    //   })
    // );

    const result = await jitoClient.sendTxn([serializedTransaction])
    console.log('JITO Transaction send result:', result)

    const signatureId = result.result

    console.log('jito tx', signatureId)

    const confirmedResult = await confirmTransactionSignatureAndRetry(signatureId, latestBlockhash)

    return { txSig: signatureId, confirmedResult }
  } catch (error) {
    if (error instanceof AxiosError) {
      console.log('Failed to execute jito transaction')
    }
    console.log('Error during transaction execution', error)
    return { confirmedResult: { status: 'FAILED' } }
  }
}

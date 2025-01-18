import {
  ComputeBudgetProgram,
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  Signer,
  Transaction,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js'
import { primaryRpcConnection, solTokenMint } from '../../config'
import { getErrorFromRPCResponse } from './web3ErrorLogs'
import { sendAndConfirmTransactionAndRetry } from './solSendTransactionUtils'
import _ from 'lodash'
import reattempt from 'reattempt'

export function increaseComputePriceInstruction(microLamports?: number) {
  return ComputeBudgetProgram.setComputeUnitPrice({
    microLamports: microLamports ?? 30001,
  })
}
export function increaseComputeUnitInstruction(units?: number) {
  return ComputeBudgetProgram.setComputeUnitLimit({
    units: units ?? 300000,
  })
}
export const getSimulationComputeUnits = async (
  connection: Connection,
  instructions: Array<TransactionInstruction>,
  payer: PublicKey,
): Promise<number | null> => {
  const testInstructions = [
    // Set an arbitrarily high number in simulation
    // so we can be sure the transaction will succeed
    // and get the real compute units used
    ComputeBudgetProgram.setComputeUnitLimit({ units: 1_400_000 }),
    ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 100_001 }),
    ...instructions,
  ]

  const testTransaction = new VersionedTransaction(
    new TransactionMessage({
      instructions: testInstructions,
      payerKey: payer,
      // RecentBlockhash can by any public key during simulation
      // since 'replaceRecentBlockhash' is set to 'true' below
      recentBlockhash: PublicKey.default.toString(),
    }).compileToV0Message(),
  )

  const rpcResponse = await connection.simulateTransaction(testTransaction, {
    replaceRecentBlockhash: true,
    sigVerify: false,
  })

  getErrorFromRPCResponse(rpcResponse)
  return rpcResponse.value.unitsConsumed || null
}

export async function createQuickTransactionForInstructions({
  instructions,
  signers,
  wallet,
  priorityFeeLamports,
  unitLimit,
}: {
  instructions: TransactionInstruction[]
  signers: Signer[]
  wallet: string,
  priorityFeeLamports?: number,
  unitLimit?: number,
}) {
  const blockhash = await primaryRpcConnection.getLatestBlockhash({
    commitment: 'confirmed',
  })

  const transaction = new Transaction({
    feePayer: new PublicKey(wallet),
    ...blockhash,
  }).add(
    increaseComputePriceInstruction(priorityFeeLamports ?? undefined),
    increaseComputeUnitInstruction(unitLimit ?? undefined),
    ...instructions,
  )

  if (signers.length > 0) {
    console.log(
      `Partial signing with `,
      signers.map((s) => s.publicKey.toBase58()),
    )
    await transaction.partialSign(...signers)
  }

  console.log('Debug log for Solana transaction:', `Wallet: ${wallet}`, `Instructions count: ${transaction.instructions.length}`)

  return { transaction, blockhash }
}

export async function createTransactionForInstructions({
  instructions,
  signers,
  wallet,
}: {
  instructions: TransactionInstruction[]
  signers: Signer[]
  wallet: string,

}) {
  const blockhash = await primaryRpcConnection.getLatestBlockhash({
    commitment: 'confirmed',
  })

  console.log(`blockhash`, blockhash)

  const unitsConsumed = await getSimulationComputeUnits(primaryRpcConnection, instructions, new PublicKey(wallet))

  if (!instructions.length) {
    throw new Error('No instructions provided')
  }

  const transaction = new Transaction({
    feePayer: new PublicKey(wallet),
    ...blockhash,
  }).add(
    increaseComputePriceInstruction(),
    increaseComputeUnitInstruction(!!unitsConsumed ? unitsConsumed + 1000 : undefined),
    ...instructions,
  )

  if (signers.length > 0) {
    console.log(
      `Partial signing with `,
      signers.map((s) => s.publicKey.toBase58()),
    )
    await transaction.partialSign(...signers)
  }

  console.log('Debug log for Solana transaction:', `Wallet: ${wallet}`, `Instructions count: ${transaction.instructions.length}`)

  return { transaction, unitsConsumed, blockhash }
}

export async function groupSendAndConfirmTransactions(
  transferInstructions: { instructions: TransactionInstruction[]; keypair?: Keypair }[],
  feePayer: Signer,
  groupSize: number = 6,
) {
  const groupedTransferInstructions: { instructions: TransactionInstruction[]; keypair?: Keypair }[][] = []

  for (let i = 0; i < transferInstructions.length; i += groupSize) {
    groupedTransferInstructions.push(transferInstructions.slice(i, i + groupSize))
  }

  const transactionResults = await Promise.all(
    groupedTransferInstructions.map(async (group) => {
      return await reattempt.run({ times: 7, delay: 100 }, async () => {
        const allInstructions = _.flatten(group.map((item) => item.instructions))
        const allSigners = group.map((item) => item.keypair).filter((item) => !!item)

        const { transaction: tokenTransaction, blockhash: tokenBlockhash } = await createTransactionForInstructions({
          wallet: feePayer.publicKey.toBase58(),
          instructions: allInstructions,
          signers: [feePayer, ...allSigners],
        })

        const { txSig, confirmedResult } = await sendAndConfirmTransactionAndRetry(
          tokenTransaction,
          tokenBlockhash,
        )

        console.log('Transaction sent and confirmed:', txSig, confirmedResult)

        return { txSig, confirmedResult }
      })
    }),
  )

  return transactionResults
}



export async function getBalancesFromTxSig({txSig, tokenMint, ownerPubkey}: {txSig: string, tokenMint: string, ownerPubkey: PublicKey}) {
  const detectedTransaction = await primaryRpcConnection.getParsedTransaction(txSig, {commitment: 'confirmed', maxSupportedTransactionVersion: 200})


  if (detectedTransaction?.meta?.err) {
    console.log('Transaction failed', detectedTransaction.meta.err)
    
    throw new Error(`Transaction failed: ${detectedTransaction.meta.err.toString()}`)
  }

  const preBalances = detectedTransaction?.meta?.preBalances;
  const postBalances = detectedTransaction?.meta?.postBalances;
  const accountKeys = detectedTransaction?.transaction.message.accountKeys;

  // Find the index of the target wallet in the list of account keys
  const walletIndex = accountKeys?.findIndex(
    (accountKey) => accountKey.pubkey.toBase58() === ownerPubkey.toBase58()
  );

  const isWalletInTransaction = walletIndex !== -1 && walletIndex !== undefined;
  const preSolLamportsBalance = isWalletInTransaction ? preBalances?.[walletIndex] ?? 0 : 0;
  const postSolLamportsBalance = isWalletInTransaction ? postBalances?.[walletIndex] ?? 0 : 0;
  const solPreBalance = preSolLamportsBalance / LAMPORTS_PER_SOL;
  const solPostBalance = postSolLamportsBalance / LAMPORTS_PER_SOL;
  const lamportsSpent = preSolLamportsBalance - postSolLamportsBalance;
  const solSpent = lamportsSpent / LAMPORTS_PER_SOL;

  console.log({
    solPreBalance,
    solPostBalance,
    lamportsSpent,
  })

  const inputTokenBalance = detectedTransaction?.meta?.preTokenBalances?.find(b => b.mint === tokenMint && b.owner === ownerPubkey.toString())?.uiTokenAmount
  const outputTokenBalance = detectedTransaction?.meta?.postTokenBalances?.find(b => b.mint === tokenMint && b.owner === ownerPubkey.toString())?.uiTokenAmount

  const tokenDifference = (outputTokenBalance?.uiAmount ?? 0) - (inputTokenBalance?.uiAmount ?? 0)

  const lamportsDifference = (isNaN(Number(outputTokenBalance?.amount)) ? 0 : Number(outputTokenBalance?.amount)) - 
                             (isNaN(Number(inputTokenBalance?.amount)) ? 0 : Number(inputTokenBalance?.amount))


  console.log({
    inputTokenBalance,
    outputTokenBalance,
    tokenDifference,
    lamportsDifference,
    solPreBalance,
    solPostBalance,
  })

  return {
    inputTokenBalance,
    outputTokenBalance,
    tokenDifference,
    lamportsDifference,
    solSpent,
    solPreBalance,
    solPostBalance,
  }
}

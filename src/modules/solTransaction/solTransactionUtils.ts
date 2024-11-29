import {
  ComputeBudgetProgram,
  Connection,
  Keypair,
  PublicKey,
  Signer,
  Transaction,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js'
import { connection } from '../../config'
import { getErrorFromRPCResponse } from './web3ErrorLogs'
import { sendAndConfirmTransactionAndRetry } from './solSendTransactionUtils'
import _ from 'lodash'

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

export async function createTransactionForInstructions({
  instructions,
  signers,
  wallet,
}: {
  instructions: TransactionInstruction[]
  signers: Signer[]
  wallet: string
}) {
  const blockhash = await connection.getLatestBlockhash({
    commitment: 'confirmed',
  })

  console.log(`blockhash`, blockhash)

  const unitsConsumed = await getSimulationComputeUnits(connection, instructions, new PublicKey(wallet))

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
  transferInstructions: { instructions: TransactionInstruction[]; keypair: Keypair }[],
  feePayer: Signer,
  groupSize: number = 6,
) {
  const groupedTransferInstructions: { instructions: TransactionInstruction[]; keypair: Keypair }[][] = []

  for (let i = 0; i < transferInstructions.length; i += groupSize) {
    groupedTransferInstructions.push(transferInstructions.slice(i, i + groupSize))
  }

  for (const group of groupedTransferInstructions) {
    const allInstructions = _.flatten(group.map((item) => item.instructions))
    const allSigners = group.map((item) => item.keypair)

    const { transaction: tokenTransaction, blockhash: tokenBlockhash } = await createTransactionForInstructions({
      wallet: feePayer.publicKey.toBase58(),
      instructions: allInstructions,
      signers: [feePayer, ...allSigners],
    })

    const { txSig: tokenTxSig, confirmedResult: tokenConfirmedResult } = await sendAndConfirmTransactionAndRetry(
      tokenTransaction,
      tokenBlockhash,
    )

    console.log('Transaction sent and confirmed:', tokenTxSig, tokenConfirmedResult)
  }
}

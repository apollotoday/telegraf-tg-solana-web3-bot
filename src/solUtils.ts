import { LAMPORTS_PER_SOL, PublicKey, SystemProgram, TransactionInstruction } from '@solana/web3.js'

export function solTransfer({ solAmount, from, to }: { solAmount: number; from: string; to: string }) {
  const lamports = solAmount * LAMPORTS_PER_SOL

  const solTransfInx: TransactionInstruction = SystemProgram.transfer({
    fromPubkey: new PublicKey(from),
    toPubkey: new PublicKey(to),
    lamports: solAmount,
  })

  return solTransfInx
}

import { Keypair, PublicKey, TransactionInstruction } from '@solana/web3.js'
import { connection } from '../../config'
import { createAssociatedTokenAccountInstruction, createTransferInstruction, getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from '@solana/spl-token';

export async function getTokenBalanceForOwner({ ownerPubkey, tokenMint }: { ownerPubkey: string; tokenMint: string }) {
  const tokenAccounts = await connection.getParsedTokenAccountsByOwner(new PublicKey(ownerPubkey), {
    mint: new PublicKey(tokenMint),
  })

  const tokenAccount = tokenAccounts.value.find((ta) => ta.account.data.parsed.info.mint === tokenMint)

  const tokenBalance = tokenAccount?.account.data.parsed.info.tokenAmount

  return {
    tokenBalance,
    tokenAccountPubkey: tokenAccount?.pubkey,
  }
}

export async function getTokenAccount(mint: PublicKey, user: PublicKey) {
  const userTokenAccounts = await connection.getParsedTokenAccountsByOwner(user, {
    mint: mint,
  })

  if (userTokenAccounts.value.length === 0) return null
  return (
    userTokenAccounts.value.find((t) => !!t.account.data.parsed.info.tokenAmount.uiAmount) ??
    userTokenAccounts.value[0]
  )
}

export async function transferTokenInstruction({
  mint,
  from,
  sourceTokenAccountPubkey,
  to,
  amount,
}: {
  mint: PublicKey
  from: PublicKey
  sourceTokenAccountPubkey: PublicKey
  to: PublicKey
  amount: number
}) {
  const instructions: TransactionInstruction[] = []
  const destTokenAccount = await getTokenAccount(mint, to)
  let destTokenAccountPubkey: PublicKey | undefined = destTokenAccount?.pubkey

  if (!destTokenAccountPubkey) {
    const {tokenAccountPubkey, instruction} = await findAndCreateAssociatedTokenAccount(mint, to, from)

    instructions.push(instruction)
    destTokenAccountPubkey = tokenAccountPubkey
  }

  instructions.push(createTransferInstruction(sourceTokenAccountPubkey, destTokenAccountPubkey, from, amount, []))

  return instructions
}

export async function findAndCreateAssociatedTokenAccount(mint: PublicKey, owner: PublicKey, payer: PublicKey) {
  const createdDestTokenAccountAddress = await getAssociatedTokenAddress(mint, owner)

  return {
    tokenAccountPubkey: createdDestTokenAccountAddress,
    instruction: createAssociatedTokenAccountInstruction(payer, createdDestTokenAccountAddress, owner, mint),
  }
}

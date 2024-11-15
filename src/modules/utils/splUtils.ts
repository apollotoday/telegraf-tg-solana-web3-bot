import { Keypair, PublicKey } from '@solana/web3.js'
import { connection } from '../../config'
import { createTransferInstruction, TOKEN_PROGRAM_ID } from '@solana/spl-token';

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
  const destTokenAccount = await getTokenAccount(mint, to)

  if (!destTokenAccount) {
    throw new Error('Destination token account not found')
  }

  return createTransferInstruction(
    sourceTokenAccountPubkey,
    destTokenAccount.pubkey,
    from,
    amount,
    []
  )
}

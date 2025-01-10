import { BotCustomerWallet } from '@prisma/client'
import { PumpFunSDK } from 'pumpdotfun-sdk'
import { decryptWallet } from '../wallet/walletUtils'
import { primaryRpcConnection } from '../../config'
import { AnchorProvider } from '@coral-xyz/anchor'
import NodeWallet from '@coral-xyz/anchor/dist/cjs/nodewallet'
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js'
import fs from 'fs/promises'
import { getTokenBalanceForOwner } from '../utils/splUtils'

const SLIPPAGE_BASIS_POINTS = BigInt(10000)


export async function sellPumpFunTokens({
  mainWallet,
  tokenMint,
  tokenAmount,
}: {
  mainWallet: BotCustomerWallet
  tokenMint: string
  tokenAmount: number
}) {
  const keypair = decryptWallet(mainWallet.encryptedPrivKey)
  const wallet = new NodeWallet(keypair)

  const provider = new AnchorProvider(primaryRpcConnection, wallet, { commitment: 'confirmed' })
  const pumpFunSDKInstance = new PumpFunSDK(provider)

  await pumpFunSDKInstance.sell(keypair, new PublicKey(tokenMint), BigInt(tokenAmount), SLIPPAGE_BASIS_POINTS, { unitLimit: 250_000, unitPrice: 250_000 })
}

export async function sellAllPumpFunTokensFromMultipleWalletsInstruction({
  wallets,
  tokenMint,
}: {
  wallets: Keypair[]
  tokenMint: string
}) {
  return Promise.all(wallets.map(async (wallet) => {
    const provider = new AnchorProvider(primaryRpcConnection, new NodeWallet(wallet), { commitment: 'confirmed' })
    const pumpFunSDKInstance = new PumpFunSDK(provider)
    const tokenBalance = await getTokenBalanceForOwner({
      ownerPubkey: wallet.publicKey.toBase58(),
      tokenMint,
    })
    const tx = await pumpFunSDKInstance.getSellInstructionsByTokenAmount(wallet.publicKey, new PublicKey(tokenMint), BigInt(tokenBalance.tokenBalance.amount), SLIPPAGE_BASIS_POINTS, 'confirmed')
    return tx.instructions
  }))
}

export async function buyPumpFunTokens({
  mainWallet,
  tokenMint,
  solAmount,
}: {
  mainWallet: Keypair
  tokenMint: string
  solAmount: number
}) {
  const wallet = new NodeWallet(mainWallet)

  const provider = new AnchorProvider(primaryRpcConnection, wallet, { commitment: 'confirmed' })
  const pumpFunSDKInstance = new PumpFunSDK(provider)

  await pumpFunSDKInstance.buy(mainWallet, new PublicKey(tokenMint), BigInt(solAmount * LAMPORTS_PER_SOL), SLIPPAGE_BASIS_POINTS, { unitLimit: 250_000, unitPrice: 250_000 })
}

export async function setupPumpFunToken({
  mainWallet,
  mint,
  tokenSymbol,
  description,
  twitter,
  tokenImage,
  solAmount = 0.01,
}: {
  mainWallet: BotCustomerWallet
  mint: Keypair
  tokenSymbol: string
  tokenImage: string
  description: string
  twitter?: string
  solAmount?: number
}) {
  try {
    const keypair = decryptWallet(mainWallet.encryptedPrivKey)
    const wallet = new NodeWallet(keypair)

    const provider = new AnchorProvider(primaryRpcConnection, wallet, { commitment: 'confirmed' })
    const pumpFunSDKInstance = new PumpFunSDK(provider)

    let bondingCurveAccount = await pumpFunSDKInstance.getBondingCurveAccount(mint.publicKey)

    console.log(`Bonding curve account for ${tokenSymbol}:`, bondingCurveAccount)

    if (!bondingCurveAccount) {
      const fileBuffer = await fs.readFile(tokenImage)
      const fileBlob = new Blob([fileBuffer])

      const tokenMetadata = {
        description,
        symbol: tokenSymbol,
        name: tokenSymbol,
        file: fileBlob,
        twitter,
      }

      console.log(`Token metadata for ${tokenSymbol}:`, tokenMetadata)

      console.log(`Creating and buying pump.fun token for mint=${mint.publicKey.toBase58()} ${tokenSymbol} with ${solAmount} SOL`)

      const createResults = await pumpFunSDKInstance.createAndBuy(
        keypair,
        mint,
        tokenMetadata,
        BigInt(solAmount * LAMPORTS_PER_SOL),
        SLIPPAGE_BASIS_POINTS,
        {
          unitLimit: 250_000,
          unitPrice: 500_000,
        },
      )

      if (createResults.success) {
        console.log(`Successfully created pump.fun token for ${tokenSymbol}:`, `https://pump.fun/${mint.publicKey.toBase58()}`)
        bondingCurveAccount = await pumpFunSDKInstance.getBondingCurveAccount(mint.publicKey)
        console.log(`Bonding curve after create and buy for ${tokenSymbol}:`, bondingCurveAccount)
        const splTokenAccount = await getTokenBalanceForOwner({
          ownerPubkey: keypair.publicKey.toBase58(),
          tokenMint: mint.publicKey.toBase58(),
        })
        console.log(`Token balance for ${tokenSymbol}:`, splTokenAccount.tokenBalance.uiAmount)

        return {
          bondingCurveAccount,
          splTokenAccount,
        }
      } else {
        const splTokenAccount = await getTokenBalanceForOwner({
          ownerPubkey: keypair.publicKey.toBase58(),
          tokenMint: mint.publicKey.toBase58(),
        })

        return {
          bondingCurveAccount,
          splTokenAccount,
        }
      }
    }
  } catch (err: any) {
    console.log(`Error setting up pump.fun token for ${tokenSymbol}:`, err, (err as Error).stack)
  }
}

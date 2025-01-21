import { EServiceType } from '@prisma/client'
import prisma from '../../lib/prisma'
import { getBalanceFromWallet } from '../../solUtils'
import { telegrafBot } from './telegramBotSetup'
import { createAndStoreBotCustomerWallets } from '../wallet/walletService'
import { Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, TransactionInstruction } from '@solana/web3.js'
import { decryptWallet } from '../wallet/walletUtils'
import { groupSendAndConfirmTransactions } from '../solTransaction/solTransactionUtils'
import { subWalletCount, subWalletGroupCounts } from '../../config'
import { rankingBoost } from '../markets/raydium-custom'

export const MINIMUM_SOL_BALANCE_FOR_SERVICE = {
  // test
  [EServiceType.RANKING]: 0.00001,
  [EServiceType.VOLUME]: 3,
  // test
  [EServiceType.MARKET_MAKING]: 0.001,
  [EServiceType.SNIPER]: 0.01,
}

export async function checkServicesAwaitingFunds() {
  const bookedServices = await prisma.bookedService.findMany({
    where: {
      awaitingFunding: true,
      isActive: false,
    },
    include: {
      botCustomer: true,
      mainWallet: true,
    },
  })

  for (const bookedService of bookedServices) {
    const solBalance = await getBalanceFromWallet(bookedService.mainWallet.pubkey)
    const minBalance = MINIMUM_SOL_BALANCE_FOR_SERVICE[bookedService.type]

    if (solBalance >= minBalance) {

      if (bookedService.type === EServiceType.MARKET_MAKING) {
        await telegrafBot.telegram.sendMessage(
          bookedService.botCustomerId,
          `Your service ${bookedService.type} has been funded with ${solBalance} SOL and will be active shortly.`,
        )
      } else if (bookedService.type === EServiceType.RANKING) {
        await telegrafBot.telegram.sendMessage(
          bookedService.botCustomerId,
          `Your service ${bookedService.type} has been funded with ${solBalance} SOL and will be active shortly.`,
        )

        const customerBotWallets = await createAndStoreBotCustomerWallets({ customerId: bookedService.botCustomerId, walletType: 'FEE_PAYER_FUND', subWalletCount })

        const solTransferInstructions: { instructions: TransactionInstruction[]; keypair: Keypair }[] = [];
        for (const customerBotWallet of customerBotWallets.wallets) {
          solTransferInstructions.push({
            instructions: [
              SystemProgram.transfer({
                fromPubkey: new PublicKey(bookedService.mainWallet.pubkey),
                toPubkey: new PublicKey(customerBotWallet.pubkey),
                lamports: Math.floor(0.0021 * LAMPORTS_PER_SOL),
              }),
            ],
            keypair: decryptWallet(bookedService.mainWallet.encryptedPrivKey)
          });
        }

        const transactionResults = await groupSendAndConfirmTransactions(solTransferInstructions, decryptWallet(bookedService.mainWallet.encryptedPrivKey), subWalletGroupCounts)

        await prisma.bookedService.update({
          where: { id: bookedService.id },
          data: { isActive: false, awaitingFunding: false, solAmountForService: solBalance },
        })
      }

    }
  }
}


export async function checkServicesRankingBoost() {
  try {
    const activeBookedServices = await prisma.bookedService.findMany({
      where: {
        awaitingFunding: false,
        isActive: false,
      },
      include: {
        botCustomer: true,
        mainWallet: true,
      },
    })

    for (const activeBookedService of activeBookedServices) {
      const id = activeBookedService.botCustomer.id
      const wallets = await prisma.botCustomerWallet.findMany({
        where: {
          botCustomerId: id,
          type: 'FEE_PAYER_FUND'
        },
        select: {
          isActive: true,
          botCustomerId: true,
          pubkey: true,
          encryptedPrivKey: true,
        }
      })

      rankingBoost(wallets, activeBookedService.mainWallet.encryptedPrivKey, activeBookedService.usedSplTokenMint, activeBookedService.poolIdForService!)
    }
  } catch (err) {
    console.error('checkServicesRankingBoost', err)
  }
}
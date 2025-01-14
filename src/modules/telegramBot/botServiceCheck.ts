import { EServiceType } from '@prisma/client'
import prisma from '../../lib/prisma'
import { getBalanceFromWallet } from '../../solUtils'
import { telegrafBot } from './telegramBotSetup'

export const MINIMUM_SOL_BALANCE_FOR_SERVICE = {
  [EServiceType.RANKING]: 2,
  [EServiceType.VOLUME]: 3,
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

    if (solBalance > minBalance) {

      if (bookedService.type === EServiceType.MARKET_MAKING) {
        await telegrafBot.telegram.sendMessage(
          bookedService.botCustomerId,
          `Your service ${bookedService.type} has been funded with ${solBalance} SOL and will be active shortly.`,
        )
      } else {
        await telegrafBot.telegram.sendMessage(
          bookedService.botCustomerId,
          `Your service ${bookedService.type} has been funded with ${solBalance} SOL and will be active shortly.`,
        )
      }

      

      await prisma.bookedService.update({
        where: { id: bookedService.id },
        data: { isActive: true, awaitingFunding: false, solAmountForService: solBalance },
      })
    }
  }
}

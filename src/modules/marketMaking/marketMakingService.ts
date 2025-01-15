import { BookedService, EMarketMakingCycleType, Prisma } from '@prisma/client'
import prisma from '../../lib/prisma'
import { scheduleNextBuyJob } from './buyMarketMakingHandler'

type MarketMakingCycleCreateInput = Omit<Prisma.MarketMakingCycleUncheckedCreateInput, 'bookedServiceId' | 'botCustomerId'>

export async function setupMarketMakingCycle({
  bookedService,
  createInput,
}: {
  bookedService: BookedService
  createInput: MarketMakingCycleCreateInput
}) {
  console.log(`Creating market making cycle for booked service ${bookedService.id}, bot customer ${bookedService.botCustomerId}`)

  const marketMakingCycle = await prisma.marketMakingCycle.create({
    data: {
      botCustomerId: bookedService.botCustomerId,
      bookedServiceId: bookedService.id,
      ...createInput,
    },
  })

  console.log(
    `Created market making cycle ${marketMakingCycle.id}, with type ${marketMakingCycle.type}, `,
    `Max sol spent for cycle: ${marketMakingCycle.maxSolSpentForCycle}, Max sol earned per cycle: ${marketMakingCycle.maxSolEarnedForCycle}, `,
    `Buy min: ${marketMakingCycle.buyMinAmount} - max: ${marketMakingCycle.buyMaxAmount}, `,
    `Duration between sells: ${marketMakingCycle.minDurationBetweenBuyAndSellInSeconds} - ${marketMakingCycle.maxDurationBetweenBuyAndSellInSeconds}, `,
    `Duration between jobs: ${marketMakingCycle.minDurationBetweenJobsInSeconds} - ${marketMakingCycle.maxDurationBetweenJobsInSeconds}, `,
    `Sell to buy value ratio: ${marketMakingCycle.sellToBuyValueRatio}`,
  )

  console.log('Scheduling first buy job')

  await scheduleNextBuyJob({
    cycleId: marketMakingCycle.id,
    startInSeconds: 30,
  })

  return marketMakingCycle
}

export async function getActiveMarketMakingCycleByBotCustomerId({
  botCustomerId,
}: {
  botCustomerId: string
}) {
  return prisma.marketMakingCycle.findFirst({ where: { botCustomerId, isActive: true }, include: { bookedService: true } })
}

import { BookedService, LiquidityPoolInfo, MarketMakingCycle, MarketMakingJob, SplToken } from '@prisma/client'

export type MarketMakingJobWithCycleAndBookedService = MarketMakingJob & {
  cycle: MarketMakingCycle & {
    bookedService: BookedService & {
      usedSplToken: SplToken
      poolForService?: LiquidityPoolInfo | null
    }
  }
}

export default {}

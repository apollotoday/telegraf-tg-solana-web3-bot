import { BookedService, MarketMakingCycle, MarketMakingJob, SplToken } from '@prisma/client'

export type MarketMakingJobWithCycleAndBookedService = MarketMakingJob & {
  cycle: MarketMakingCycle & {
    bookedService: BookedService & {
      usedSplToken: SplToken
    }
  }
}

export default {}

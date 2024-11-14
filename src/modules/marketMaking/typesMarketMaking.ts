import { BookedService, MarketMakingCycle, MarketMakingJob } from '@prisma/client'

export type MarketMakingJobWithCycleAndBookedService = MarketMakingJob & {
  cycle: MarketMakingCycle & {
    bookedService: BookedService
  }
}

export default {}

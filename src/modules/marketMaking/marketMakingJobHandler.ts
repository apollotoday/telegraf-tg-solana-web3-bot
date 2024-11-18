import { EJobStatus } from '@prisma/client'
import prisma from '../../lib/prisma'
import { handleBuyMarketMakingJob, updateBuyJobsWithValues } from './buyMarketMakingHandler'
import { handleSellMarketMakingJob } from './sellMarketMakingHandler'

export async function handleOpenMarketMakingJobs() {
  console.log('Handling open market making jobs')

  await updateBuyJobsWithValues()
  
  const buyMarketMakingJobs = await prisma.marketMakingJob.findMany({
    where: {
      earliestExecutionTimestampForBuy: {
        lte: new Date(),
        not: null,
      },
      buyStatus: EJobStatus.OPEN,
      OR: [
        {
          buyStartedAt: null,
        },
        {
          buyStartedAt: { lte: new Date(Date.now() - 1000 * 60 * 5) },
        },
      ],
    },
    include: {
      cycle: {
        include: {
          bookedService: {
            include: {
              usedSplToken: true
            }
          },
        }
      },
    }
  })

  const sellMarketMakingJobs = await prisma.marketMakingJob.findMany({
    where: {
      earliestExecutionTimestampForSell: {
        lte: new Date(),
        not: null,
      },
      buyStatus: EJobStatus.FINISHED,
      sellStatus: EJobStatus.OPEN,
      OR: [
        {
          sellStartedAt: null,
        },
        {
          sellStartedAt: { lte: new Date(Date.now() - 1000 * 60 * 5) },
        },
      ],
    },
    include: {
      cycle: {
        include: {
          bookedService: {
            include: {
              usedSplToken: true
            }
          },
        }
      },
    }
  })

  console.log(`Found ${buyMarketMakingJobs.length} buy jobs and ${sellMarketMakingJobs.length} sell jobs`)

  await prisma.marketMakingJob.updateMany({
    where: {
      id: {
        in: buyMarketMakingJobs.map((job) => job.id),
      },
    },
    data: {
      buyStartedAt: new Date(),
    },
  })

  await prisma.marketMakingJob.updateMany({
    where: {
      id: {
        in: sellMarketMakingJobs.map((job) => job.id),
      },
    },
    data: {
      sellStartedAt: new Date(),
    },
  })

  console.log('Updated buy and sell started at')

  await Promise.all([
    buyMarketMakingJobs.map(async (job) => {
      await handleBuyMarketMakingJob(job)
    }),
    sellMarketMakingJobs.map(async (job) => {
      await handleSellMarketMakingJob(job)
    }),
  ])
}

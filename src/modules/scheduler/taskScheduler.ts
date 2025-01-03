import cron from 'node-cron'
import { handleOpenMarketMakingJobs } from '../marketMaking/marketMakingJobHandler';

// pm2 instance name
const processName = process.env.name || 'primary';

export default function taskSchedulerInit() {
  console.log('Initializing task scheduler')
  cron.schedule('*/15 * * * * *', async () => {
    console.log('Cron: every 15 seconds')

    await handleOpenMarketMakingJobs()

    console.log('Cron: every 15 seconds done')
    
  })
}
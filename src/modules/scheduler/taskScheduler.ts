import cron from 'node-cron'
import { checkServicesAwaitingFunds, checkServicesRankingBoost } from '../telegramBot/botServiceCheck';

// pm2 instance name
const processName = process.env.name || 'primary';

export default function taskSchedulerInit() {
  console.log('Initializing task scheduler')
  cron.schedule('*/15 * * * * *', async () => {
    console.log('Cron: every 15 seconds')

    // await updateTokenInfos()

    // await handleOpenMarketMakingJobs()

    await checkServicesAwaitingFunds()
    checkServicesRankingBoost()

    console.log('Cron: every 15 seconds done')
    
  })
}
import { BotCustomer } from '@prisma/client'
import { TBookedServiceDefault } from '../customer/bookedService'
import { bold, fmt } from 'telegraf/format'
import { MomentumBotContext, telegramBotActions } from './telegramBotActionsAndTypes'

export const welcomeMessage = fmt`
Welcome to MomentumAI - your AI-powered market making bot for Solana tokens 🚀
      
Boost your token performance with an AI-driven liquidity strategy, increasing your visibility with more volume, transactions and intelligent market making to drive profit and price action.

With our latest AI technology, you'll have an AI-agent trader that's there for you 24/7, making sure your token is always in the best liquidity position.

👉 ${'https://momentumai.com'}`

export async function sendNewServiceBookingMessage(ctx: MomentumBotContext) {
  return ctx.sendPhoto(`https://s3.us-west-1.amazonaws.com/storage.monet.community/5z7kgy95vb.png`, {
    caption: fmt`
${welcomeMessage}

${bold('Select a service below to get started')}

🪄🪄🪄🪄🪄

`,
    reply_markup: {
      inline_keyboard: [
        [
          { text: 'Ranking Boost', callback_data: telegramBotActions.rankingBoost },
          { text: 'Volume Boost ⬆️ (coming soon)', callback_data: telegramBotActions.volumeBoost },
        ],
        [{ text: 'Boost - Ranking, Volume and Holders 📈 (coming soon)', callback_data: telegramBotActions.boostMedium }],
        [{ text: 'MomentumAI - AI Market Making 🚀🧠', callback_data: telegramBotActions.aiMarketMaking }],
      ],
    },
  })
}

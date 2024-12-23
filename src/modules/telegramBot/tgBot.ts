import { BookedService, BotCustomer, EServiceType } from '@prisma/client'
import { Context, Markup, session, Telegraf } from 'telegraf'
import { bold, fmt } from 'telegraf/format'
import prisma from '../../lib/prisma'
import { getBotCustomerByName, getBotCustomerByNameOrCreate } from '../customer/botCustomer'
import { createBookedServiceAndWallet, getBookedServicesByBotCustomerId, TBookedServiceDefault } from '../customer/bookedService'
import { welcomeMessage } from './textTemplates'
import { Update } from 'telegraf/typings/core/types/typegram'
import { isValidSolanaAddress } from '../../solUtils'

export const botActions = {
  bookService: 'book_service',
  viewServices: 'view_services',
  rankingBoost: 'ranking_boost',
  volumeBoost: 'volume_boost',
  boostMedium: 'boost_medium',
  aiMarketMaking: 'ai_market_making',
}

export type TBotAction = keyof typeof botActions

export const aiMarketMakingGoals = {
  volumeCreation: 'volume_creation',
  optimizeProfits: 'optimize_profits',
  healthyMarket: 'healthy_market',
}

export const tradingStyles = {
  steady: 'steady',
  conservative: 'conservative',
  aggressive: 'aggressive',
}

export const userConfigurationInputs = {
  tokenCA: 'Token CA',
  solSpent: 'SOL Spent',
  tokenSpent: 'Token Spent',
  aiMarketMakingGoal: 'AI Market Making Goal',
  aiMarketMakingTradingStyle: 'AI Market Making Trading Style',
}

export type TBotAIMarketMakingGoal = keyof typeof aiMarketMakingGoals
export type TBotAIMarketMakingTradingStyle = keyof typeof tradingStyles

interface MomenetumBotContext <U extends Update = Update> extends Context<U> {
  botCustomer: BotCustomer
  bookedServices: TBookedServiceDefault[]
  session: {
    currentFieldToFill?: string
    botAction?: TBotAction
    tokenCA?: string
    solSpent?: number
    tokenSpent?: number
    aiMarketMakingGoal?: TBotAIMarketMakingGoal
    aiMarketMakingTradingStyle?: TBotAIMarketMakingTradingStyle
  }
}



export async function startMomentumAIBot() {
  const bot = new Telegraf<MomenetumBotContext>(process.env.MOMENTUM_AI_TELEGRAM_BOT_TOKEN!)

  bot.use(session())

  bot.use((ctx, next) => {
    console.log('session', ctx.session)
    if (!ctx.session) {
      ctx.session = {
      };
    }
    return next();
  });

  bot.use(async (ctx, next) => {
    const user = ctx.from
    console.log(`Action -> ${ctx.updateType}: ${ctx.text}`)
    console.log(`Middleware -> User Info: ${user?.username} (${user?.id})`)

    if (!user?.id) {
      return ctx.reply('Please use the bot from your telegram account')
    }

    ctx.botCustomer = await getBotCustomerByNameOrCreate({ telegramId: user.id.toString(), telegramUsername: user?.username })
    ctx.bookedServices = await getBookedServicesByBotCustomerId({ botCustomerId: ctx.botCustomer.id })

    await next()
  })

  bot.start((ctx) => {
    console.log('found bot customer', ctx.botCustomer)

    if (ctx.bookedServices.length > 0) {
      return ctx.sendPhoto(`https://s3.us-west-1.amazonaws.com/storage.monet.community/5z7kgy95vb.png`, {
        caption: fmt`
${welcomeMessage}

          You have ${ctx.bookedServices.length} active services running.

          ${ctx.bookedServices.map((service) => fmt`${service.type} for ${service.usedSplTokenMint}`).join('\n')}
        `,
        reply_markup: {
          inline_keyboard: [
            [{ text: 'View your services', callback_data: botActions.viewServices }],
            [{ text: 'Book a new service', callback_data: botActions.bookService }],
          ],
        },
      })
    }

    ctx.sendPhoto(`https://s3.us-west-1.amazonaws.com/storage.monet.community/5z7kgy95vb.png`, {
      caption: fmt`
${welcomeMessage}

${bold('Select a service below to get started')}

🪄🪄🪄🪄🪄

`,
      reply_markup: {
        inline_keyboard: [
          [ 
            { text: 'Ranking Boost 🥇 (coming soon)', callback_data: botActions.rankingBoost },
            { text: 'Volume Boost ⬆️ (coming soon)', callback_data: botActions.volumeBoost },
          ],
          [{ text: 'Boost - Ranking, Volume and Holders 📈 (coming soon)', callback_data: botActions.boostMedium }],
          [{ text: 'MomentumAI - AI Market Making 🚀🧠', callback_data: botActions.aiMarketMaking }],
        ],
      },
    })
  })

  bot.action(botActions.rankingBoost, (ctx) => {
    ctx.reply('Ranking boost service selected')
  })

  bot.action(botActions.volumeBoost, (ctx) => {
    ctx.reply('Volume boost service selected')
  })

  bot.action(botActions.boostMedium, (ctx) => {
    ctx.reply('Boost medium service selected')
  })

  bot.action(botActions.aiMarketMaking, (ctx) => {
    ctx.session.botAction = botActions.aiMarketMaking as TBotAction
    ctx.replyWithPhoto('https://s3.us-west-1.amazonaws.com/storage.monet.community/5z7kgy95vb.png',
      {
        caption: fmt`
🪄🪄🪄🪄🪄

Market-making on auto-pilot. Replacing traditonal on-chain market makers, MomentumAI is your 24/7 AI-agent to help you unleash your full token potential.

The bot is designed to make your token more visible, increasing your visibility with more volume, transactions and intelligent market making to drive profit and price action.

Here's how it works:
1. Set your token CA.
2. Deposit market-making funds (we recommend 50% SOL, 50% token). 
3. Define your market-making goals.

You can test it with a minimum of 1 SOL to start. For effective market-making, we recommend a minimum of 30 SOL, preferably 100 SOL. 

${bold('To get started, please send your token CA.')}

🪄🪄🪄🪄🪄

`,
      reply_markup: {
        input_field_placeholder: userConfigurationInputs.tokenCA,
        force_reply: true,
      },
    })

    ctx.session.currentFieldToFill = userConfigurationInputs.tokenCA


  })


  bot.action(userConfigurationInputs.tokenCA, (ctx) => {
    console.log('tokenCA in action', ctx.text)
    ctx.session.tokenCA = ctx.text ?? ''
  })

  bot.on('text', async (ctx) => {
    
    if (ctx.session.currentFieldToFill === userConfigurationInputs.tokenCA) {
      if (isValidSolanaAddress(ctx.text)) {
        console.log('Valid solana address, setting tokenCA', ctx.text)
        
        ctx.session.tokenCA = ctx.text ?? ''

        if (ctx.session.botAction === botActions.aiMarketMaking) {
         const bookedService = await createBookedServiceAndWallet({
            botCustomerId: ctx.botCustomer.id,
            awaitingFunding: true,
            isActive: false,
            serviceType: EServiceType.MARKET_MAKING,
            usedSplTokenMint: ctx.session.tokenCA,
          })

          const pubkey = bookedService.mainWallet.pubkey

          ctx.replyWithPhoto('https://s3.us-west-1.amazonaws.com/storage.monet.community/5z7kgy95vb.png', {
            caption: fmt`
🪄🪄🪄🪄🪄

Market making service for ${ctx.session.tokenCA} has been setup.

Please deposit SOL and tokens to the following address to continue:
${bold(pubkey)}

1. Deposit a minimum of 1 SOL to the address to start the service.
2. Usually, we recommend 50% SOL and 50% tokens.

Current balance: 0 SOL / 0 ${ctx.session.tokenCA}

🪄🪄🪄🪄🪄

`,
          })
        }

        ctx.session.currentFieldToFill = userConfigurationInputs.solSpent
      } else {
        ctx.reply('Please send a valid Solana address')
      }
    }

    if (ctx.session.currentFieldToFill === userConfigurationInputs.solSpent) {
      
    }
  })



  bot.launch()
  console.log('MomentumAI telegram bot started')

  return bot
}

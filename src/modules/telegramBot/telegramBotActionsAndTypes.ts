import { Context } from 'telegraf'
import { bold, fmt } from 'telegraf/format'
import { welcomeMessage } from './textTemplates'
import { BotCustomer } from '@prisma/client'
import { TBookedServiceDefault } from '../customer/bookedService'
import { InlineKeyboardButton, InlineKeyboardMarkup, Update } from 'telegraf/typings/core/types/typegram'

export const telegramBotActions = {
  bookService: 'book_service',
  viewServices: 'view_services',
  rankingBoost: 'ranking_boost',
  volumeBoost: 'volume_boost',
  boostMedium: 'boost_medium',
  aiMarketMaking: 'ai_market_making',
}

export type TBotAction = keyof typeof telegramBotActions

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

export interface MomentumBotContext<U extends Update = Update> extends Context<U> {
  botCustomer: BotCustomer
  activeBookedServices: TBookedServiceDefault[]
  session: {
    currentFieldToFill?: string
    botAction?: TBotAction
    serviceAwaitingFunds?: TBookedServiceDefault
    tokenCA?: string
    solSpent?: number
    tokenSpent?: number
    aiMarketMakingGoal?: TBotAIMarketMakingGoal
    aiMarketMakingTradingStyle?: TBotAIMarketMakingTradingStyle
  }
}

export const defaultReplyMarkup = {
  inline_keyboard: [
    [{ text: 'Clear & Start Fresh 🔁', callback_data: telegramBotActions.bookService }]
  ],
}

export const defaultMarkupWithAdditionalOptions = (inlineKeyboardOptions: InlineKeyboardButton[][]) => {
  return {
    inline_keyboard: [...defaultReplyMarkup.inline_keyboard, ...inlineKeyboardOptions],
  }
}

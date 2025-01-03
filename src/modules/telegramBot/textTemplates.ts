import { BotCustomer } from '@prisma/client';
import { TBookedServiceDefault } from '../customer/bookedService';
import { fmt } from 'telegraf/format';

export const welcomeMessage = fmt`
Welcome to MomentumAI - your AI-powered market making bot for Solana tokens 🚀
      
Boost your token performance with an AI-driven liquidity strategy, increasing your visibility with more volume, transactions and intelligent market making to drive profit and price action.

With our latest AI technology, you'll have an AI-agent trader that's there for you 24/7, making sure your token is always in the best liquidity position.

👉 ${'https://momentumai.com'}`
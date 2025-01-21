import { EServiceType } from "@prisma/client";
import { NarrowedContext, session, Telegraf } from "telegraf";
import { bold, fmt } from "telegraf/format";
import { getBotCustomerByNameOrCreate } from "../customer/botCustomer";
import { createBookedServiceAndWallet, getBookedServicesByBotCustomerId } from "../customer/bookedService";
import { sendNewServiceBookingMessage, welcomeMessage } from "./textTemplates";
import { InlineKeyboardButton, Message, Update } from "telegraf/typings/core/types/typegram";
import { isValidSolanaAddress } from "../../solUtils";
import {
  defaultMarkupWithAdditionalOptions,
  MomentumBotContext,
  TBotAction,
  telegramBotActions,
  userConfigurationInputs,
} from "./telegramBotActionsAndTypes";
import { solAmount } from '../../config'
import { MINIMUM_SOL_BALANCE_FOR_SERVICE } from './botServiceCheck'
import { volumneBotTask } from "../../trigger/volumeBotTasks";
import { getBirdEyeSolPrice } from "../splToken/birdEye";

export const telegrafBot = new Telegraf<MomentumBotContext>(process.env.MOMENTUM_AI_TELEGRAM_BOT_TOKEN!);

export async function startMomentumAIBot() {
  telegrafBot.use(session());

  telegrafBot.use((ctx, next) => {
    console.log("session", ctx.session);
    if (!ctx.session) {
      ctx.session = {};
    }
    return next();
  });

  telegrafBot.use(async (ctx, next) => {
    const user = ctx.from;
    console.log(`Action -> ${ctx.updateType}: ${ctx.text}`);
    console.log(`Middleware -> User Info: ${user?.username} (${user?.id})`);

    if (!user?.id) {
      return ctx.reply("Please use the bot from your telegram account");
    }

    ctx.botCustomer = await getBotCustomerByNameOrCreate({ telegramId: user.id.toString(), telegramUsername: user?.username });
    const bookedServices = await getBookedServicesByBotCustomerId({ botCustomerId: ctx.botCustomer.id });
    ctx.activeBookedServices = bookedServices.filter((service) => service.isActive);

    const bookedServiceAwaitingFunds = bookedServices.find((service) => service.awaitingFunding);

    if (bookedServiceAwaitingFunds) {
      ctx.session.serviceAwaitingFunds = bookedServiceAwaitingFunds;
    }

    await next();
  });

  telegrafBot.start((ctx) => {
    console.log("found bot customer", ctx.botCustomer);

    if (ctx.activeBookedServices.length > 0) {
      const bookedServicesString = ctx.activeBookedServices.map((service) => `${service.type} for ${service.usedSplToken.symbol}`).join("\n");
      return ctx.sendPhoto(`https://s3.us-west-1.amazonaws.com/storage.monet.community/5z7kgy95vb.png`, {
        caption: fmt`
${welcomeMessage}

          You have ${ctx.activeBookedServices.length} active services running.

          ${bookedServicesString}
        `,
        reply_markup: {
          inline_keyboard: [
            [{ text: "View your services", callback_data: telegramBotActions.viewServices }],
            [{ text: "Book a new service", callback_data: telegramBotActions.bookService }],
          ],
        },
      });
    } else {
      sendNewServiceBookingMessage(ctx);
    }
  });

  telegrafBot.action(telegramBotActions.bookService, (ctx) => {
    sendNewServiceBookingMessage(ctx);
  });

  telegrafBot.action(telegramBotActions.rankingBoost, (ctx) => {
    ctx.reply('Ranking boost service selected. Paste token contract address')
    ctx.session.botAction = 'rankingBoost'
  });

  telegrafBot.action(telegramBotActions.boostMedium, (ctx) => {
    ctx.reply("Boost medium service selected");
  });

  telegrafBot.action(telegramBotActions.aiMarketMaking, (ctx) => {
    ctx.session.botAction = telegramBotActions.aiMarketMaking as TBotAction;
    ctx.replyWithPhoto("https://s3.us-west-1.amazonaws.com/storage.monet.community/5z7kgy95vb.png", {
      caption: fmt`
🪄🪄🪄🪄🪄

Market-making on auto-pilot. Replacing traditonal on-chain market makers, MomentumAI is your 24/7 AI-agent to help you unleash your full token potential.

The bot is designed to make your token more visible, increasing your visibility with more volume, transactions and intelligent market making to drive profit and price action.

Here's how it works:
1. Set your token CA.
2. Deposit market-making funds (we recommend 50% SOL, 50% token). 
3. Define your market-making goals.

You can test it with a minimum of 1 SOL to start. For effective market-making, we recommend a minimum of 30 SOL, preferably 100 SOL. 

${bold("To get started, please send your token CA.")}

🪄🪄🪄🪄🪄

`,
      reply_markup: {
        input_field_placeholder: userConfigurationInputs.tokenCA,
        force_reply: true,
        // inline_keyboard: defaultReplyMarkup.inline_keyboard,
      },
    });

    ctx.session.currentFieldToFill = userConfigurationInputs.tokenCA;
  });

  telegrafBot.action(userConfigurationInputs.tokenCA, (ctx) => {
    console.log("tokenCA in action", ctx.text);
    ctx.session.tokenCA = ctx.text ?? "";
  });

  telegrafBot.action(telegramBotActions.viewServices, (ctx) => {
    const activeBookedServices = ctx.activeBookedServices
    const activeBookedServicesList: InlineKeyboardButton[][] = []
    activeBookedServices.map(bookedServices => activeBookedServicesList.push([{ text: bookedServices.usedSplToken.symbol, callback_data: `viewServices_${bookedServices.id}` }]))
    ctx.replyWithPhoto(`https://s3.us-west-1.amazonaws.com/storage.monet.community/5z7kgy95vb.png`, {
      caption: fmt`
${welcomeMessage}

        You have ${ctx.activeBookedServices.length} active services running.
`,
      reply_markup: {
        inline_keyboard: activeBookedServicesList,
      },
    })
  })

  telegrafBot.action(telegramBotActions.volumeBoost, (ctx) => {
    ctx.session.botAction = telegramBotActions.volumeBoost as TBotAction;
    ctx.replyWithPhoto("https://s3.us-west-1.amazonaws.com/storage.monet.community/5z7kgy95vb.png", {
      caption: fmt`
🪄🪄🪄🪄🪄

Volumne Bot, MomentumAI is your 24/7 AI-agent to help you unleash your full token potential.

The bot is designed to make your token more visible, increasing your visibility with more volume, transactions and intelligent market making to drive profit and price action.

Here's how it works:
1. Set your token CA.
2. Deposit volumne-making funds (we recommend 50% SOL, 50% token). 
3. Define your market-making goals.

You can test it with a minimum of 1 SOL to start. For effective market-making, we recommend a minimum of 30 SOL, preferably 100 SOL. 

${bold("To get started, please send your token CA.")}

🪄🪄🪄🪄🪄

`,
      reply_markup: {
        input_field_placeholder: userConfigurationInputs.tokenCA,
        force_reply: true,
        // inline_keyboard: defaultReplyMarkup.inline_keyboard,
      },
    });

    ctx.session.currentFieldToFill = userConfigurationInputs.tokenCA;
  });

  telegrafBot.on('text', async (ctx) => {
    if (ctx.session.currentFieldToFill === userConfigurationInputs.tokenCA) {
      if (isValidSolanaAddress(ctx.text)) {
        console.log('Valid solana address, setting tokenCA', ctx.text)

        ctx.session.tokenCA = ctx.text ?? ''

        if (ctx.session.botAction === telegramBotActions.aiMarketMaking) {
          try {
            const bookedService = await createBookedServiceAndWallet({
              botCustomerId: ctx.botCustomer.id,
              awaitingFunding: true,
              isActive: false,
              serviceType: EServiceType.MARKET_MAKING,
              usedSplTokenMint: ctx.session.tokenCA,
            })
            if (!bookedService) {
              ctx.reply(`Not found on Raydium Amm Pools`)
              return
            }
            const pubkey = bookedService.mainWallet.pubkey

            ctx.replyWithPhoto('https://s3.us-west-1.amazonaws.com/storage.monet.community/5z7kgy95vb.png', {
              caption: fmt`
  🪄🪄🪄🪄🪄
  
  Market making service for ${bookedService.usedSplToken.symbol} has been setup.
  
  Please deposit SOL and tokens to the following address to continue:
  ${bold(pubkey)}
  
  1. Deposit a minimum of 1 SOL to the address to start the service.
  2. Usually, we recommend 50% SOL and 50% tokens.
  
  Current balance: 0 SOL / 0 ${bookedService.usedSplToken.symbol}
  
  🪄🪄🪄🪄🪄
`,
              reply_markup: defaultMarkupWithAdditionalOptions([

              ]),
            })

            ctx.session.serviceAwaitingFunds = bookedService
            ctx.session.currentFieldToFill = userConfigurationInputs.solSpent
          } catch (error) {
            console.error('Error creating booked service', error)

            ctx.reply(`Something went wrong, an error occurred: ${error}`)
          }
        }
      } else {
        ctx.reply('Please send a valid token CA')
      }
    }

    if (ctx.session.botAction == 'rankingBoost') {
      if (!ctx.session.currentFieldToFill) {
        if (ctx.text) {
          ctx.session.tokenCA = ctx.text
          const bookedService = await createBookedServiceAndWallet({
            botCustomerId: ctx.botCustomer.id,
            solAmount: solAmount,
            awaitingFunding: true,
            isActive: false,
            serviceType: EServiceType.RANKING,
            usedSplTokenMint: ctx.text,
          })
          if (!bookedService) ctx.reply(fmt`Not found Raydium AMM Pools`)
          else ctx.reply(fmt`
🪄🪄🪄🪄🪄

Ranking Boost service for ${bookedService.usedSplToken.symbol} has been setup.

Please deposit SOL and tokens to the following address to continue:
${bold(bookedService.mainWallet.pubkey)}

1. Deposit a minimum of ${MINIMUM_SOL_BALANCE_FOR_SERVICE[EServiceType.MARKET_MAKING]} SOL to the address to start the service.

Current balance: 0 SOL / 0 ${bookedService.usedSplToken.symbol}

🪄🪄🪄🪄🪄`)
        }
      }
    }

    if (ctx.session.currentFieldToFill === userConfigurationInputs.solSpent) {
    }
  })

  const transactionPerMinuteOptions = [
    { label: "2 tx/min", value: 2 },
    { label: "4 tx/min", value: 4 },
    { label: "6 tx/min", value: 6 },
    { label: "10 tx/min", value: 10 },
    { label: "20 tx/min", value: 20 },
  ];

  const momentumActions = {
    actions: [] as Function[],
    handleInput: function (
      action: keyof typeof telegramBotActions,
      input: keyof typeof userConfigurationInputs,
      handler: (
        ctx: NarrowedContext<
          MomentumBotContext<Update>,
          {
            message: Update.New & Update.NonChannel & Message.TextMessage;
            update_id: number;
          }
        >
      ) => any
    ) {
      this.actions.push(
        async (
          ctx: NarrowedContext<
            MomentumBotContext<Update>,
            {
              message: Update.New & Update.NonChannel & Message.TextMessage;
              update_id: number;
            }
          >
        ) => {
          if (ctx.session.botAction === telegramBotActions[action] && ctx.session.currentFieldToFill === userConfigurationInputs[input]) {
            const res = await handler(ctx);
            return "handled";
          }
        }
      );
    },
  };

  momentumActions.handleInput("aiMarketMaking", "tokenCA", async (ctx) => {
    if (isValidSolanaAddress(ctx.text)) {
      console.log("Valid solana address, setting tokenCA", ctx.text);

      ctx.session.tokenCA = ctx.text ?? "";

      try {
        const bookedService = await createBookedServiceAndWallet({
          botCustomerId: ctx.botCustomer.id,
          awaitingFunding: true,
          isActive: false,
          serviceType: EServiceType.MARKET_MAKING,
          usedSplTokenMint: ctx.session.tokenCA,
        });

        const pubkey = bookedService.mainWallet.pubkey;

        ctx.replyWithPhoto("https://s3.us-west-1.amazonaws.com/storage.monet.community/5z7kgy95vb.png", {
          caption: fmt`
🪄🪄🪄🪄🪄

Market making service for ${bookedService.usedSplToken.symbol} has been setup.

Please deposit SOL and tokens to the following address to continue:
${bold(pubkey)}

1. Deposit a minimum of 1 SOL to the address to start the service.
2. Usually, we recommend 50% SOL and 50% tokens.

Current balance: 0 SOL / 0 ${bookedService.usedSplToken.symbol}

🪄🪄🪄🪄🪄

`,
          reply_markup: defaultMarkupWithAdditionalOptions([]),
        });

        ctx.session.serviceAwaitingFunds = bookedService;
        ctx.session.currentFieldToFill = userConfigurationInputs.solSpent;
      } catch (error) {
        console.error("Error creating booked service", error);

        ctx.reply(`Something went wrong, an error occurred: ${error}`);
      }
    } else {
      ctx.reply("Please send a valid token CA");
    }
  });

  momentumActions.handleInput("aiMarketMaking", "solSpent", (ctx) => { });

  momentumActions.handleInput("volumeBoost", "tokenCA", async (ctx) => {
    if (!isValidSolanaAddress(ctx.text)) return ctx.reply("Please send a valid token CA");

    console.log("Valid solana address, setting tokenCA", ctx.text);

    ctx.session.tokenCA = ctx.text ?? "";

    ctx.session.currentFieldToFill = userConfigurationInputs.transactionsPerMinute;

    ctx.reply("Please select the number of transactions per minute", {
      reply_markup: {
        inline_keyboard: transactionPerMinuteOptions.map((option) => [
          {
            text: option.label,
            callback_data: option.value.toString(),
          },
        ]),
      },
    });
  });

  transactionPerMinuteOptions.forEach((option) => {
    telegrafBot.action(option.value.toString(), async (ctx) => {
      const transactionsPerMinute = option.value;

      // if (isNaN(transactionsPerMinute)) return ctx.reply("Please send a valid number for transactions per minute");

      try {
        const bookedService = await createBookedServiceAndWallet({
          botCustomerId: ctx.botCustomer.id,
          awaitingFunding: true,
          isActive: false,
          serviceType: EServiceType.VOLUME,
          usedSplTokenMint: ctx.session.tokenCA ?? "",
          transactionsPerMinute,
        });

        const pubkey = bookedService.mainWallet.pubkey;

        const res = await volumneBotTask.trigger({
          customerId: ctx.botCustomer.id,
          serviceId: bookedService.id,
        });

        const solUsdcPrice = await getBirdEyeSolPrice();

        function calculateVolume(solAmount: number) {
          return (solAmount * 0.8 * solUsdcPrice.data.value) / 0.00275;
        }

        const volumeExamples = [3, 5, 10, 20, 42]
          .map((solAmount, i) => {
            return `\t ${Array.from({ length: i + 1 })
              .map((i) => "🚀")
              .join("")} ${solAmount} SOL => ${Math.round(calculateVolume(solAmount)).toLocaleString()} $`;
          })
          .join("\n");

        ctx.replyWithPhoto("https://s3.us-west-1.amazonaws.com/storage.monet.community/5z7kgy95vb.png", {
          caption: fmt`
  🪄🪄🪄🪄🪄
  
  Volume Boost service for ${bookedService.usedSplToken.symbol} has been setup.

  Here are some examples of volume you can expect:

${volumeExamples}
  
  Please deposit SOL to the following address to continue:
  ${bold(pubkey)}
  
  Deposit a minimum of 1 SOL to the address to start the service.
  
  Current balance: 0 SOL / 0 ${bookedService.usedSplToken.symbol}
  
  🪄🪄🪄🪄🪄
  
  `,
          reply_markup: defaultMarkupWithAdditionalOptions([]),
        });

        ctx.session.serviceAwaitingFunds = bookedService;
      } catch (error) {
        console.error("Error creating booked service", error);

        ctx.reply(`Something went wrong, an error occurred: ${error}`);
      }
    });
  });

  telegrafBot.on("text", async (ctx) => {
    for (const action of momentumActions.actions) {
      const res = await action(ctx);
      if (res === "handled") break;
    }
  });

  telegrafBot.launch();
  console.log("MomentumAI telegram bot started");

  return telegrafBot;
}

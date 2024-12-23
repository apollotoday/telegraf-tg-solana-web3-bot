import prisma from '../../lib/prisma';


export async function createBotCustomer(args: { name?: string; email?: string; telegramUsername?: string }) {
  return await prisma.botCustomer.create({
    data: {
      name: args.name,
      telegramUsername: args.telegramUsername,
      email: args.email,
    },
  });
}

export async function getBotCustomerByName(name: string) {
  const botCustomer = await prisma.botCustomer.findFirst({
    where: {
      name,
    },
  })

  if (!botCustomer) {
    throw new Error(`Bot customer with name ${name} not found`)
  }

  return botCustomer
}

export async function getBotCustomerByNameOrCreate(args: { telegramId: string; telegramUsername?: string }) {
  let botCustomer = await prisma.botCustomer.findFirst({
    where: {
      id: args.telegramId,
    },
  });

  if (!botCustomer) {
    botCustomer = await prisma.botCustomer.create({
      data: {
        id: args.telegramId,
        name: args.telegramUsername,
        telegramUsername: args.telegramUsername,
      },
    });
  }

  return botCustomer;
}



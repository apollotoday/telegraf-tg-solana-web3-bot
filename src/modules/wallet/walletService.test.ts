import { EServiceType, EWalletType } from "@prisma/client";
import { createAndStoreBotCustomerWallets, createVolumeBot } from "./walletService";
import { createBotCustomer } from '../customer/botCustomer';
import { createBookedServiceAndWallet } from '../customer/bookedService';

test("createVolumneBot", async () => {
  const customer = await createBotCustomer({
    telegramUsername: "telegramUsername",
    email: "testUserEmail",
  });

  await createVolumeBot({ customerId: customer.id, usedSplTokenMint: 'G9tt98aYSznRk7jWsfuz9FnTdokxS6Brohdo9hSmjTRB' });
});

test("createBotCustomer", async () => {
  const res = await createBotCustomer({
    email: "test@test.com",
    telegramUsername: "telegramUsername",
  });
});

test("createAndStoreBotCustomerWallets", async () => {
  const res = await createBotCustomer({
    email: "test@test.com",
    telegramUsername: "telegramUsername",
  });

  const bookedServiceRes = await createBookedServiceAndWallet({
    botCustomerId: res.id,
    serviceType: EServiceType.RANKING,
    solAmount: 1,
    usedSplTokenMint: 'G9tt98aYSznRk7jWsfuz9FnTdokxS6Brohdo9hSmjTRB'
  });

  await createAndStoreBotCustomerWallets({
    customerId: res.id,
    subWalletCount: 5,
    walletType: EWalletType.SERVICE_FUNDING,
  });
});

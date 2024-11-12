import { EServiceType, EWalletType } from "@prisma/client";
import { createAndStoreBotCustomerWallets, createBookedServiceAndWallet, createBotCustomer, createVolumneBot } from "./walletService";

test("createVolumneBot", async () => {
  const customer = await createBotCustomer({
    telegramUsername: "telegramUsername",
    email: "testUserEmail",
  });

  await createVolumneBot({ customerId: customer.id });
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
  });

  await createAndStoreBotCustomerWallets({
    customerId: res.id,
    subWalletCount: 5,
    walletType: EWalletType.RUN_FUNDING,
  });
});

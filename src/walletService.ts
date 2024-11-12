import { EServiceType, EWalletType } from "@prisma/client";
import { connection, fundsToSendForRanking } from "./config";
import { solTransfer } from "./solUtils";
import { encryptPrivateKey, generateAndEncryptWallet } from "./walletUtils";
import prisma from "./lib/prisma";
import { ComputeBudgetProgram, PublicKey, Transaction } from "@solana/web3.js";
import { sleep } from "./utils";

export async function createVolumneBot(args: { customerId: string }) {
  const newWallet = generateAndEncryptWallet();

  const res = await prisma.bookedService.create({
    data: {
      type: EServiceType.RANKING,
      botCustomer: {
        connect: {
          id: args.customerId,
        },
      },
      mainWallet: {
        create: {
          encryptedPrivKey: newWallet.encryptedPrivKey,
          pubkey: newWallet.pubkey,
          type: EWalletType.RUN_FUNDING,
          botCustomerId: args.customerId,
        },
      },
    },
    include: {
      mainWallet: true,
    },
  });

  console.log("res", res.mainWallet.pubkey);

  while (true) {
    const balance = await connection.getBalance(new PublicKey(res.mainWallet.pubkey));

    if (balance > 1000) {
      console.log("balance received", balance);
      break;
    }

    await sleep(1000);
  }

  
}

export async function createBotCustomer(args: { email: string; telegramUsername: string }) {
  return await prisma.botCustomer.create({
    data: {
      telegramUsername: args.telegramUsername,
      email: args.email,
    },
  });
}

export async function createBookedServiceAndWallet({
  botCustomerId,
  solAmount,
  serviceType,
}: {
  serviceType: EServiceType;
  solAmount: number;
  botCustomerId: string;
}) {
  const newWallet = generateAndEncryptWallet();

  return await prisma.bookedService.create({
    data: {
      type: serviceType,
      solAmountForService: solAmount,
      botCustomer: {
        connect: {
          id: botCustomerId,
        },
      },
      mainWallet: {
        create: {
          encryptedPrivKey: newWallet.encryptedPrivKey,
          pubkey: newWallet.pubkey,
          type: EWalletType.RUN_FUNDING,
          botCustomerId,
        },
      },
    },
    include: {
      mainWallet: true,
    },
  });
}

export function createBotCustomerWallets({ subWalletCount }: { subWalletCount: number }) {
  const wallets = Array.from({ length: subWalletCount }).map((i) => {
    const subWallet = generateAndEncryptWallet();
    return subWallet;
  });

  return wallets;
}

export async function createAndStoreBotCustomerWallets({
  customerId,
  subWalletCount,
  walletType,
}: {
  customerId: string;
  subWalletCount: number;
  walletType: EWalletType;
}) {
  const wallets = createBotCustomerWallets({
    subWalletCount,
  });

  return await prisma.botCustomerWallet.createMany({
    data: wallets.map((wallet) => ({
      pubkey: wallet.pubkey,
      encryptedPrivKey: wallet.encryptedPrivKey,
      botCustomerId: customerId,
      type: walletType,
    })),
  });
}

export async function getDepositWalletFromCustomer({ botCustomerId }: { botCustomerId: string }) {
  const depositWallets = await prisma.botCustomerWallet.findMany({
    where: {
      botCustomerId,
      type: EWalletType.DEPOSIT,
    },
  });

  if (depositWallets.length === 0) {
    console.log(`ERR: No deposit wallet found for botCustomerId=${botCustomerId}`);
    throw new Error("No deposit wallet found");
  }

  if (depositWallets.length > 1) {
    console.log(`WARN: There is more than one deposit wallet for botCustomerId=${botCustomerId} `);
  }

  return depositWallets[0];
}

export function setupRankingWallets({ fundingWallet, totalSol }: { fundingWallet: string; totalSol: number }) {
  const walletCountToCreate = Math.floor(totalSol / fundsToSendForRanking);

  const wallets = createBotCustomerWallets({ subWalletCount: walletCountToCreate });

  const instructions = [];

  for (const wallet of wallets) {
    instructions.push(
      solTransfer({
        from: fundingWallet,
        to: wallet.pubkey,
        solAmount: fundsToSendForRanking,
      })
    );
  }

  return {
    wallets,
    instructions,
  };
}

export async function setupRankingService({ botCustomerId, totalSol }: { botCustomerId: string; totalSol: number }) {
  const [depositWallet, bookedService] = await Promise.all([
    getDepositWalletFromCustomer({ botCustomerId }),
    createBookedServiceAndWallet({
      botCustomerId,
      solAmount: totalSol,
      serviceType: EServiceType.RANKING,
    }),
  ]);

  const initDepositIx = solTransfer({
    solAmount: totalSol,
    from: depositWallet.pubkey,
    to: bookedService.mainWallet.pubkey,
  });

  const solToDistributeToSubWallets = totalSol - 0.2;

  const { wallets, instructions } = setupRankingWallets({
    fundingWallet: bookedService.mainWallet.pubkey,
    totalSol,
  });

  const tx = new Transaction();
  const updateCPInx = ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 101_000 });
  const updateCLInx = ComputeBudgetProgram.setComputeUnitLimit({ units: 1_399_000 });

  tx.add(updateCLInx);
  tx.add(updateCLInx);
  tx.add(initDepositIx);
  tx.add(...instructions);
}

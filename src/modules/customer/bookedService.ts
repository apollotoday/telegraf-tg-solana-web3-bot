import { EServiceType, EWalletType } from '@prisma/client';
import { generateAndEncryptWallet } from '../wallet/walletUtils';
import prisma from '../../lib/prisma';

export async function createBookedServiceAndWallet({
  botCustomerId,
  solAmount,
  serviceType,
  usedSplTokenMint,
  isActive = true,
  awaitingFunding = true,
}: {
  serviceType: EServiceType;
  solAmount?: number;
  botCustomerId: string;
  usedSplTokenMint: string;
  isActive?: boolean;
  awaitingFunding?: boolean;
}) {
  const newWallet = generateAndEncryptWallet();

  return await prisma.bookedService.create({
    data: {
      type: serviceType,
      solAmountForService: solAmount,
      isActive,
      awaitingFunding,
      botCustomer: {
        connect: {
          id: botCustomerId,
        },
      },
      usedSplToken: {
        connect: {
          tokenMint: usedSplTokenMint,
        },
      },
      mainWallet: {
        create: {
          encryptedPrivKey: newWallet.encryptedPrivKey,
          pubkey: newWallet.pubkey,
          type: EWalletType.SERVICE_FUNDING,
          botCustomerId,
        },
      },
    },
    include: {
      mainWallet: true,
      usedSplToken: true,
    },
  });
}

export async function getActiveBookedServiceByBotCustomerId({ botCustomerId, serviceType }: { botCustomerId: string, serviceType: EServiceType }) {
  const bookedService = await prisma.bookedService.findFirst({
    where: {
      botCustomerId,
      type: serviceType,
      isActive: true,
    },
    include: {
      usedSplToken: true,
      mainWallet: true,
    }
  });

  if (!bookedService) {
    throw new Error(`No active booked service found for bot customer ${botCustomerId} and service type ${serviceType}`);
  }

  return bookedService;
}

export async function getBookedServicesByBotCustomerId({ botCustomerId }: { botCustomerId: string }) {
  return await prisma.bookedService.findMany({
    where: {
      botCustomerId,
    },
    include: {
      usedSplToken: true,
      mainWallet: {
        select: {
          pubkey: true
        }
      },
      cycles: {
        where: {
          isActive: true,
        }
      }
    }
  });
}

export type TBookedServiceDefault = Awaited<ReturnType<typeof getBookedServicesByBotCustomerId>>[number];

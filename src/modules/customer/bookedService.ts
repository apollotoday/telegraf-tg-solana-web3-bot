import { EServiceType, EWalletType } from '@prisma/client';
import { generateAndEncryptWallet } from '../wallet/walletUtils';
import prisma from '../../lib/prisma';

export async function createBookedServiceAndWallet({
  botCustomerId,
  solAmount,
  serviceType,
  usedSplTokenMint,
}: {
  serviceType: EServiceType;
  solAmount: number;
  botCustomerId: string;
  usedSplTokenMint: string;
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
    },
  });
}
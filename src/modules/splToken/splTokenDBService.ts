import { PublicKey } from '@solana/web3.js';
import prisma from '../../lib/prisma';

export async function getSplTokenByMint(mintPubKey: string) {
  const splToken = await prisma.splToken.findFirst({
    where: {
      tokenMint: mintPubKey,
    },
  })

  if (!splToken) {
    throw new Error(`Spl token not found for mint ${mintPubKey}`)
  }

  return splToken
}

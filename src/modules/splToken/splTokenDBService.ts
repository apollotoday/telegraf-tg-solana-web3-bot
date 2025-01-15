import { PublicKey } from '@solana/web3.js';
import prisma from '../../lib/prisma';
import { getTokenAndPoolInfo, getTokenAndPoolInfoForPrisma } from './tokenInfoService';
import { EServiceType } from '@prisma/client';

export async function getSplTokenByMint(mintPubKey: string) {
  return await prisma.splToken.findFirst({
    where: {
      tokenMint: mintPubKey,
    },
    include: {
      quoteTokenLiquidityPools: true,
    }
  })
}

export async function getTokenOrCreate(mintPubKey: string) {
  const splToken = await getSplTokenByMint(mintPubKey)

  console.log(`found existing splToken=${splToken?.symbol} for mint=${mintPubKey}`)

  if (!splToken || !splToken.quoteTokenLiquidityPools.length) {
    const tokenInfo = await getTokenAndPoolInfoForPrisma(mintPubKey, 'create')

    const newSplToken = await prisma.splToken.upsert({
      where: {
        tokenMint: mintPubKey,
      },
      update: {
        ...tokenInfo,
      },
      create: {
        ...tokenInfo,
      },
      include: {
        quoteTokenLiquidityPools: true,
      }
    })

    return newSplToken
  }

  // if the token was updated in the last 3 minutes, we don't need to update it
  if (splToken.updatedAt.getTime() > new Date().getTime() - 1000 * 60 * 2) {
    return splToken
  }

  console.log(`Token info for ${mintPubKey} is outdated, updating...`)
  return await updateSplToken(mintPubKey)
}


export async function updateSplToken(mintPubKey: string) {
  const tokenInfo = await getTokenAndPoolInfoForPrisma(mintPubKey, 'update')

  console.log(`Updating token ${tokenInfo.symbol} with pool info and price=${tokenInfo.lastUsdcPrice}`)

  console.log(`tokenInfo=${JSON.stringify(tokenInfo)}`)

  const updatedToken = await prisma.splToken.update({
    where: {
      tokenMint: mintPubKey,
    },
    data: {
      ...tokenInfo
    },
    include: {
      quoteTokenLiquidityPools: true,
    }
  })

  console.log(`Updated token ${updatedToken.symbol} with pool info and price=${updatedToken.lastUsdcPrice}`)

  return updatedToken
}

export async function updateTokenInfos() {
  const tokenInfos = await prisma.splToken.findMany({
    where: {
      usedInBookedServices: {
        some: {
          isActive: true,
          type: EServiceType.MARKET_MAKING,
        },
      },
      updatedAt: {
        lte: new Date(new Date().getTime() - 1000 * 60 * 2),
      }
    }
  })

  const updatedTokens = []
  console.log(`Found ${tokenInfos.length} tokens to update`)

  for (const tokenInfo of tokenInfos) {
    try {
      const updatedToken = await updateSplToken(tokenInfo.tokenMint)
      updatedTokens.push(updatedToken)
    } catch (error) {
      console.error(`Error updating token ${tokenInfo.symbol}`, error)
    }
  }

  return updatedTokens
}

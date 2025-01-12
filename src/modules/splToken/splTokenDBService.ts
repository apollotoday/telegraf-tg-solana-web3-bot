import { PublicKey } from '@solana/web3.js';
import prisma from '../../lib/prisma';
import { getTokenInfo } from './tokenInfoService';

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
    const tokenInfo = await getTokenInfo(mintPubKey)

    const newSplToken = await prisma.splToken.upsert({
      where: {
        tokenMint: mintPubKey,
      },
      update: {
        symbol: tokenInfo.symbol,
        name: tokenInfo.name,
        decimals: tokenInfo.decimals,
        isSPL: true,
        lastUsdcPrice: tokenInfo.price,
        priceChange30mPercent: tokenInfo.priceChange30mPercent,
        priceChange1hPercent: tokenInfo.priceChange1hPercent,
        priceChange2hPercent: tokenInfo.priceChange2hPercent,
        priceChange4hPercent: tokenInfo.priceChange4hPercent,
        priceChange6hPercent: tokenInfo.priceChange6hPercent,
        priceChange12hPercent: tokenInfo.priceChange12hPercent,
        priceChange24hPercent: tokenInfo.priceChange24hPercent,
        v1hUSD: tokenInfo.v1hUSD,
        vBuy1hUSD: tokenInfo.vBuy1hUSD,
        vSell1hUSD: tokenInfo.vSell1hUSD,
        v2hUSD: tokenInfo.v2hUSD,
        vBuy2hUSD: tokenInfo.vBuy2hUSD,
        vSell2hUSD: tokenInfo.vSell2hUSD,
        v4hUSD: tokenInfo.v4hUSD,
        vBuy4hUSD: tokenInfo.vBuy4hUSD,
        vSell4hUSD: tokenInfo.vSell4hUSD,
        v8hUSD: tokenInfo.v8hUSD,
        vBuy8hUSD: tokenInfo.vBuy8hUSD,
        vSell8hUSD: tokenInfo.vSell8hUSD,
        v24hUSD: tokenInfo.v24hUSD,
        vBuy24hUSD: tokenInfo.vBuy24hUSD,
        vSell24hUSD: tokenInfo.vSell24hUSD,

        quoteTokenLiquidityPools: {
          create: {
            poolId: tokenInfo.poolId,
            baseTokenMint: tokenInfo.raydiumPool.base.address,
            liquidityUsd: tokenInfo.raydiumPool.liquidity,
            volume24h: tokenInfo.raydiumPool.volume24h,
            poolSource: tokenInfo.raydiumPool.source,
          }
        }
      },
      create: {
        tokenMint: mintPubKey,
        symbol: tokenInfo.symbol,
        name: tokenInfo.name,
        decimals: tokenInfo.decimals,
        isSPL: true,
        lastUsdcPrice: tokenInfo.price,
        priceChange30mPercent: tokenInfo.priceChange30mPercent,
        priceChange1hPercent: tokenInfo.priceChange1hPercent,
        priceChange2hPercent: tokenInfo.priceChange2hPercent,
        priceChange4hPercent: tokenInfo.priceChange4hPercent,
        priceChange6hPercent: tokenInfo.priceChange6hPercent,
        priceChange12hPercent: tokenInfo.priceChange12hPercent,
        priceChange24hPercent: tokenInfo.priceChange24hPercent,
        v1hUSD: tokenInfo.v1hUSD,
        vBuy1hUSD: tokenInfo.vBuy1hUSD,
        vSell1hUSD: tokenInfo.vSell1hUSD,
        v2hUSD: tokenInfo.v2hUSD,
        vBuy2hUSD: tokenInfo.vBuy2hUSD,
        vSell2hUSD: tokenInfo.vSell2hUSD,
        v4hUSD: tokenInfo.v4hUSD,
        vBuy4hUSD: tokenInfo.vBuy4hUSD,
        vSell4hUSD: tokenInfo.vSell4hUSD,
        v8hUSD: tokenInfo.v8hUSD,
        vBuy8hUSD: tokenInfo.vBuy8hUSD,
        vSell8hUSD: tokenInfo.vSell8hUSD,
        v24hUSD: tokenInfo.v24hUSD,
        vBuy24hUSD: tokenInfo.vBuy24hUSD,
        vSell24hUSD: tokenInfo.vSell24hUSD,

        quoteTokenLiquidityPools: {
          create: {
            poolId: tokenInfo.poolId,
            baseTokenMint: tokenInfo.raydiumPool.base.address,
            liquidityUsd: tokenInfo.raydiumPool.liquidity,
            volume24h: tokenInfo.raydiumPool.volume24h,
            poolSource: tokenInfo.raydiumPool.source,
          }
        }
      },
      include: {
        quoteTokenLiquidityPools: true,
      }
    })

    return newSplToken
  }

  return splToken
}
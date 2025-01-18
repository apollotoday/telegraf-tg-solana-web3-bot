import { LiquidityPoolInfo, Prisma, SplToken } from '@prisma/client'
import { getBirdeyeOHLCV, getBirdeyeTokenInfo, getBirdeyeTokenMarkets } from './birdEye'
import { subDays } from 'date-fns'

export async function getStandardOHLCVForToken(tokenAddress: string) {
  // past 7 days in 24hr ohlcv
  const ohlcv24h = await getBirdeyeOHLCV({
    tokenAddress,
    timeFrame: "24h",
    timeFrameStart: subDays(new Date(), 7),
    timeFrameEnd: new Date(),
  });

  // past 24 hours in 1hr ohlcv

  // past 3 hours in 15m ohlcv

  // past 1 hour in 5m ohlcv
}

type PrismaSPLTokenCreate = Prisma.SplTokenCreateInput
type PrismaSPLTokenUpdate = Prisma.SplTokenUpdateInput

export async function getTokenAndPoolInfo(tokenAddress: string) {
  try {
    const tokenInfo = await getBirdeyeTokenInfo(tokenAddress)

    console.log(`found symbol=${tokenInfo.symbol} for address=${tokenAddress}`)

    const tokenMarkets = await getBirdeyeTokenMarkets(tokenAddress)

    const raydiumPool = tokenMarkets
      .filter((market: any) => market.base.symbol === 'SOL' || market.quote.symbol === 'SOL')
      .sort((a: any, b: any) => b.liquidity - a.liquidity)
      .find((market: any) => market.source.includes('Raydium')) || null

    console.log(`found raydium pool address=${raydiumPool?.address} for symbol=${tokenInfo.symbol}`)

    return {
      tokenInfo,
      tokenMarkets,
      raydiumPool,
    }
  } catch (error) {
    console.error(`Error getting token info for address=${tokenAddress}`, error);
    throw new Error(`Error getting token info for address=${tokenAddress}. Please send a valid token address.`);
  }
}

// Overload 1: infoType = 'create'
export async function getTokenAndPoolInfoForPrisma(tokenAddress: string, infoType: 'create'): Promise<PrismaSPLTokenCreate>

// Overload 2: infoType = 'update'
export async function getTokenAndPoolInfoForPrisma(tokenAddress: string, infoType: 'update'): Promise<PrismaSPLTokenUpdate>

export async function getTokenAndPoolInfoForPrisma(
  tokenAddress: string,
  infoType: 'create' | 'update',
): Promise<PrismaSPLTokenCreate | PrismaSPLTokenUpdate> {
  const { tokenInfo, raydiumPool } = await getTokenAndPoolInfo(tokenAddress)

  return {
    tokenMint: tokenAddress,
    symbol: tokenInfo.symbol,
    name: tokenInfo.name,
    decimals: tokenInfo.decimals,
    lastUsdcPrice: tokenInfo.price,
    priceChange30mPercent: tokenInfo.priceChange30mPercent,
    priceChange1hPercent: tokenInfo.priceChange1hPercent,
    priceChange2hPercent: tokenInfo.priceChange2hPercent,
    priceChange4hPercent: tokenInfo.priceChange4hPercent,
    priceChange6hPercent: tokenInfo.priceChange6hPercent,
    priceChange12hPercent: tokenInfo.priceChange12hPercent,
    priceChange24hPercent: tokenInfo.priceChange24hPercent,
    v30mUSD: tokenInfo.v30mUSD,
    vBuy30mUSD: tokenInfo.vBuy30mUSD,
    vSell30mUSD: tokenInfo.vSell30mUSD,
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

    ...(infoType === 'create' && raydiumPool
      ? {
          quoteTokenLiquidityPools: {
            create: {
              poolId: raydiumPool.address,
              baseTokenMint: raydiumPool.base.address,
              liquidityUsd: raydiumPool.liquidity,
              volume24h: raydiumPool.volume24h,
              poolSource: raydiumPool.source,
            },
          },
        }
      : {}),
  }
}

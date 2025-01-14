import { getBirdeyeOHLCV, getBirdeyeTokenInfo, getBirdeyeTokenMarkets } from './birdEye'
import { subDays } from 'date-fns'


export async function getStandardOHLCVForToken(tokenAddress: string) {
  // past 7 days in 24hr ohlcv
  const ohlcv24h = await getBirdeyeOHLCV({
    tokenAddress,
    timeFrame: '24h',
    timeFrameStart: subDays(new Date(), 7),
    timeFrameEnd: new Date(),
  })

  // past 24 hours in 1hr ohlcv

  // past 3 hours in 15m ohlcv

  // past 1 hour in 5m ohlcv
}

export async function getTokenInfo(tokenAddress: string) {
  try {
    const birdeyeInfo = await getBirdeyeTokenInfo(tokenAddress)

    console.log(`found symbol=${birdeyeInfo.symbol} for address=${tokenAddress}`)

    const birdeyeMarkets = await getBirdeyeTokenMarkets(tokenAddress)

    console.log('birdeyeMarkets', birdeyeMarkets)

    const raydiumPool = birdeyeMarkets
      .filter((market: any) => market.base.symbol === 'SOL' || market.quote.symbol === 'SOL')
      .sort((a: any, b: any) => b.liquidity - a.liquidity)
      .find((market: any) => market.source.includes('Raydium'))

    console.log(`found raydium pool address=${raydiumPool.address} for symbol=${birdeyeInfo.symbol}`)

    if (!raydiumPool) {
      throw new Error(`No Raydium pool found for token=${birdeyeInfo.symbol}`)
    }

    return {
      symbol: birdeyeInfo.symbol,
      name: birdeyeInfo.name,
      decimals: birdeyeInfo.decimals,
      price: birdeyeInfo.price,
      priceChange30mPercent: birdeyeInfo.priceChange30mPercent,
      priceChange1hPercent: birdeyeInfo.priceChange1hPercent,
      priceChange2hPercent: birdeyeInfo.priceChange2hPercent,
      priceChange4hPercent: birdeyeInfo.priceChange4hPercent,
      priceChange6hPercent: birdeyeInfo.priceChange6hPercent,
      priceChange12hPercent: birdeyeInfo.priceChange12hPercent,
      priceChange24hPercent: birdeyeInfo.priceChange24hPercent,
      v1hUSD: birdeyeInfo.v1hUSD,
      vBuy1hUSD: birdeyeInfo.vBuy1hUSD,
      vSell1hUSD: birdeyeInfo.vSell1hUSD,
      v2hUSD: birdeyeInfo.v2hUSD,
      vBuy2hUSD: birdeyeInfo.vBuy2hUSD,
      vSell2hUSD: birdeyeInfo.vSell2hUSD,
      v4hUSD: birdeyeInfo.v4hUSD,
      vBuy4hUSD: birdeyeInfo.vBuy4hUSD,
      vSell4hUSD: birdeyeInfo.vSell4hUSD,
      v8hUSD: birdeyeInfo.v8hUSD,
      vBuy8hUSD: birdeyeInfo.vBuy8hUSD,
      vSell8hUSD: birdeyeInfo.vSell8hUSD,
      v24hUSD: birdeyeInfo.v24hUSD,
      vBuy24hUSD: birdeyeInfo.vBuy24hUSD,
      vSell24hUSD: birdeyeInfo.vSell24hUSD,
      raydiumPool: raydiumPool,
      poolId: raydiumPool.address,
    }
  } catch (error) {
    console.error(`Error getting token info for address=${tokenAddress}`, error)
    throw new Error(`Error getting token info for address=${tokenAddress}. Please send a valid token address.`)
  }
}

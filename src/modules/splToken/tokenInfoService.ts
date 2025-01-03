import { getBirdeyeTokenInfo, getBirdeyeTokenMarkets } from './birdEye';

export async function getTokenInfo(tokenAddress: string) {
  const birdeyeInfo = await getBirdeyeTokenInfo(tokenAddress)
  const birdeyeMarkets = await getBirdeyeTokenMarkets(tokenAddress)

  console.log(birdeyeMarkets)

  const raydiumPool = birdeyeMarkets.find((market: any) => market.source === 'Raydium')

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
    raydiumPool: raydiumPool,
    poolId: raydiumPool.address,
  }
}

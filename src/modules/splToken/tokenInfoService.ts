import { getBirdeyeTokenInfo } from './birdEye';

export async function getTokenInfo(tokenAddress: string) {
  const birdeyeInfo = await getBirdeyeTokenInfo(tokenAddress)

  return {
    symbol: birdeyeInfo.symbol,
    
  }
}
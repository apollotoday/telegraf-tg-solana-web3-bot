import axios from 'axios';

const BIRDEYE_API_KEY = process.env.BIRDEYE_API_KEY!


export async function getBirdeyeTokenInfo(tokenAddress: string) {
  const birdEyeRes = await axios.get(
    `https://public-api.birdeye.so/defi/token_overview?address=${tokenAddress}`,
    {
      headers: {
        'x-api-key': BIRDEYE_API_KEY
      }
    }
  )
  return birdEyeRes.data
}


export async function getBirdEyeUsdcRate(tokenAddress: string) {
  const birdEyeRes = await axios.get(
    `https://public-api.birdeye.so/defi/price?address=${tokenAddress}`,
    {
      headers: {
        'x-api-key': BIRDEYE_API_KEY
      }
    }
  )
  return birdEyeRes.data
}

export async function getBirdEyeUsdcRates(
  tokenMints: string[],
  log_all: boolean = false
): Promise<{ [key: string]: { value: number; updateUnixTime?: number } }> {
  if (log_all) console.log('fetching prices from birdeye', tokenMints);
  
  const tokenList = tokenMints.join(',')

  try {
    const multiPrices = await axios.get(
      `https://public-api.birdeye.so/defi/multi_price?list_address=${tokenList}`,
      {
        headers: {
          'x-api-key': BIRDEYE_API_KEY
        }
      }
    )
    const prices = multiPrices.data.data // { "token_address" : {value: "xxx", updateUnixTime: "xxx"} }
    if (log_all) console.log('prices fetched from birdeye', prices)
  
    return prices
  } catch (err) {
    console.log('error fetching prices from birdeye', err)
    throw err
  }
}
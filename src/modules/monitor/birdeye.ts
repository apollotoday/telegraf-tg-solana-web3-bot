import axios from "axios";

export async function getBirdEyeUsdcRate(tokenMint: string) {
  const birdEyeRes = await axios.get(
    `https://public-api.birdeye.so/defi/price?address=${tokenMint}`,
    {
      headers: {
        'x-api-key': process.env.BIRDEYE_API_KEY!
      }
    }
  )
  return birdEyeRes.data
}
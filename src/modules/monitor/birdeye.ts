import axios from "axios";

export async function getBirdEyeUsdcRate(tokenMint: string) {
  const birdEyeRes = await axios.get(
    `https://public-api.birdeye.so/defi/price?address=${tokenMint}`,
    {
      headers: {
        'x-api-key': '71fe074a7d5a4b27855eba558d6b8bcf'
      }
    }
  )
  return birdEyeRes.data
}
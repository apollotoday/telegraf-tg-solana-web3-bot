import axios from "axios";

const BIRDEYE_API_KEY = process.env.BIRDEYE_API_KEY!;

export async function getBirdeyeTokenInfo(tokenAddress: string) {
  const birdEyeRes = await axios.get(`https://public-api.birdeye.so/defi/token_overview?address=${tokenAddress}`, {
    headers: {
      "x-api-key": BIRDEYE_API_KEY,
    },
  });

  return birdEyeRes.data.data;
}

export async function getBirdeyeOHLCV({
  tokenAddress,
  timeFrame,
  timeFrameStart,
  timeFrameEnd,
}: {
  tokenAddress: string;
  timeFrame: "5m" | "15m" | "30m" | "1h" | "4h" | "8h" | "24h";
  timeFrameStart: Date;
  timeFrameEnd: Date;
}) {
  const timeFrameStartUnix = timeFrameStart.getTime() / 1000;
  const timeFrameEndUnix = timeFrameEnd.getTime() / 1000;

  const birdEyeRes = await axios.get(
    `https://public-api.birdeye.so/defi/ohlcv?address=${tokenAddress}&timeframe=${timeFrame}&time_from=${timeFrameStartUnix}&time_to=${timeFrameEndUnix}`,
    {
      headers: {
        "x-api-key": BIRDEYE_API_KEY,
      },
    }
  );

  return birdEyeRes.data.data;
}

export async function getBirdeyeTokenMarkets(tokenAddress: string) {
  const birdEyeRes = await axios.get(`https://public-api.birdeye.so/defi/v2/markets?address=${tokenAddress}`, {
    headers: {
      "x-api-key": BIRDEYE_API_KEY,
    },
  });

  const resultData = birdEyeRes.data.data;

  console.log(`Found ${resultData.total} markets for ${tokenAddress}`);

  return resultData.items;
}

export type BirdEyePriceType = {
  data: {
    value: number;
    updateUnixTime: number;
    updateHumanTime: string;
    priceChange24h: number;
  };
};

export async function getBirdEyeUsdcRate(tokenAddress: string) {
  const birdEyeRes = await axios.get<BirdEyePriceType>(`https://public-api.birdeye.so/defi/price?address=${tokenAddress}`, {
    headers: {
      "x-api-key": BIRDEYE_API_KEY,
    },
  });
  return birdEyeRes.data;
}

export async function getBirdEyeSolPrice() {
  return getBirdEyeUsdcRate("So11111111111111111111111111111111111111112");
}

export async function getBirdEyeUsdcRates(
  tokenMints: string[],
  log_all: boolean = false
): Promise<{ [key: string]: { value: number; updateUnixTime?: number } }> {
  if (log_all) console.log("fetching prices from birdeye", tokenMints);

  const tokenList = tokenMints.join(",");

  try {
    const multiPrices = await axios.get(`https://public-api.birdeye.so/defi/multi_price?list_address=${tokenList}`, {
      headers: {
        "x-api-key": BIRDEYE_API_KEY,
      },
    });
    const prices = multiPrices.data.data; // { "token_address" : {value: "xxx", updateUnixTime: "xxx"} }
    if (log_all) console.log("prices fetched from birdeye", prices);

    return prices;
  } catch (err) {
    console.log("error fetching prices from birdeye", err);
    throw err;
  }
}

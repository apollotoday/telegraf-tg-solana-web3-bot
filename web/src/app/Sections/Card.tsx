import {
  RankingCard,
  IntroductionCard,
  MarketMakerCard,
} from "@/components/Cards";

const CardSection = () => {
  return (
    <div>
      <div className="grid grid-cols-10 md:grid-cols-10 px-[12px] md:px-[48px] gap-[18px]">
        <IntroductionCard
          className="col-span-6"
          title={config.cards.volume.title}
          description={config.cards.volume.description}
          bgImage={config.cards.volume.background}
          bgSize={"cover"}
          bgPos={"right"}
        />
        <IntroductionCard
          className="col-span-4"
          title={config.cards.boost.title}
          description={config.cards.boost.description}
          bgImage={config.cards.boost.background}
          bgSize={"cover"}
          bgPos={"right"}
        />
      </div>
      <div className="px-[12px] md:px-[48px] mt-[18px]">
        <RankingCard />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 px-[12px] md:px-[48px] gap-[18px] mt-[18px]">
        <IntroductionCard
          title={config.cards.smartProfit.title}
          description={config.cards.smartProfit.description}
          bgImage={config.cards.smartProfit.background}
          bgSize={"cover"}
          bgPos={"right"}
        />
        <IntroductionCard
          title={config.cards.pricePush.title}
          description={config.cards.pricePush.description}
          bgImage={config.cards.pricePush.background}
          bgSize={"cover"}
          bgPos={"right"}
        />
      </div>
      <div className="px-[12px] md:px-[48px] mt-[18px]">
        <MarketMakerCard />
      </div>
    </div>
  );
};

const config = {
  cards: {
    volume: {
      title: "Volume Bot (Solana)",
      description:
        'Need a volume boost to elevate the attention of your token? Momentum Labs has you covered. By running our transactions as a Jito Bundle, they happen in the same block, minimizing price impact and protecting you from "farmers" while driving up the volume.',
      background: "url(/images/VolumeCardBG.png)",
    },
    boost: {
      title: "BOOST (combined Volume + Ranking)",
      description:
        "BOOST is crafted for the pushing existing tokens to new levels, combining our effective Ranking Bot with our Volume Bot allowing all crucial metrics to get significantly pushed with the best value for your money available.",
      background: "url(/images/BoostCardBG.png)",
    },
    ranking: {
      background: "url(/images/StarBackground3.png)",
      title: "Ranking Bot (Solana)",
      description:
        "Fast Lane to Top Rankings. The Momentum Labs Rank Boost is designed to supercharge your token’s metrics and propel its ranking on Dex Screener by enhancing key factors like:",
    },
    smartProfit: {
      background: "url(/images/SmartProfit.svg)",
      title: "Smart Profit",
      description:
        "BOOST is crafted for the pushing existing tokens to new levels, combining our effective Ranking Bot with our Volume Bot allowing all crucial metrics to get significantly pushed with the best value for your money available.",
    },
    pricePush: {
      background: "url(/images/PricePush.svg)",
      title: "Price Push",
      description:
        "Need a volume boost to elevate the attention of your token? Momentum Labs has you covered. ",
    },
  },
};

export default CardSection;

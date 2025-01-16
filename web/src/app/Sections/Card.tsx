import { IntroductionCard } from "@/components/Cards";

type CardSectionProps = {
  id?: string;
};

const CardSection: React.FC<CardSectionProps> = ({ id }) => {
  return (
    <div id={id}>
      <div className="grid grid-cols-1 md:grid-cols-11 px-[12px] md:px-[48px] gap-[18px]">
        <IntroductionCard
          id="features"
          scrollMarginTop={"200px"}
          className="col-span-1 md:col-span-6"
          title={config.cards.volume.title}
          description={config.cards.volume.description}
          bgImage={{
            base: config.cards.volume.backgroundMobileUrl,
            md: config.cards.volume.backgroundUrl,
          }}
          bgSize={"cover"}
          bgPos={"right"}
        ></IntroductionCard>
        <IntroductionCard
          className="col-span-1 md:col-span-5"
          title={config.cards.smartProfit.title}
          description={config.cards.smartProfit.description}
          bgImage={{
            base: config.cards.smartProfit.backgroundMobileUrl,
            md: config.cards.smartProfit.backgroundUrl,
          }}
          bgSize={"cover"}
          bgPos={"right"}
        />
        <IntroductionCard
          className="col-span-1 md:col-span-5"
          title={config.cards.pricePush.title}
          description={config.cards.pricePush.description}
          bgImage={{
            base: config.cards.pricePush.backgroundMobileUrl,
            md: config.cards.pricePush.backgroundUrl,
          }}
          bgSize={"cover"}
          bgPos={"right"}
        />
        <IntroductionCard
          className="col-span-1 md:col-span-6"
          title={config.cards.ranking.title}
          description={config.cards.ranking.description}
          bgImage={{
            base: config.cards.ranking.backgroundMobileUrl,
            md: config.cards.ranking.backgroundUrl,
          }}
          bgSize={"cover"}
          bgPos={"right"}
        />
        <IntroductionCard
          id="market-making"
          scrollMarginTop={"30vh"}
          className="col-span-1 md:col-span-11"
          title={config.cards.aiDriven.title}
          description={config.cards.aiDriven.description}
          bgImage={{
            base: config.cards.aiDriven.backgroundMobileUrl,
            md: config.cards.aiDriven.backgroundUrl,
          }}
          cardType="get-in-touch-team"
          bgSize={"cover"}
          bgPos={"right"}
        />
      </div>
    </div>
  );
};

const config = {
  cards: {
    volume: {
      title: "Volume",
      description:
        "Elevate your token’s visibility with a targeted volume boost. By running transactions with precision, we help you drive activity, enhance screener rankings, and protect price stability—ensuring your token stands out in the crowd.",
      backgroundUrl: "url(/images/cards/VolumeBg.svg)",
      backgroundMobileUrl: "url(/images/cards/VolumeBg_m.svg)",
      background: "/images/cards/VolumeBg.svg",
    },
    smartProfit: {
      title: "Smart Profit",
      description:
        "Market-making should work for you, not against you. Our Smart Profit tool maximizes returns by balancing liquidity and growth while tailoring strategies to ensure every action enhances your token’s performance and profitability.",
      backgroundUrl: "url(/images/cards/SmartProfitBg.svg)",
      backgroundMobileUrl: "url(/images/cards/SmartProfitBg_m.svg)",
      background: "/images/cards/SmartProfitBg.svg",
    },
    pricePush: {
      title: "Price Push",
      description:
        "Amplify your token’s value with Price Push. This targeted tool focuses on critical price levels, ensuring sustained upward action that drives confidence and market growth.",
      backgroundUrl: "url(/images/cards/PricePushBg.png)",
      backgroundMobileUrl: "url(/images/cards/PricePushBg_m.svg)",
      background: "/images/cards/PricePushBg.png",
    },
    ranking: {
      title: "Ranking",
      description:
        "Fast-track your token to the top of key rankings. Our Ranking Boost focuses on supercharging your token’s metrics, propelling it to higher visibility on platforms like Dexscreener while enhancing engagement.",
      backgroundUrl: "url(/images/cards/RankingBg.svg)",
      backgroundMobileUrl: "url(/images/cards/RankingBg_m.svg)",
      background: "/images/cards/RankingBg.svg",
    },
    aiDriven: {
      title: "AI-Driven Market Making",
      description:
        "Your all-in-one market-making solution. From liquidity management to volume and visibility, our Market Maker Service handles it all with AI precision, ensuring your token remains competitive and impactful over the long run.",
      backgroundUrl: "url(/images/cards/AiDrivenBg.svg)",
      backgroundMobileUrl: "url(/images/cards/AiDrivenBg_m.svg)",
      background: "/images/cards/AiDrivenBg.svg",
    },
  },
};

export default CardSection;

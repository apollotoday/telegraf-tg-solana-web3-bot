import { Box, Flex } from "@chakra-ui/react";
import { WhiteButton, NoBgButton } from "@/components/Buttons";
import { ChevronRightIcon } from "@/components/Icons";
import {
  HashIcon,
  MinimizeIcon,
  PercentIcon,
  UserIcon,
} from "@/components/Icons";
import { MomentumChart } from "@/components/Images";

const RankingCard = () => {
  return (
    <Box
      display={"flex"}
      flexDirection={"column"}
      border={"1px solid #202020"}
      borderRadius={"24px"}
      p={"32px"}
      bgImage={config.background}
      bgSize={"cover"}
      bgPos={"center"}
      position={"relative"}
    >
      <div className="font-medium text-[20px] leading-[30px] z-[2]">
        {config.title}
      </div>
      <div className="max-w-[334px] mt-[10px] font-nomal text-[14px] leading-[24px] text-[#898989] z-[2]">
        {config.description}
      </div>
      <div className="md:absolute top-[66px] right-[64px] z-[1]">
        <MomentumChart />
      </div>
      <Flex
        gap={"24px"}
        mt={{ md: "156px" }}
        flexDir={{ base: "column", sm: "row" }}
      >
        <WhiteButton width={"197px"}>
          <Box
            color={"#1C1C1C"}
            fontWeight={"600"}
            fontSize={"16px"}
            mr={"10px"}
          >
            Access Our Bot
          </Box>
          <ChevronRightIcon />
        </WhiteButton>
        <NoBgButton>
          <Box
            color={"#898989"}
            fontWeight={"600"}
            fontSize={"16px"}
            mr={"10px"}
          >
            Learn more
          </Box>
          <ChevronRightIcon color="grey" />
        </NoBgButton>
      </Flex>

      <div className="grid grid-cols-1 md:grid-cols-2 mt-[30px] mx-[-32px] z-[10] bg-black">
        {config.cards.map((card, index) => {
          return (
            <Flex
              key={index}
              border={"1px solid #202020"}
              alignItems={"center"}
              justifyContent={"space-between"}
              p={"32px"}
            >
              <div>
                <Box
                  fontSize={"18px"}
                  fontWeight={500}
                  lineHeight={"28px"}
                  color={"white"}
                >
                  {card.title}
                </Box>
                <Box
                  fontWeight={400}
                  fontSize={"14px"}
                  lineHeight={"20px"}
                  color={"#898989"}
                >
                  {card.description}
                </Box>
              </div>
              <div>{card.Icon}</div>
            </Flex>
          );
        })}
      </div>
    </Box>
  );
};

const config = {
  title: "Ranking Bot (Solana)",
  description:
    "Fast Lane to Top Rankings. The Momentum Labs Rank Boost is designed to supercharge your token’s metrics and propel its ranking on Dex Screener by enhancing key factors like:",
  cards: [
    {
      title: "Number of transactions",
      description: "Some text here to give more context to this point",
      Icon: <HashIcon />,
    },
    {
      title: "Buy-to-sell ratio",
      description: "Some text here to give more context to this point",
      Icon: <MinimizeIcon />,
    },
    {
      title: "Buyer-to-seller ratio",
      description: "Some text here to give more context to this point",
      Icon: <PercentIcon />,
    },
    {
      title: "Number of makers",
      description: "Some text here to give more context to this point",
      Icon: <UserIcon />,
    },
  ],
  background: "url(/images/StarBackground3.svg)",
};

export default RankingCard;

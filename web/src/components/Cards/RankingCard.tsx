import { Box, Flex } from "@chakra-ui/react";
import { NoBgButton, AccessBotButton } from "@/components/Buttons";
import { ChevronRightIcon } from "@/components/Icons";
import { MomentumChart } from "@/components/Images";

const RankingCard = () => {
  return (
    <Box
      display={"flex"}
      flexDirection={"column"}
      border={"1px solid #202020"}
      borderRadius={"24px"}
      p={{ base: "16px", md: "32px" }}
      bgImage={config.background}
      bgSize={"cover"}
      bgPos={"right"}
      position={"relative"}
    >
      <div className="font-medium text-[30px] leading-[30px] z-[2]">
        {config.title}
      </div>
      <div className="max-w-[334px] mt-[10px] font-nomal text-[14px] leading-[24px] text-[#898989] z-[2]">
        {config.description}
      </div>
      <div className="md:absolute top-[66px] right-[64px] z-[1]">
        <MomentumChart width="100%" />
      </div>
      <Flex
        gap={"24px"}
        mt={{ md: "156px" }}
        flexDir={{ base: "column", sm: "row" }}
        alignItems={"center"}
        zIndex={10}
      >
        <AccessBotButton />

        <NoBgButton w={"194px"}>
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
    </Box>
  );
};

const config = {
  title: "Ranking Bot (Solana)",
  description:
    "Fast Lane to Top Rankings. The Momentum Labs Rank Boost is designed to supercharge your token’s metrics and propel its ranking on Dex Screener by enhancing key factors like:",
  background: "url(/images/StarBackground3.svg)",
};

export default RankingCard;

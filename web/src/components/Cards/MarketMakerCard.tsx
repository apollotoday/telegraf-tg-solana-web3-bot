import { Box, Flex } from "@chakra-ui/react";
import { NoBgButton, AccessBotButton } from "@/components/Buttons";
import { ChevronRightIcon } from "@/components/Icons";

const MarketMakerCard = () => {
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
      <div className="font-medium text-[30px] leading-[30px]">
        {config.title}
      </div>
      <div className="max-w-[334px] mt-[10px] font-nomal text-[14px] leading-[24px] text-[#898989] z-[2]">
        {config.description}
      </div>
      <Flex
        gap={"24px"}
        mt={"156px"}
        flexDir={{ base: "column", sm: "row" }}
        alignItems={"center"}
        zIndex={10}
      >
        <AccessBotButton text={config.getInTouchButton} w={"280px"} />

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
  title: "Market Maker Service",
  description:
    "Fast Lane to Top Rankings. The Momentum Labs Rank Boost is designed to supercharge your token’s metrics and propel its ranking on Dex Screener by enhancing key factors like:",
  background: "url(/images/MarketMakerBg.svg)",
  getInTouchButton: "Get in touch with our team",
};

export default MarketMakerCard;

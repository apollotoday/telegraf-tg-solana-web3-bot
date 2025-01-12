"use client";

import { Box, Flex, VStack } from "@chakra-ui/react";

import { WhiteButton } from "@/components/Buttons";
import { ChevronRightIcon, SolanaIcon } from "@/components/Icons";

const TryMomentumSection = () => {
  const TextComponent = () => (
    <Box
      fontWeight={"600"}
      fontSize={"16px"}
      mr={{ base: "10px", md: "122px" }}
      lineHeight={"24px"}
    >
      {config.tryMomentum.button}
    </Box>
  );

  return (
    <VStack
      mx={{ base: "24px", md: "48px" }}
      bgColor={"#000000"}
      bgImage={config.images.starBackground}
      bgSize={"cover"}
      bgPos={"center"}
      border={"1px solid #202020"}
      borderRadius={"24px"}
      h={"661px"}
      direction={"column"}
      justifyContent={"center"}
      mt={"47px"}
      textAlign={"center"}
    >
      <VStack gap={"24px"} px={"10px"}>
        <Box
          bgColor={"#151515B3"}
          borderRadius={"161px"}
          color={"#A7A7A7"}
          p={"8px 32px"}
          fontSize={"16px"}
          lineHeight={"24px"}
        >
          {config.tryMomentum.header}
        </Box>
        <Box fontWeight={"normal"} fontSize={{ base: "40px", md: "48px" }}>
          {config.tryMomentum.title}
        </Box>
        <Box
          fontWeight={"normal"}
          fontSize={"18px"}
          lineHeight={"24px"}
          color={"#898989"}
        >
          {config.tryMomentum.description}
        </Box>
      </VStack>
      <Flex alignItems={"end"} mt={"71px"}>
        <Box
          fontSize={"128px"}
          lineHeight={"90px"}
          fontWeight={"bold"}
          letterSpacing={"-2%"}
          mr={"16px"}
        >
          1
        </Box>
        {config.tryMomentum.solanaIcon}
      </Flex>
      <WhiteButton
        className="h-[44px] mt-[48px]"
        RightIcon={ChevronRightIcon}
        TextComponent={TextComponent}
      />

      <Box
        mt={"19px"}
        px={"12px"}
        lineHeight={"20px"}
        color={"#898989"}
        fontSize={"14px"}
        fontWeight={"normal"}
      >
        {config.tryMomentum.footer}
      </Box>
    </VStack>
  );
};

const config = {
  images: {
    starBackground: "url(/images/StarBackground.png)",
  },
  tryMomentum: {
    header: "Try Momentum",
    title: "Still not sure?",
    description: "Try Momentum and see the difference with only",
    button: "Try Momentum now",
    solanaIcon: <SolanaIcon />,
    footer: "*Volume X (no Fees taken - available only once per token)",
  },
};

export default TryMomentumSection;

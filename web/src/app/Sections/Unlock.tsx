"use client";

import Image from "next/image";
import { Box, Flex, VStack } from "@chakra-ui/react";

import { WhiteButton } from "@/components/Buttons";

import { ChevronRightIcon, TelegramIcon, HeartIcon } from "@/components/Icons";

const UnLockSection = () => {
  const TextComponent = () => (
    <Box fontWeight={"600"} fontSize={"16px"} lineHeight={"24px"}>
      Join our community
    </Box>
  );

  return (
    <VStack
      pos={"relative"}
      textAlign={"center"}
      px={"10px"}
      overflow={"hidden"}
    >
      <Box
        bgImage={config.unlock.background}
        bgSize={"cover"}
        pos={"absolute"}
        top={"57px"}
        w={{ base: "100%", md: "80%" }}
        h={"610px"}
        bgPos={"center"}
        left={{ base: "0px", md: "250px" }}
      />
      <Box fontSize={"36px"} mt={"111px"}>
        {config.unlock.title}
      </Box>
      <Box
        maxW={"630px"}
        fontSize={"16px"}
        color={"#898989"}
        fontWeight={"normal"}
        lineHeight={"24px"}
        letterSpacing={"0px"}
        textAlign={"center"}
        mt={"24px"}
      >
        {config.unlock.description}
      </Box>
      <WhiteButton
        mt={"24px"}
        LeftIcon={TelegramIcon}
        RightIcon={ChevronRightIcon}
        TextComponent={TextComponent}
      />
      <div className="mt-[104px]" />
      <Image
        src={config.images.botImageS}
        alt="Momentum Bot"
        width={521}
        height={535}
        className="z-[1]"
      />
      <Box
        mx={{ base: "30px", md: "71px" }}
        pos={"absolute"}
        bottom={{ base: "355px", md: "100px" }}
      >
        <Image
          alt="Momentum"
          src={config.images.momentum}
          width={1300}
          height={156}
        ></Image>
      </Box>
      <Flex
        color={"#444444"}
        alignItems={"center"}
        justifyContent={"center"}
        pos={"absolute"}
        bottom={"0px"}
        height={"70px"}
        w={"full"}
        bg={"#000000"}
        zIndex={3}
        display={{ base: "none", md: "flex" }}
      >
        {config.about.first}
        <div className="px-[5px]">{config.about.icon}</div>
        {config.about.last} &nbsp;
        <a href={config.about.url} className="hover:underline">
          {config.about.urlText}
        </a>
      </Flex>
      <Box
        bg={"black"}
        filter={"blur(20px)"}
        width={"1069px"}
        height={"200px"}
        pos={"absolute"}
        left={"50%"}
        borderRadius={"50%"}
        transform={"translate(-50%, 50%)"}
        bottom={"100px"}
        zIndex={2}
      />
    </VStack>
  );
};

const config = {
  images: {
    momentum: "/images/MOMENTUM.svg",
    botImageS: "/images/MomentumBot_s.png",
  },
  about: {
    first: "Made with",
    icon: <HeartIcon />,
    last: "by",
    urlText: "duoversestudio.com",
    url: "https://duoversestudio.com",
  },
  unlock: {
    title: "Unlock the full potential of Momentum Labs",
    description:
      "Now seamlessly integrated into Telegram. Our user-friendly bot simplifies the process of managing and scaling your Solana project. Want to accelerate your project's growth?",
    background: "url(/images/FooterBackground.svg)",
  },
};

export default UnLockSection;

"use client";

import Image from "next/image";
import { Box, Flex, VStack } from "@chakra-ui/react";

import { HeartIcon } from "@/components/Icons";

const UnLockSection = () => {
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
        display={{ base: "none", md: "block" }}
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
    background: "url(/images/FooterBackground.svg)",
  },
};

export default UnLockSection;

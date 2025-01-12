"use client";

import Image from "next/image";
import { Box } from "@chakra-ui/react";
import { motion } from "framer-motion";

import BinaryCode from "@/components/Sections/BinaryCode";
import { ComingSoonButton, NoBgButton } from "@/components/Buttons";
import { ChevronRightIcon } from "@/components/Icons";

const HeroSection = () => {
  return (
    <div className="relative text-center w-full flex flex-col overflow-hidden">
      <div className="absolute top-0 w-full h-[685px] bg-[url('/images/Grid.png')] bg-contain bg-center" />
      <Box
        w={"full"}
        h={"911px"}
        maxW={"1182px"}
        mx={"auto"}
        position={"absolute"}
        top={"174px"}
        left={"50%"}
        transform={"translateX(-50%)"}
        bgImage={config.hero.rectanglesBg}
        backgroundSize="cover"
        backgroundPosition="center"
        backgroundRepeat="no-repeat"
        zIndex={5}
      />
      <Box
        bgImage={config.images.heroMask}
        width={"1204px"}
        height={"533px"}
        pos={"absolute"}
        top={"310px"}
        left={"50%"}
        bgSize={"cover"}
        transform={"translateX(-50%)"}
        zIndex={4}
      />
      <div className="relative z-10">
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="font-medium text-[60px] tracking--2pct leading-[72px] text-center max-w-[916px]  mx-auto pt-[59px] bg-gradient-to-r from-white via-gray-400 to-white bg-clip-text text-transparent"
        >
          {config.hero.title}
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="max-w-[721px] font-normal text-[20px] text-[#A09E9E] leading-[30px] mx-auto mt-[24px] whitespace-pre-line"
        >
          {config.hero.description}
        </motion.div>
        <div className="mt-[18px] relative">
          <div className="flex flex-col sm:flex-row justify-center px-[60px] gap-[24px]">
            <ComingSoonButton />
            <NoBgButton>
              <Box color={"#898989"} fontWeight={"600"} fontSize={"16px"}>
                Learn more
              </Box>
              <ChevronRightIcon color="grey" />
            </NoBgButton>
          </div>
          <Box
            justifyContent={"center"}
            display={"flex"}
            zIndex={6}
            pos={"relative"}
          >
            <Image
              src={config.images.botImage}
              alt="Momentum Bot"
              width={721}
              height={735}
            />
            <Box
              pos={"absolute"}
              w={"1344px"}
              h={"955px"}
              bgColor={"#000000"}
              borderRadius={"143px"}
              filter={"blur(80px)"}
              top={"360px"}
            ></Box>
          </Box>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.5 }}
          className="mt-[58px] relative z-[7]"
        >
          <div className="font-medium text-[60px] leading-[72px] px-[20px]">
            {config.hero.footerTitle}
          </div>
          <div className="font-normal text-[20px] leading-[24px] mt-[24px] text-[#898989] px-[20px] whitespace-pre-line">
            {config.hero.footerDescription}
          </div>
          <BinaryCode />
        </motion.div>
        {/* <div className="absolute w-[80%] top-[310px] left-1/2 transform -translate-x-1/2 h-[553px] bg-black backdrop-blur-md rounded-full"></div> */}
      </div>
    </div>
  );
};

const config = {
  images: {
    momentum: "/images/MOMENTUM.svg",
    grid: "url(/images/Grid.png)",
    botImage: "/images/MomentumBot.png",
    botImageS: "/images/MomentumBot_s.png",
    starBackground: "url(/images/StarBackground.png)",
    heroMask: "url(/images/Backdrop.svg)",
  },
  name: "MOMENTUM",
  hero: {
    title: "Game-Changing Market-Making powered by AI.",
    description:
      "Tailored AI strategies built around your goals and budget \n drive visibility, master liquidity, and revolutionize token management.",
    footerTitle: "The Ultimate Token Acccelerator",
    footerDescription:
      "Our AI-powered toolkit delivers tailored strategies for liquidity, visibility, and growth.\n Choose the package that fits your goals and let our technology handle the heavy lifting.",
    rectanglesBg: "url(/images/Rectangles.svg)",
  },
};

export default HeroSection;

"use client";

import { Box, VStack } from "@chakra-ui/react";

import { PackageCard } from "@/components/Cards";
import {
  TargetIcon,
  RocketIcon,
  TrendUpIcon,
  CoinsIcon,
} from "@/components/Icons";
import { WhiteButton } from "@/components/Buttons";

const PackageCardSection = () => {
  const TextComponent = () => (
    <Box fontSize={"16px"} lineHeight={"24px"} fontWeight={"500"}>
      {config.launch.buttonText}
    </Box>
  );

  return (
    <Box
      textAlign={"center"}
      position={"relative"}
      mt={"29px"}
      overflow={"hidden"}
      pb={"132px"}
      id="packages"
      scrollMarginTop={"50vh"}
    >
      <Box
        w={"full"}
        h={"903px"}
        pos={"absolute"}
        top={0}
        bgImage={config.launch.background}
        bgSize={"contain"}
        bgPos={"center"}
      />
      <Box
        bg={{
          base: "radial-gradient(circle, rgba(0, 0, 0, 0) 15%, rgba(0, 0, 0, 1) 100%)",
          md: "radial-gradient(circle, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 1) 60%)",
        }}
        width={"100%"}
        height={"100vw"}
        pos={"absolute"}
        transform={{ md: "translateY(-50%)" }}
        top={{ base: "0px", md: "383px" }}
        zIndex={7}
      />
      {/* <Box
        top={"270px"}
        rounded={"50%"}
        bg={"#24446099"}
        filter={"blur(100px)"}
        transform={{ md: "translateX(-50%)" }}
        left={"50%"}
        w={"150%"}
        h={"992px"}
        pos={"absolute"}
        zIndex={6}
      /> */}
      <VStack zIndex={8} pos={"relative"} mt={"239px"}>
        <Box
          color={"white"}
          fontSize={"60px"}
          lineHeight={"72px"}
          fontWeight={500}
        >
          {config.launch.title}
        </Box>
        <Box
          maxW={"784px"}
          fontSize={"20px"}
          color={"#898989"}
          lineHeight={"24px"}
          fontWeight={"400"}
          mt={"24px"}
        >
          {config.launch.description}
        </Box>
        <WhiteButton TextComponent={<TextComponent />} mt={"24px"} />

        {/* Package cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[32px] px-[20px] md:px-[80px] mt-[51px] max-w-[1440px]">
          {config.packages.map((pck, index) => {
            return <PackageCard key={index} {...pck} />;
          })}
        </div>
      </VStack>
    </Box>
  );
};

const config = {
  launch: {
    title: "Your Token, Supercharged.",
    description:
      "Momentum AI offers tailored packages to elevate your token. From holder growth to volume and rankings, our premium package features an AI Decision Engine to execute the right strategies at the right time.",
    buttonText: "BETA Coming Soon",
    background: "url(/images/Grid.svg)",
  },
  packages: [
    {
      type: "Momentum Spark",
      title: "Small Package",
      description:
        "Ignite your token’s presence with essential tools to boost holders and volume.",
      supports: [
        {
          Icon: <RocketIcon />,
          name: "Volum Boost",
        },
        {
          Icon: <TrendUpIcon />,
          name: "Holder Boost",
        },
      ],
    },
    {
      type: "Momentum Pulse",
      title: "Medium Package",
      description:
        "Strengthen your token’s impact with advanced tools for visibility and growth.",
      supports: [
        {
          Icon: <RocketIcon />,
          name: "Volume Boost",
        },
        {
          Icon: <TrendUpIcon />,
          name: "Holder Boost",
        },
        {
          Icon: <TargetIcon />,
          name: "Ranking Boost",
        },
        {
          Icon: <TargetIcon />,
          name: "Smart Profit",
        },
      ],
    },
    {
      type: "Momentum Apex",
      title: "Big Package",
      description:
        "Utilizes our full toolkit with the AI Decision Engine, autonomously optimizing strategies and executing actions for your goals.",
      supports: [
        {
          Icon: <RocketIcon />,
          name: "Volume Boost",
        },
        {
          Icon: <TrendUpIcon />,
          name: "Holder Boost",
        },
        {
          Icon: <TargetIcon />,
          name: "Ranking Boost",
        },
        {
          Icon: <TargetIcon />,
          name: "Smart Profit",
        },
        {
          Icon: <CoinsIcon />,
          name: "AI Decision Engine",
        },
      ],
    },
  ],
};

export default PackageCardSection;

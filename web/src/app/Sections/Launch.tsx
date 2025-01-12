import { Box, Flex } from "@chakra-ui/react";

import { PackageCard } from "@/components/Cards";
import {
  TargetIcon,
  RocketIcon,
  TrendUpIcon,
  PlusCircleIcon,
  CoinsIcon,
} from "@/components/Icons";

const LaunchSection = () => {
  return (
    <Flex
      flexDir="column"
      justifyContent={"center"}
      alignItems={"center"}
      textAlign={"center"}
      position={"relative"}
      mt={"29px"}
      px={{ base: "20px" }}
      overflow={"hidden"}
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
          base: "radial-gradient(circle, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 1) 100%)",
          md: "radial-gradient(circle, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 1) 60%)",
        }}
        width={"100%"}
        height={"100vw"}
        pos={"absolute"}
        transform={{ md: "translateY(-50%)" }}
        top={{ base: "0px", md: "383px" }}
        zIndex={7}
      />
      <div className="z-[5] mt-[50px] md:mt-[239px]">
        <Box
          {...styleConfig.radialGradientText}
          // color={"white"}
          fontSize={"32px"}
          lineHeight={"44px"}
          fontWeight={500}
        >
          {config.launch.title}
        </Box>
        <Box
          maxW={"566px"}
          fontSize={"16px"}
          color={"#898989"}
          lineHeight={"24px"}
          fontWeight={"400"}
          mt={"24px"}
        >
          {config.launch.description}
        </Box>
        <Box
          p={"8px 32px"}
          bgColor={"#151515"}
          color={"white"}
          borderRadius={"161px"}
          mt={"24px"}
        >
          {config.launch.button}
        </Box>
      </div>

      {/* Package cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[32px] px-0 md:px-[80px] mt-[51px] z-[10] max-w-[1440px]">
        {config.packages.map((pck, index) => {
          return <PackageCard key={index} {...pck} />;
        })}
      </div>
    </Flex>
  );
};

const config = {
  launch: {
    title: "Ready to launch your token?",
    description:
      "Momentum Labs is your key to boosting all crucial metrics to increase your chance for success. With powerful tools to pump your numbers and skyrocket your ranking, we’ll help you take your token launch to the next level!",
    button: "Available for Moonshot & Pump.fun",
    background: "url(/images/LaunchBG.svg)",
  },
  packages: [
    {
      title: "Momentum Ignito",
      type: "Small Package",
      description:
        "Ideal for newly launched or small projects aiming to make a significant impact",
      supports: [
        {
          Icon: <TargetIcon />,
          name: "Sinping Supply",
        },
        {
          Icon: <RocketIcon />,
          name: "Holder Boost",
        },
      ],
    },
    {
      title: "Momentum Boost",
      type: "Medium Package",
      description:
        "Tailored for projects ready to escalate their presence and attract more attention",
      supports: [
        {
          Icon: <TargetIcon />,
          name: "Sinping Supply",
        },
        {
          Icon: <RocketIcon />,
          name: "Holder Boost",
        },
        {
          Icon: <TrendUpIcon />,
          name: "Boost Ranking for trending",
        },
      ],
    },
    {
      title: "Momentum Surge",
      type: "Big Package",
      description:
        "Tailored for projects ready to escalate their presence and attract more attention",
      supports: [
        {
          Icon: <TargetIcon />,
          name: "Sinping Supply",
        },
        {
          Icon: <RocketIcon />,
          name: "Holder Boost",
        },
        {
          Icon: <TrendUpIcon />,
          name: "Boost Ranking for trending",
        },
      ],
      isMain: true,
    },
    {
      title: "Momentum Titan",
      type: "Small Package",
      description:
        "Ideal for newly launched or small projects aiming to make a significant impact",
      supports: [
        {
          Icon: <TargetIcon />,
          name: "Sinping Supply",
        },
        {
          Icon: <RocketIcon />,
          name: "Holder Boost",
        },
      ],
    },
    {
      title: "Momentum Prime",
      type: "Medium Package",
      description:
        "Tailored for projects ready to escalate their presence and attract more attention",
      supports: [
        {
          Icon: <TargetIcon />,
          name: "Sinping Supply",
        },
        {
          Icon: <RocketIcon />,
          name: "Holder Boost",
        },
        {
          Icon: <TrendUpIcon />,
          name: "Boost Ranking for trending",
        },
      ],
    },
    {
      title: "Momentum Custome",
      type: "Need more features and support?",
      description: "Get in touch with out team.",
      supports: [
        {
          Icon: <TargetIcon />,
          name: "Sinping Supply",
        },
        {
          Icon: <RocketIcon />,
          name: "Holder Boost",
        },
        {
          Icon: <TrendUpIcon />,
          name: "Boost Ranking for trending",
        },
        {
          Icon: <PlusCircleIcon />,
          name: "Volume Bot (on Launch Platform + after Migration for first X Hours)",
        },
        {
          Icon: <CoinsIcon />,
          name: "Smart Profit",
        },
      ],
    },
  ],
};

const styleConfig = {
  radialGradientText: {
    bgImage: "radial-gradient(#FFFFFF, #A2A2A2, #FFFFFF)",
    bgClip: "text",
    color: "transparent",
  },
  radialGradient: {
    bgColor: "radial-gradient(#FFFFFF, #A2A2A2, #FFFFFF)",
  },
};

export default LaunchSection;

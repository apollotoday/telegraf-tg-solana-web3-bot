import Image from "next/image";
import { Box, Flex, VStack } from "@chakra-ui/react";

import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";
import { AccessBotButton, NoBgButton, WhiteButton } from "@/components/Buttons";
import { ChevronRightIcon, HeartIcon, SolanaIcon } from "@/components/Icons";
import {
  RankingCard,
  BoostCard,
  VolumeCard,
  PackageCard,
} from "@/components/Cards";
import {
  TargetIcon,
  RocketIcon,
  TrendUpIcon,
  PlusCircleIcon,
  CoinsIcon,
} from "@/components/Icons";

const Home = () => {
  return (
    <div className="w-screen relative justify-center">
      <Header />
      <main className="w-full">
        {/* Hero component */}
        <div className="min-h-[15px]"></div>
        <div className="relative text-center w-full">
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
            bgImage="url('/images/Frame37408.png')"
            backgroundSize="cover"
            backgroundPosition="center"
            backgroundRepeat="no-repeat"
          />
          <div className="relative z-10">
            <div className="font-medium text-[60px] leading-[72px] text-center max-w-[906px] mx-auto pt-[59px] bg-gradient-to-r from-white via-gray-400 to-white bg-clip-text text-transparent">
              {config.hero.title}
            </div>
            <div className="max-w-[730px] font-normal text-[20px] text-[#898989] leading-[30px] mx-auto mt-[24px]">
              {config.hero.description}
            </div>
            <div className="mt-[18px] relative">
              <div className="flex flex-col sm:flex-row justify-center px-[60px] gap-[24px]">
                <AccessBotButton />
                <NoBgButton>
                  <Box color={"#898989"} fontWeight={"600"} fontSize={"16px"}>
                    Learn more
                  </Box>
                  <ChevronRightIcon color="grey" />
                </NoBgButton>
              </div>
              <Box justifyContent={"center"} display={"flex"}>
                <Image
                  src={config.images.botImage}
                  alt="Momentum Bot"
                  width={521}
                  height={535}
                ></Image>
              </Box>
            </div>
            <div className="font-medium text-[36px] leading-[44px] mt-[120px]">
              {config.hero.footerTitle}
            </div>
            <div className="font-normal text-[16px] leading-[24px] mt-[24px] text-[#898989]">
              {config.hero.footerDescription}
            </div>
            <div className="absolute w-[80%] top-[310px] left-1/2 transform -translate-x-1/2 h-[553px] bg-black backdrop-blur-md rounded-full"></div>
          </div>
        </div>
        {/* binary code component */}
        <Box
          width={"full"}
          height={"392px"}
          bgImage="url('/images/BinaryCode.png')"
          backgroundSize="cover"
          backgroundPosition="center"
          backgroundRepeat="no-repeat"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 px-[48px] gap-[18px]">
          <VolumeCard
            title={config.cards.volume.title}
            description={config.cards.volume.description}
            bgImage={config.cards.volume.background}
            bgSize={"cover"}
            bgPos={"right"}
          />
          <BoostCard
            bgImageUrl={config.images.grid}
            title={config.cards.boost.title}
            description={config.cards.boost.description}
            bgImage={config.cards.boost.background}
            bgSize={"cover"}
            bgPos={"right"}
          />
        </div>
        <div className="px-[48px] mt-[18px]">
          <RankingCard />
        </div>

        {/* Ready to launch your token */}
        <Flex
          flexDir="column"
          justifyContent={"center"}
          alignItems={"center"}
          textAlign={"center"}
        >
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
          >
            {config.launch.description}
          </Box>
          <Box
            p={"8px 32px"}
            bgColor={"#151515"}
            color={"white"}
            borderRadius={"161px"}
          >
            {config.launch.title}
          </Box>
        </Flex>

        {/* Package cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[32px] px-[80px]">
          {config.packages.map((pck, index) => {
            return <PackageCard key={index} {...pck} />;
          })}
        </div>

        {/* Try Momentum */}
        <VStack
          mx={"48px"}
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
        >
          <VStack gap={"24px"}>
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
            <Box fontWeight={"normal"} fontSize={"48px"}>
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
          <WhiteButton className="h-[44px] mt-[48px]">
            <Box
              color={"#1C1C1C"}
              fontWeight={"600"}
              fontSize={"16px"}
              mr={"122px"}
              lineHeight={"24px"}
            >
              {config.tryMomentum.button}
            </Box>
            <ChevronRightIcon />
          </WhiteButton>
          <Box
            mt={"19px"}
            lineHeight={"20px"}
            color={"#898989"}
            fontSize={"14px"}
            fontWeight={"normal"}
          >
            {config.tryMomentum.footer}
          </Box>
        </VStack>

        <VStack pos={"relative"}>
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
          <div className="mt-[104px]"></div>
          <Image
            src={config.images.botImageT}
            alt="Momentum Bot"
            width={521}
            height={535}
            className="z-[1]"
          ></Image>
          <Box
            bgImage="linear-gradient(180deg, #0B0B0B, transparent)"
            bgClip="text"
            fontSize={"209.33px"}
            lineHeight={"156px"}
            letterSpacing={"-2%"}
            bottom={"100px"}
            pos={"absolute"}
            fontWeight={900}
          >
            {config.name}
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
            zIndex={1}
          >
            {config.about.first}
            <div className="px-[5px]">{config.about.icon}</div>
            {config.about.last}
          </Flex>
        </VStack>
      </main>

      <Footer />
    </div>
  );
};

const config = {
  images: {
    grid: "url(/images/Grid.png)",
    botImage: "/images/MomentumBot.png",
    botImageT: "/images/MomentumBot_T.png",
    starBackground: "url(/images/StarBackground.SVG)",
  },
  name: "MOMENTUM",
  hero: {
    title: "Catch attention and gain momentum against the market",
    description:
      "Designed to elevate token visibility and draw in more investors, Momentum Labs drivers higher trading volumes and boost your ranking on all relevant platforms",
    footerTitle: "Built for forward projects",
    footerDescription:
      "We offer toolkits to help you make an impact and set a new standard.",
  },
  cards: {
    volume: {
      title: "Volume Bot (Solana)",
      description:
        'Need a volume boost to elevate the attention of your token? Momentum Labs has you covered. By running our transactions as a Jito Bundle, they happen in the same block, minimizing price impact and protecting you from "farmers" while driving up the volume.',
      background: "url(/images/VolumeCardBG.png)",
    },
    boost: {
      title: "BOOST (combined Volume + Ranking)",
      description:
        "BOOST is crafted for the pushing existing tokens to new levels, combining our effective Ranking Bot with our Volume Bot allowing all crucial metrics to get significantly pushed with the best value for your money available.",
      background: "url(/images/BoostCardBG.svg)",
    },
    ranking: {
      background: "url(/images/StarBackground3.svg)",
      title: "Ranking Bot (Solana)",
      description:
        "Fast Lane to Top Rankings. The Momentum Labs Rank Boost is designed to supercharge your token’s metrics and propel its ranking on Dex Screener by enhancing key factors like:",
    },
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
      title: "Momentum Titan",
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
        {
          Icon: <PlusCircleIcon />,
          name: "Volume Bot (on Launch Platform + after Migration for first X Hours)",
        },
        {
          Icon: <CoinsIcon />,
          name: "Smart Profit",
        },
      ],
      isMain: true,
    },
  ],
  launch: {
    title: "Ready to launch your token?",
    description:
      "Momentum Labs is your key to boosting all crucial metrics to increase your chance for success. With powerful tools to pump your numbers and skyrocket your ranking, we’ll help you take your token launch to the next level!",
    button: "Available for Moonshot & Pump.fun",
  },
  tryMomentum: {
    header: "Try Momentum",
    title: "Still not sure?",
    description: "Try Momentum and see the difference with only",
    button: "Try Momentum now",
    solanaIcon: <SolanaIcon />,
    footer: "*Volume X (no Fees taken - available only once per token)",
  },
  unlock: {
    title: "Unlock the full potential of Momentum Labs",
    description:
      "Now seamlessly integrated into Telegram. Our user-friendly bot simplifies the process of managing and scaling your Solana project. Want to accelerate your project's growth?",
  },
  about: {
    first: "Made with",
    icon: <HeartIcon />,
    last: "by duoversestudio.com",
  },
};

const styleConfig = {
  radialGradientText: {
    bgGradient: "radial-gradient(#FFFFFF, #A2A2A2, #FFFFFF)",
    bgClip: "text",
    color: "transparent",
  },
};

export default Home;

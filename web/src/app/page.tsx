import Image from "next/image";
import { Box, Flex, VStack } from "@chakra-ui/react";

import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";
import { AccessBotButton, NoBgButton, WhiteButton } from "@/components/Buttons";
import { RankingCard, IntroductionCard, PackageCard } from "@/components/Cards";
import {
  TargetIcon,
  RocketIcon,
  TrendUpIcon,
  PlusCircleIcon,
  CoinsIcon,
  ChevronRightIcon,
  HeartIcon,
  SolanaIcon,
} from "@/components/Icons";

const Home = () => {
  return (
    <div className="w-full relative justify-center bg-black">
      <Header />

      <main className="w-full">
        {/* Hero component */}
        <div className="min-h-[15px] w-full"></div>
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
            <div className="mt-[150px] relative z-[7]">
              <div className="font-medium text-[36px] leading-[44px]  px-[20px]">
                {config.hero.footerTitle}
              </div>
              <div className="font-normal text-[16px] leading-[24px] mt-[24px] text-[#898989] px-[20px]">
                {config.hero.footerDescription}
              </div>
            </div>
            {/* <div className="absolute w-[80%] top-[310px] left-1/2 transform -translate-x-1/2 h-[553px] bg-black backdrop-blur-md rounded-full"></div> */}
          </div>
        </div>

        {/* binary code component */}
        <Box
          width={"full"}
          height={{ base: "200px", md: "392px" }}
          // my={{ lg: "40px" }}
          pos={"relative"}
        >
          <Image fill alt="Binary Code" src={"/images/BinaryCode.svg"}></Image>
        </Box>

        {/* card component */}
        <div className="grid grid-cols-1 md:grid-cols-2 px-[12px] md:px-[48px] gap-[18px]">
          <IntroductionCard
            title={config.cards.volume.title}
            description={config.cards.volume.description}
            bgImage={config.cards.volume.background}
            bgSize={"cover"}
            bgPos={"right"}
          />
          <IntroductionCard
            // bgImageUrl={config.images.grid}
            title={config.cards.boost.title}
            description={config.cards.boost.description}
            bgImage={config.cards.boost.background}
            bgSize={"cover"}
            bgPos={"right"}
          />
        </div>
        <div className="px-[12px] md:px-[48px] mt-[18px]">
          <RankingCard />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 px-[12px] md:px-[48px] gap-[18px] mt-[18px]">
          <IntroductionCard
            title={config.cards.smartProfit.title}
            description={config.cards.smartProfit.description}
            bgImage={config.cards.smartProfit.background}
            bgSize={"cover"}
            bgPos={"right"}
          />
          <IntroductionCard
            title={config.cards.pricePush.title}
            description={config.cards.pricePush.description}
            bgImage={config.cards.pricePush.background}
            bgSize={"cover"}
            bgPos={"right"}
          />
        </div>

        {/* Ready to launch your token */}
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

        {/* Try Momentum */}
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
          <WhiteButton className="h-[44px] mt-[48px]">
            <Box
              color={"#1C1C1C"}
              fontWeight={"600"}
              fontSize={"16px"}
              mr={{ base: "10px", md: "122px" }}
              lineHeight={"24px"}
            >
              {config.tryMomentum.button}
            </Box>
            <ChevronRightIcon />
          </WhiteButton>
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
      </main>
      <Footer />
    </div>
  );
};

const config = {
  images: {
    momentum: "/images/MOMENTUM.svg",
    grid: "url(/images/Grid.png)",
    botImage: "/images/MomentumBot.svg",
    botImageS: "/images/MomentumBot_s.svg",
    starBackground: "url(/images/StarBackground.png)",
    heroMask: "url(/images/Backdrop.svg)",
  },
  name: "MOMENTUM",
  hero: {
    title: "Catch attention and gain momentum against the market",
    description:
      "Designed to elevate token visibility and draw in more investors, Momentum Labs drivers higher trading volumes and boost your ranking on all relevant platforms",
    footerTitle: "Built for forward projects",
    footerDescription:
      "We offer toolkits to help you make an impact and set a new standard.",
    rectanglesBg: "url(/images/Rectangles.svg)",
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
      background: "url(/images/BoostCardBG.png)",
    },
    ranking: {
      background: "url(/images/StarBackground3.png)",
      title: "Ranking Bot (Solana)",
      description:
        "Fast Lane to Top Rankings. The Momentum Labs Rank Boost is designed to supercharge your token’s metrics and propel its ranking on Dex Screener by enhancing key factors like:",
    },
    smartProfit: {
      background: "url(/images/SmartProfit.svg)",
      title: "Smart Profit",
      description:
        "BOOST is crafted for the pushing existing tokens to new levels, combining our effective Ranking Bot with our Volume Bot allowing all crucial metrics to get significantly pushed with the best value for your money available.",
    },
    pricePush: {
      background: "url(/images/PricePush.svg)",
      title: "Price Push",
      description:
        "Need a volume boost to elevate the attention of your token? Momentum Labs has you covered. ",
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
  launch: {
    title: "Ready to launch your token?",
    description:
      "Momentum Labs is your key to boosting all crucial metrics to increase your chance for success. With powerful tools to pump your numbers and skyrocket your ranking, we’ll help you take your token launch to the next level!",
    button: "Available for Moonshot & Pump.fun",
    background: "url(/images/LaunchBG.svg)",
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
    background: "url(/images/FooterBackground.svg)",
  },
  about: {
    first: "Made with",
    icon: <HeartIcon />,
    last: "by",
    urlText: "duoversestudio.com",
    url: "https://duoversestudio.com",
  },
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

export default Home;

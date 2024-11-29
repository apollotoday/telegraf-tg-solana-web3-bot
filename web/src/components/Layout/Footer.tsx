"use client";

import { useCallback } from "react";
import { Flex, Box } from "@chakra-ui/react";
import { Logo } from "./Logo";
import { HeaderMenu } from "../menu";
import {
  TelegramIcon,
  DiscordIcon,
  ChevronRightIcon,
} from "@/components/Icons";
import { WhiteButton } from "../Buttons";

const Footer = () => {
  const handleButtonClick = useCallback(() => {
    console.log("button is clicked");
  }, []);

  return (
    <>
      <footer className="hidden md:flex absolute bottom-[63px] left-1/2 transform -translate-x-1/2 max-w-[1344px] w-[93%] h-[76px] rounded-[24px] border border-gray-90 px-[32px] items-center justify-between bg-[#000000] z-[3]">
        <Logo />
        <HeaderMenu />
        <Flex align={"center"}>
          <div>
            <TelegramIcon />
          </div>
          <div className="ml-[8px]">
            <DiscordIcon />
          </div>
          <WhiteButton ml={"32px"} onClick={handleButtonClick}>
            <Flex
              justifyContent={"space-between"}
              alignItems={"center"}
              width={"full"}
            >
              <Box
                color={"#1C1C1C"}
                fontWeight={"600"}
                fontSize={"16px"}
                mr={"10px"}
              >
                Access Our Bot
              </Box>
              <ChevronRightIcon />
            </Flex>
          </WhiteButton>
        </Flex>
      </footer>
      <footer className="block md:hidden">
        <Flex
          className="justify-between items-center h-[76px] bg-[#000000] px-[16px] fixed bottom-0 left-0 right-0 z-[3]"
          align={"center"}
        >
          <Logo isSmall={true} />
          <Flex align={"center"}>
            <div>
              <TelegramIcon />
            </div>
            <div className="ml-[16px]">
              <DiscordIcon />
            </div>
          </Flex>
        </Flex>
      </footer>
    </>
  );
};

export default Footer;

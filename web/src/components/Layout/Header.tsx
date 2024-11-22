"use client";

import { useCallback } from "react";
import { Logo } from "./Logo";
import { HeaderMenu } from "../menu";
import { Flex, Box } from "@chakra-ui/react";
import {
  TelegramIcon,
  DiscordIcon,
  ChevronRightIcon,
} from "@/components/Icons";
import { WhiteButton } from "../Buttons";

const Header = () => {
  const handleButtonClick = useCallback(() => {
    console.log("handle button is clicked");
  }, []);

  return (
    <header className="sticky top-0 w-full z-[50] h-[76px] border border-gray-90 flex justify-center gap-[100px] items-center">
      <Logo />
      <HeaderMenu />
      <Flex align={"center"}>
        <WhiteButton mr={"32px"} onClick={handleButtonClick}>
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
        <div>
          <TelegramIcon />
        </div>
        <div className="ml-[8px]">
          <DiscordIcon />
        </div>
      </Flex>
    </header>
  );
};

export default Header;

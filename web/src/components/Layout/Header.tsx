"use client";

import { useState, useCallback } from "react";
import { Logo } from "./Logo";
import { HeaderMenu } from "../menu";
import { Flex, Box, Center } from "@chakra-ui/react";
import { Menu } from "@/config/menu";
import Link from "next/link";
import {
  TelegramIcon,
  DiscordIcon,
  ChevronRightIcon,
  HamburgerIcon,
  CloseIcon,
} from "@/components/Icons";
import { WhiteButton, AccessBotButton } from "@/components/Buttons";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  const handleButtonClick = useCallback(() => {
    console.log("handle button is clicked");
  }, []);

  const toggleMenu = useCallback(() => {
    console.log("menu button is clicked", isMenuOpen);
    setIsMenuOpen((prev) => !prev);
  }, [isMenuOpen]);

  return (
    <>
      <header className="hidden md:flex w-full h-[76px] border border-gray-90 justify-center gap-[10px] md:gap-[10px] lg:gap-[40px] xl:gap-[100px] items-center bg-black z-[100]">
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

      <header className="block md:hidden fixed w-full top-0 left-0 bg-black z-[100]">
        <div className="relative flex justify-between items-center bg-black p-3 z-[70]">
          <Logo />
          <div onClick={toggleMenu}>
            <div
              className={`transition-transform duration-300 ease-in-out ${
                isMenuOpen ? "rotate-180" : "rotate-0"
              }`}
            >
              {isMenuOpen ? <CloseIcon /> : <HamburgerIcon />}
            </div>
          </div>
        </div>
        <div
          className={`absolute top-[0px] mt-[54px] left-0 w-full bg-black transition-transform duration-300 ease-in-out z-[50] ${
            isMenuOpen
              ? "transform translate-y-0"
              : "transform -translate-y-full"
          }`}
        >
          <div className="bg-gray-black pt-[16px] pb-[40px]">
            <Flex
              gap={"8px"}
              direction={"column"}
              className="text-[14px] leading-[20px] font-normal text-[#727272]"
            >
              {Menu.map((list) => {
                return (
                  <Center key={list.name} className="p-[10px]">
                    <Link href={list.link} className="cursor-pointer">
                      {list.name}
                    </Link>
                  </Center>
                );
              })}
            </Flex>
            <Center mt={"32px"}>
              <AccessBotButton />
            </Center>
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;

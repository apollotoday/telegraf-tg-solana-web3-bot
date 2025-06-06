import Link from "next/link";
import { Flex, Box } from "@chakra-ui/react";
import { Logo } from "@/components/Logo/Logo";
import { HeaderMenu } from "@/components/menu";
import { Menu } from "@/config/menu";
import { TelegramIcon, DiscordIcon } from "@/components/Icons";
import { ComingSoonButton } from "@/components/Buttons";

const Footer = () => {
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
          <ComingSoonButton ml={"32px"} />
        </Flex>
      </footer>
      <footer className="block md:hidden pt-[16px] border-t border-t-[#1C1C1C]">
        <Flex
          className="justify-between items-center bg-[#000000] px-[32px] z-[3]"
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

        <Flex
          gap={"8px"}
          direction={"column"}
          className="text-[14px] leading-[20px] font-normal text-[#727272] mt-[32px] px-[32px]"
        >
          {Menu.map((list) => {
            return (
              <Box key={list.name} className="p-[10px]">
                <Link href={list.link} className="cursor-pointer">
                  {list.name}
                </Link>
              </Box>
            );
          })}
        </Flex>
        <Box mt={"32px"} mx={"32px"}>
          <ComingSoonButton w={"100%"} />
        </Box>
      </footer>
    </>
  );
};

export default Footer;

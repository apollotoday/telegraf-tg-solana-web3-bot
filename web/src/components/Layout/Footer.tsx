import { Logo } from "./Logo";
import { Flex, Box } from "@chakra-ui/react";
import { HeaderMenu } from "../menu";
import {
  TelegramIcon,
  DiscordIcon,
  ChevronRightIcon,
} from "@/components/Icons";
import { WhiteButton } from "../Buttons";

const Footer = () => {
  return (
    <footer className="absolute bottom-[63px] left-1/2 transform -translate-x-1/2 max-w-[1344px] w-[93%] h-[76px] rounded-[24px] border border-gray-90 px-[32px] flex items-center justify-between">
      <Logo />
      <HeaderMenu />
      <Flex align={"center"}>
        <div>
          <TelegramIcon />
        </div>
        <div className="ml-[8px]">
          <DiscordIcon />
        </div>
        <WhiteButton ml={"32px"}>
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
  );
};

export default Footer;

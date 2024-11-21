import { Logo } from "./Logo";
import { Flex } from "@chakra-ui/react";
import { HeaderMenu } from "../menu";

const Footer = () => {
  return (
    <footer className="absolute bottom-[63px] left-1/2 transform -translate-x-1/2 max-w-[1344px] w-[93%] h-[76px] rounded-[24px] border border-gray-90 px-[32px] flex items-center justify-between">
      <Logo />
      <HeaderMenu />
      <Flex></Flex>
    </footer>
  );
};

export default Footer;

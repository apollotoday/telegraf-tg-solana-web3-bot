import { LogoIcon } from "@/components/Icons";
import { Box, Flex } from "@chakra-ui/react";

export const Logo = () => {
  return (
    <Flex align={"center"} flex={"none"}>
      <LogoIcon />
      <Box ml={"10px"} fontWeight={"600"} fontSize={"23px"} lineHeight={"30px"}>
        Momentum Labs
      </Box>
    </Flex>
  );
};

export const SmallLogo = () => {
  return (
    <Flex>
      <LogoIcon />
    </Flex>
  );
};

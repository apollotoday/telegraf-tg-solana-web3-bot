import { LogoIcon } from "@/components/Icons";
import { Box, Flex } from "@chakra-ui/react";

type LogoProps = {
  isSmall?: boolean;
};

export const Logo = ({ isSmall = false }: LogoProps) => {
  return (
    <Flex align={"center"} flex={"none"}>
      <LogoIcon width={isSmall ? 25 : 35} height={isSmall ? 17 : 23} />
      <Box
        ml={"10px"}
        fontWeight={"600"}
        fontSize={isSmall ? "17px" : "23px"}
        lineHeight={isSmall ? "23px" : "30px"}
      >
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

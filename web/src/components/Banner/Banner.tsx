"use client";

import { Box, Flex } from "@chakra-ui/react";
import { NoBgButton } from "@/components/Buttons";
import { ArrowUpRightIcon } from "@/components/Icons";

const Banner = () => {
  return (
    <Box
      pos={"relative"}
      zIndex={105}
      height={"56px"}
      bg={
        "linear-gradient(90deg, #373737 0%, #141414 33%, #414141 51%, #252525 75%, #0E0C0F 100%)"
      }
      color={"white"}
    >
      <Flex
        justifyContent={"space-between"}
        alignItems={"center"}
        h={"100%"}
        w={"90%"}
        mx={"auto"}
      >
        <Box fontSize={{ base: "14px" }}>
          Sign up for Early Access. Beta coming soon!
        </Box>
        <NoBgButton>
          <Box>Sign Up</Box>
          <ArrowUpRightIcon />
        </NoBgButton>
      </Flex>
    </Box>
  );
};

export default Banner;

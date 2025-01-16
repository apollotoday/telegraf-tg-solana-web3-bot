"use client";

import { Box, VStack } from "@chakra-ui/react";

// import { ChevronRightIcon } from "@/components/Icons";
import JoinTheWaitlist from "@/components/Buttons/JoinTheWaitlist";

const SignUpSection = () => {
  return (
    <VStack
      id={"early-access"}
      scrollMarginTop={"30vh"}
      mx={{ base: "12px", md: "48px" }}
      mt={{ md: "47px" }}
      px={"24px"}
      bgColor={"#000000"}
      bgImage={config.images.starBackground}
      bgSize={"cover"}
      bgPos={"center"}
      border={"1px solid #202020"}
      borderRadius={"24px"}
      h={"460px"}
      direction={"column"}
      justifyContent={"center"}
      textAlign={"center"}
    >
      <Box fontWeight={"normal"} fontSize={{ base: "30px", md: "48px" }}>
        {config.title}
      </Box>
      <Box
        fontWeight={"normal"}
        fontSize={"18px"}
        lineHeight={"24px"}
        color={"#898989"}
        mt={"24px"}
      >
        {config.description}
      </Box>
      {/* <Flex
        borderRadius={"100px"}
        mt={"24px"}
        bg={"white"}
        px={"24px"}
        alignItems={"center"}
      >
        <Box color={"#000000"}>{config.singupText}</Box>
        <Input
          w={{ base: "100px", md: "200px" }}
          placeholder=""
          variant={"flushed"}
          mx={"10px"}
          color={"black"}
        />
        <ChevronRightIcon />
      </Flex> */}
      <div className="mt-[24px]" />
      <JoinTheWaitlist />
    </VStack>
  );
};

const config = {
  images: {
    starBackground: "url(/images/StarBackground.png)",
  },
  title: "Sign Up for Early Beta-Acess",
  description:
    "Be one of the first testers, and get all development updates in your inbox.",
  singupText: "Your E-Mail:",
};

export default SignUpSection;

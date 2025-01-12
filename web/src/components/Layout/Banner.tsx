import { Box, Flex } from "@chakra-ui/react";
import { WhiteButton } from "../Buttons";

const Banner = () => {
  return (
    <Box
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
        <Box>We&apos;re Hiring! Join Momentum Labs Team Today</Box>
        <WhiteButton
          ml={"100px"}
          h={"32px"}
          fontSize={"14px"}
          fontWeight={"medium"}
          TextComponent={() => <Box>Apply Now</Box>}
        />
      </Flex>
    </Box>
  );
};

export default Banner;

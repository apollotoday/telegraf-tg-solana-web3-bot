"use client";

import { useState } from "react";
import { Box, Flex, VStack } from "@chakra-ui/react";
import { GetStartedButton } from "@/components/Buttons";

type PackageCardTypes = {
  title?: string;
  type?: string;
  description?: string;
  supports?: Array<{
    Icon: JSX.Element;
    name: string;
  }>;
};

const PackageCard = ({
  title,
  type,
  description,
  supports,
}: PackageCardTypes) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Box
      p={"1px"}
      bg={
        isHovered
          ? "linear-gradient(180deg, #CFC9D6 0%,#000000 50%, #8AB8F1 100%)"
          : "#202020"
      }
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      borderRadius={"24px"}
      textAlign={"left"}
    >
      <VStack
        w={"100%"}
        h={"100%"}
        p={"32px"}
        bg={
          isHovered
            ? "linear-gradient(180deg, #010002 0%, #202020 38%, #000000 100%)"
            : "#000000"
        }
        minH={"572px"}
        alignItems={"flex-start"}
        gap={"24px"}
        borderRadius={"24px"}
      >
        <Box
          p={"1px"}
          borderRadius={"100px"}
          bg={
            isHovered
              ? "linear-gradient(90deg, #FFFFFF 0%,#3CE4FA 41%, #8F82BA 100%)"
              : "#151515"
          }
        >
          <Box
            p={"8px 32px"}
            bgColor={"#151515"}
            borderRadius={"100px"}
            color={"#A7A7A7"}
            fontWeight={500}
            fontSize={"16px"}
            lineHeight={"24px"}
          >
            {title}
          </Box>
        </Box>

        <Box fontWeight={500} fontSize={"24px"} lineHeight={"32px"}>
          {type}
        </Box>
        <Box fontWeight={400} fontSize={"16px"} color={"#898989"}>
          {description}
        </Box>
        <Flex className="gap-[24px]" flexDir={"column"} mb={"24px"}>
          {supports?.map((support, index) => {
            return (
              <Flex
                key={index}
                alignItems={"center"}
                gap={"24px"}
                textAlign={"left"}
              >
                <div>{support.Icon}</div>
                <Box
                  fontWeight={400}
                  fontSize={"16px"}
                  lineHeight={"24px"}
                  color={"white"}
                >
                  {support.name}
                </Box>
              </Flex>
            );
          })}
        </Flex>
        <GetStartedButton isMain={isHovered} mt={"auto"} />
      </VStack>
    </Box>
  );
};

export default PackageCard;

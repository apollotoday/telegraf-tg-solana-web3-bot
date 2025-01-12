"use client";

import React, { useState } from "react";
import { Box, Button, ButtonProps, Flex } from "@chakra-ui/react";
import { ChevronRightIcon } from "@/components/Icons";

type WhiteButtonProps = ButtonProps & {
  width?: string;
  height?: string;
  TextComponent?: React.ElementType;
  LeftIcon?: React.ElementType;
  RightIcon?: React.ElementType;
};

export const WhiteButton: React.FC<WhiteButtonProps> = ({
  width,
  height,
  LeftIcon,
  TextComponent,
  RightIcon,
  ...props
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Button
      w={width}
      h={height}
      px={"24px"}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      border={isHovered ? "1px solid #A5A5A5" : "1px solid white"}
      borderRadius={"100px"}
      bg={
        isHovered
          ? "linear-gradient(90deg, #0F0E0E -6%, #494949 45%, #0C0909 83%, #000000 100%)"
          : "white"
      }
      color={isHovered ? "white" : "black"}
      boxShadow="inset 0px 2px 10px #CACACAC9"
      {...props}
    >
      {LeftIcon && <LeftIcon color={isHovered ? "white" : "black"} />}
      {TextComponent && <TextComponent />}
      {RightIcon && <RightIcon color={isHovered ? "white" : "black"} />}
    </Button>
  );
};

type NoBgButtonProps = ButtonProps & {
  width?: string;
  height?: string;
};
export const NoBgButton: React.FC<NoBgButtonProps> = ({
  width,
  height,
  children,
  ...props
}) => {
  return (
    <Button
      w={width}
      h={height}
      px={"24px"}
      bgColor={"transparent"}
      _hover={{ border: "1px solid #898989", borderRadius: "30px" }}
      {...props}
    >
      {children}
    </Button>
  );
};

type AccessBotButtonTypes = ButtonProps & {
  text?: string;
};

export const AccessBotButton = ({
  text = "Access Our Bot",
  ...props
}: AccessBotButtonTypes) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Button
      w={"194px"}
      p={"1px"}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      border={isHovered ? "1px solid #A5A5A5" : "1px solid white"}
      borderRadius={"100px"}
      bg={
        isHovered
          ? "linear-gradient(90deg, #0F0E0E -6%, #494949 45%, #0C0909 83%, #000000 100%)"
          : "white"
      }
      color={isHovered ? "white" : "black"}
      boxShadow="inset 0px 2px 10px #CACACAC9"
      {...props}
    >
      <Box fontWeight={"600"} fontSize={"16px"} mr={"10px"}>
        {text}
      </Box>
      <ChevronRightIcon color={isHovered ? "white" : "black"} />
    </Button>
  );
};

type GetStartedButtonTypes = ButtonProps & {
  isMain?: boolean;
};

export const GetStartedButton = ({
  isMain = false,
  ...props
}: GetStartedButtonTypes) => {
  return (
    <Button
      w={"full"}
      h={"44px"}
      px={"24px"}
      bgColor={isMain ? "white" : "black"}
      borderRadius={"100px"}
      border={"1px solid #202020"}
      {...props}
    >
      <Flex
        flexDir={"row"}
        justifyContent={"space-between"}
        w={"full"}
        alignItems={"center"}
      >
        <Box
          color={isMain ? "black" : "white"}
          fontWeight={600}
          lineHeight={"24px"}
          fontSize={"16px"}
        >
          Get Started
        </Box>
        <ChevronRightIcon color={isMain ? "black" : "white"} />
      </Flex>
    </Button>
  );
};

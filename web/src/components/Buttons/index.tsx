import { Box, Button, ButtonProps, Flex } from "@chakra-ui/react";
import { ChevronRightIcon } from "@/components/Icons";

type WhiteButtonProps = ButtonProps & {
  width?: string;
  height?: string;
};

export const WhiteButton: React.FC<WhiteButtonProps> = ({
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
      bgColor={"white"}
      borderRadius={"100px"}
      {...props}
    >
      {children}
    </Button>
  );
};

export const NoBgButton: React.FC<WhiteButtonProps> = ({
  width,
  height,
  children,
  ...props
}) => {
  return (
    <Button w={width} h={height} px={"24px"} bgColor={"transparent"} {...props}>
      {children}
    </Button>
  );
};

type BlackButtonProps = ButtonProps & {
  width?: string;
  height?: string;
};

export const BlackButton: React.FC<BlackButtonProps> = ({
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
      bgColor={"black"}
      borderRadius={"100px"}
      {...props}
    >
      {children}
    </Button>
  );
};

type AccessBotButtonTypes = ButtonProps & {};

export const AccessBotButton = ({ ...props }: AccessBotButtonTypes) => {
  return (
    <Button
      w={"194px"}
      px={"24px"}
      bgColor={"white"}
      border={"1px solid black"}
      borderRadius={"100px"}
      {...props}
    >
      <Box color={"#1C1C1C"} fontWeight={"600"} fontSize={"16px"} mr={"10px"}>
        Access Our Bot
      </Box>
      <ChevronRightIcon />
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

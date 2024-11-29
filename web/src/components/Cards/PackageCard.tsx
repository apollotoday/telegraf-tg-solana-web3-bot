import { Box, Flex } from "@chakra-ui/react";
import { GetStartedButton } from "@/components/Buttons";

type PackageCardTypes = {
  title?: string;
  type?: string;
  description?: string;
  supports?: Array<{
    Icon: JSX.Element;
    name: string;
  }>;
  isMain?: boolean;
};

const PackageCard = ({
  title,
  type,
  description,
  supports,
  isMain,
}: PackageCardTypes) => {
  return (
    <Flex
      p={"32px"}
      flexDirection={"column"}
      gap={"24px"}
      border={"1px solid #202020"}
      borderRadius={"24px"}
    >
      <Box
        display={"inline-block"}
        p={"8px 32px"}
        bgColor={"#151515"}
        borderRadius={"161px"}
        color={"#A7A7A7"}
        fontWeight={500}
        fontSize={"16px"}
        lineHeight={"24px"}
        textAlign={"center"}
      >
        {title}
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
            <Flex key={index} alignItems={"center"} gap={"24px"}>
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
      <GetStartedButton isMain={isMain} mt={"auto"} />
    </Flex>
  );
};

export default PackageCard;

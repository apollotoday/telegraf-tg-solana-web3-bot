import { Box, BoxProps } from "@chakra-ui/react";
import { AccessBotButton } from "@/components/Buttons";

type BoostCardType = BoxProps & {
  bgImageUrl: string;
  title: string;
  description: string;
};

const BoostCard = ({
  bgImageUrl,
  title,
  description,
  ...props
}: BoostCardType) => {
  return (
    <Box
      display={"flex"}
      flexDirection={"column"}
      border={"1px solid #202020"}
      borderRadius={"24px"}
      p={{ base: "16px", md: "32px" }}
      bgImage={bgImageUrl}
      bgSize={"cover"}
      height={"443px"}
      {...props}
    >
      <div className="font-medium text-[20px] leading-[30px]">{title}</div>
      <div className="max-w-[334px] font-nomal text-[14px] leading-[24px] text-[#898989] mt-[8px]">
        {description}
      </div>
      <AccessBotButton mt={"auto"} />
    </Box>
  );
};

export default BoostCard;

import { Box, BoxProps } from "@chakra-ui/react";
import { AccessBotButton } from "@/components/Buttons";

type IntroductionCardType = BoxProps & {
  title: string;
  description: string;
  cardType?: string;
};

const IntroductionCard = ({
  title,
  description,
  cardType = "coming-soon",
  children,
  ...props
}: IntroductionCardType) => {
  return (
    <Box
      display={"flex"}
      flexDirection={"column"}
      border={"1px solid #202020"}
      borderRadius={"24px"}
      p={{ base: "16px", md: "32px" }}
      height={"443px"}
      pos={"relative"}
      {...props}
    >
      <div className="font-medium text-[30px] leading-[30px]">{title}</div>
      <div className="max-w-[334px] font-nomal text-[14px] leading-[24px] text-[#898989] mt-[8px]">
        {description}
      </div>
      {cardType === "coming-soon" && <AccessBotButton mt={"auto"} />}
      {cardType === "get-in-touch-team" && (
        <AccessBotButton text={"Get in touch with our team"} mt={"auto"} />
      )}
      {children}
    </Box>
  );
};

export default IntroductionCard;

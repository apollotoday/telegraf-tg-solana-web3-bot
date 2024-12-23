import { Button, ButtonProps } from "@chakra-ui/react";

type WhiteButtonProps = ButtonProps & {
  width?: string;
  height?: string;
  onClick?: () => void;
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
      // onClick={() => onClick}
      bgColor={"white"}
      borderRadius={"100px"}
      {...props}
    >
      {children}
    </Button>
  );
};

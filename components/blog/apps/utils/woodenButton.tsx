import { Box, Spinner, Text, VStack } from "@chakra-ui/react";
import useResponsive from "../commonHooks/useResponsive";

interface WoodenButtonProps {
  action?: () => void;
  label: string;
  size: number;
  width?: number | string;
  isLoading?: boolean;
}

const WoodenButton = ({
  action,
  label,
  size,
  width,
  isLoading,
}: WoodenButtonProps) => {
  const { lg } = useResponsive();
  return (
    <Box
      bg="url(/images/Wood\ Panel.png)"
      backgroundSize="cover"
      borderRadius={10}
      px={2}
      onClick={action}
      style={{
        cursor: "pointer",
      }}
    >
      {isLoading ? (
        <Spinner />
      ) : (
          <Text
            w={lg ? "fit-content" : !width ? "310px" : width}
            h={"15px"}
            align={"center"}
            mt={lg ? 2 : 1}
            mb={lg ? 2 : 3}
            fontSize={lg ? "medium" : size}
            color="#683309"
            className="font-face-kg"
          >
            {label}
          </Text>
      )}
    </Box>
  );
};
export default WoodenButton;

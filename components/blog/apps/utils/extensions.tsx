import { HStack, Link, Text, Tooltip } from "@chakra-ui/react";
import useResponsive from "../commonHooks/useResponsive";

export const Extensions = {
  None: 0,
  TransferFee: 1,
  PermanentDelegate: 2,
  TransferHook: 4,
};

export const ShowExtensions = ({
  extension_flag,
}: {
  extension_flag: number;
}) => {
  const { lg } = useResponsive();
  return (
    <HStack justify="center">
      {extension_flag && (
        <>
          {(extension_flag & Extensions.TransferFee) > 0 && (
            <Tooltip
              label="Transfer Fee"
              hasArrow
              fontSize="large"
              offset={[0, 10]}
            >
              <div
                style={{
                  height: "20px",
                  width: "20px",
                  backgroundColor: "#7BFF70",
                  borderRadius: "50%",
                }}
              />
            </Tooltip>
          )}
          {(extension_flag & Extensions.PermanentDelegate) > 0 && (
            <Tooltip
              label="Permanent Delegate"
              hasArrow
              fontSize="large"
              offset={[0, 10]}
            >
              <div
                style={{
                  height: "20px",
                  width: "20px",
                  backgroundColor: "#FF7979",
                  borderRadius: "50%",
                }}
              />
            </Tooltip>
          )}
          {(extension_flag & Extensions.TransferHook) > 0 && (
            <Tooltip
              label="Transfer Hook"
              hasArrow
              fontSize="large"
              offset={[0, 10]}
            >
              <div
                style={{
                  height: "20px",
                  width: "20px",
                  backgroundColor: "#72AAFF",
                  borderRadius: "50%",
                }}
              />
            </Tooltip>
          )}
        </>
      )}
    </HStack>
  );
};

export default ShowExtensions;

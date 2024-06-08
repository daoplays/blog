import {
  VStack,
  HStack,
  Input,
  InputRightElement,
  Text,
  InputGroup,
  Button,
} from "@chakra-ui/react";
import { MintData, bignum_to_num } from "../../../blog/apps/common";
import { AMMData } from "../../../blog/apps/shorts/state";
import Image from "next/image";
import { calculateFee, getTransferFeeConfig } from "@solana/spl-token";

function formatPrice(price: number, decimals: number) {
  let priceString =
    price <= 1e-3 ? price.toExponential(3) : price.toFixed(decimals);

  return priceString;
}

const LongPanel = ({
  base_data,
  quote_data,
  amm,
  long_amount,
  deposit_amount,
  placingOrder,
  connected,
  setShortAmount,
  setDepositAmount,
  EnterShort,
  handleConnectWallet,
}: {
  base_data: MintData;
  quote_data: MintData;
  amm: AMMData;
  long_amount: number;
  deposit_amount: number;
  placingOrder: boolean;
  connected: boolean;
  setShortAmount: any;
  setDepositAmount: any;
  EnterShort: any;
  handleConnectWallet: any;
}) => {
  let base_balance = bignum_to_num(amm.amm_base_amount);
  let quote_balance = bignum_to_num(amm.amm_quote_amount);

  let base_amount = long_amount * Math.pow(10, base_data.mint.decimals);

  let quote_amount =
    (base_amount * quote_balance) /
    (base_balance - base_amount) /
    Math.pow(10, quote_data.mint.decimals);

  let quote_input = quote_amount / (1 - amm.fee / 100 / 100);

  let raw_deposit_amount =
    deposit_amount * Math.pow(10, base_data.mint.decimals);

  let total_base_fee = 0;
  let transfer_fee_config = getTransferFeeConfig(base_data.mint);
  if (transfer_fee_config !== null) {
    total_base_fee += Number(
      calculateFee(
        transfer_fee_config.newerTransferFee,
        BigInt(raw_deposit_amount)
      )
    );
  }

  let deposit =
    (raw_deposit_amount - total_base_fee) /
    Math.pow(10, base_data.mint.decimals);
  let liquidation_price = quote_amount / (deposit + long_amount);

  let liquidation_price_string = formatPrice(liquidation_price, 5);

  return (
    <>
      <VStack align="start" w="100%">
        <HStack w="100%" justify="space-between">
          <>
            <Text
              m={0}
              color={"white"}
              fontFamily="ReemKufiRegular"
              fontSize={"medium"}
              opacity={0.5}
            >
              Long:
            </Text>
          </>
        </HStack>

        <>
          <InputGroup size="md">
            <Input
              color="white"
              size="lg"
              borderColor="rgba(134, 142, 150, 0.5)"
              value={long_amount}
              onChange={(e) => {
                setShortAmount(
                  !isNaN(parseFloat(e.target.value)) || e.target.value === ""
                    ? parseFloat(e.target.value)
                    : long_amount
                );
              }}
              type="number"
              min="0"
            />
            <InputRightElement h="100%" w={50}>
              <Image
                src={base_data.icon}
                width={30}
                height={30}
                alt="SOL Icon"
                style={{ borderRadius: "100%" }}
              />
            </InputRightElement>
          </InputGroup>
        </>
      </VStack>

      <>
        <VStack align="start" w="100%">
          <Text
            m={0}
            color={"white"}
            fontFamily="ReemKufiRegular"
            fontSize={"medium"}
            opacity={0.5}
          >
            Deposit:
          </Text>
          <InputGroup size="md">
            <Input
              color="white"
              size="lg"
              borderColor="rgba(134, 142, 150, 0.5)"
              value={deposit_amount}
              onChange={(e) => {
                setDepositAmount(
                  !isNaN(parseFloat(e.target.value)) || e.target.value === ""
                    ? parseFloat(e.target.value)
                    : deposit_amount
                );
              }}
              type="number"
              min="0"
            />
            <InputRightElement h="100%" w={50}>
              <Image
                src={base_data.icon}
                width={30}
                height={30}
                alt=""
                style={{ borderRadius: "100%" }}
              />
            </InputRightElement>
          </InputGroup>
          <Text
            m={0}
            color={"white"}
            fontFamily="ReemKufiRegular"
            fontSize={"medium"}
            opacity={0.5}
          >
            Liquidation Price:
          </Text>
          <InputGroup size="md">
            <Input
              readOnly={true}
              color="white"
              size="lg"
              borderColor="rgba(134, 142, 150, 0.5)"
              value={
                liquidation_price_string === "NaN"
                  ? "0"
                  : liquidation_price_string
              }
              disabled
            />
            <InputRightElement h="100%" w={50}>
              <Image
                src={quote_data.icon}
                width={30}
                height={30}
                alt=""
                style={{ borderRadius: "100%" }}
              />
            </InputRightElement>
          </InputGroup>
        </VStack>
      </>

      <>
        <Button
          mt={2}
          size="lg"
          w="100%"
          px={4}
          py={2}
          bg={"#FF6E6E"}
          isLoading={placingOrder}
          onClick={() => {
            !connected
              ? handleConnectWallet()
              : EnterShort(amm, long_amount, deposit_amount);
          }}
        >
          <Text m={"0 auto"} fontSize="large" fontWeight="semibold">
            {!connected ? "Connect Wallet" : "Enter"}
          </Text>
        </Button>
      </>
    </>
  );
};

export default LongPanel;

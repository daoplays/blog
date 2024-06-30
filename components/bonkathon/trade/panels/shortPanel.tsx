import { VStack, HStack, Input, InputRightElement, Text, InputGroup, Button } from "@chakra-ui/react";
import { MintData } from "../../../blog/apps/common";
import { AMMData } from "../../../blog/apps/shorts/state";
import Image from "next/image";

const ShortPanel = ({
    base_data,
    quote_data,
    amm,
    short_amount,
    deposit_amount,
    liquidation_price_string,
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
    short_amount: number;
    deposit_amount: number;
    liquidation_price_string: string;
    placingOrder: boolean;
    connected: boolean;
    setShortAmount: any;
    setDepositAmount: any;
    EnterShort: any;
    handleConnectWallet: any;
}) => {
    return (
        <>
            <VStack align="start" w="100%">
                <HStack w="100%" justify="space-between">
                    <>
                        <Text m={0} color={"white"} fontFamily="ReemKufiRegular" fontSize={"medium"} opacity={0.5}>
                            Short:
                        </Text>
                    </>
                </HStack>

                <>
                    <InputGroup size="md">
                        <Input
                            color="white"
                            size="lg"
                            borderColor="rgba(134, 142, 150, 0.5)"
                            value={short_amount}
                            onChange={(e) => {
                                setShortAmount(
                                    !isNaN(parseFloat(e.target.value)) || e.target.value === "" ? parseFloat(e.target.value) : short_amount,
                                );
                            }}
                            type="number"
                            min="0"
                        />
                        <InputRightElement h="100%" w={50}>
                            <Image src={base_data.icon} width={30} height={30} alt="SOL Icon" style={{ borderRadius: "100%" }} />
                        </InputRightElement>
                    </InputGroup>
                </>
            </VStack>

            <>
                <VStack align="start" w="100%">
                    <Text m={0} color={"white"} fontFamily="ReemKufiRegular" fontSize={"medium"} opacity={0.5}>
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
                                        : deposit_amount,
                                );
                            }}
                            type="number"
                            min="0"
                        />
                        <InputRightElement h="100%" w={50}>
                            <Image src={quote_data.icon} width={30} height={30} alt="" style={{ borderRadius: "100%" }} />
                        </InputRightElement>
                    </InputGroup>
                    <Text m={0} color={"white"} fontFamily="ReemKufiRegular" fontSize={"medium"} opacity={0.5}>
                        Liquidation Price:
                    </Text>
                    <InputGroup size="md">
                        <Input
                            readOnly={true}
                            color="white"
                            size="lg"
                            borderColor="rgba(134, 142, 150, 0.5)"
                            value={liquidation_price_string === "NaN" ? "0" : liquidation_price_string}
                            disabled
                        />
                        <InputRightElement h="100%" w={50}>
                            <Image src={quote_data.icon} width={30} height={30} alt="" style={{ borderRadius: "100%" }} />
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
                        !connected ? handleConnectWallet() : EnterShort(amm, short_amount, deposit_amount);
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

export default ShortPanel;

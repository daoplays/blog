import { VStack, HStack, Center, Divider, Input, InputRightElement, Text, InputGroup, Button } from "@chakra-ui/react";
import { PanelProps } from "./panelProps";
import Image from "next/image";

const BuyPanel = ({
    selected,
    base_data,
    quote_data,
    amm,
    user_base_balance,
    user_quote_balance,
    sol_amount,
    token_amount,
    order_type,
    base_output_string,
    placingOrder,
    connected,
    setSOLAmount,
    setTokenAmount,
    PlaceMarketOrder,
    handleConnectWallet,
}: PanelProps) => {
    return (
        <>
            <VStack align="start" w="100%">
                <HStack w="100%" justify="space-between">
                    <Text m={0} color={"white"} fontFamily="ReemKufiRegular" fontSize={"medium"} opacity={0.5}>
                        Swap:
                    </Text>

                    <HStack spacing={2}>
                        <Text
                            m={0}
                            color={"white"}
                            fontFamily="ReemKufiRegular"
                            fontSize={"medium"}
                            opacity={0.5}
                            style={{ cursor: "pointer" }}
                            onClick={() => {
                                if (selected === "Buy") {
                                    setSOLAmount(user_quote_balance / Math.pow(10, quote_data.mint.decimals) / 2);
                                }

                                if (selected === "Sell") {
                                    setTokenAmount(user_base_balance / Math.pow(10, base_data.mint.decimals) / 2);
                                }
                            }}
                        >
                            Half
                        </Text>
                        <Center height="15px">
                            <Divider orientation="vertical" opacity={0.25} />
                        </Center>
                        <Text
                            m={0}
                            color={"white"}
                            fontFamily="ReemKufiRegular"
                            fontSize={"medium"}
                            opacity={0.5}
                            style={{ cursor: "pointer" }}
                            onClick={() => {
                                if (selected === "Buy") {
                                    setSOLAmount(user_quote_balance / Math.pow(10, quote_data.mint.decimals));
                                }

                                if (selected === "Sell") {
                                    setTokenAmount(user_base_balance / Math.pow(10, base_data.mint.decimals));
                                }
                            }}
                        >
                            Max
                        </Text>
                    </HStack>
                </HStack>

                <InputGroup size="md">
                    <Input
                        color="white"
                        size="lg"
                        borderColor="rgba(134, 142, 150, 0.5)"
                        value={sol_amount}
                        onChange={(e) => {
                            setSOLAmount(
                                !isNaN(parseFloat(e.target.value)) || e.target.value === "" ? parseFloat(e.target.value) : sol_amount,
                            );
                        }}
                        type="number"
                        min="0"
                    />
                    <InputRightElement h="100%" w={50}>
                        <Image src={quote_data.icon} width={30} height={30} alt="SOL Icon" style={{ borderRadius: "100%" }} />
                    </InputRightElement>
                </InputGroup>
            </VStack>

            <VStack align="start" w="100%">
                <Text m={0} color={"white"} fontFamily="ReemKufiRegular" fontSize={"medium"} opacity={0.5}>
                    For:
                </Text>

                <InputGroup size="md">
                    <Input
                        readOnly={true}
                        color="white"
                        size="lg"
                        borderColor="rgba(134, 142, 150, 0.5)"
                        value={base_output_string === "NaN" ? "0" : base_output_string}
                        disabled
                    />
                    <InputRightElement h="100%" w={50}>
                        <Image src={base_data.icon} width={30} height={30} alt="" style={{ borderRadius: "100%" }} />
                    </InputRightElement>
                </InputGroup>
            </VStack>

            <Button
                mt={2}
                size="lg"
                w="100%"
                px={4}
                py={2}
                bg={selected === "Buy" ? "#83FF81" : "#FF6E6E"}
                isLoading={placingOrder}
                onClick={() => {
                    !connected ? handleConnectWallet() : PlaceMarketOrder(amm, token_amount, sol_amount, 0);
                }}
            >
                <Text m={"0 auto"} fontSize="large" fontWeight="semibold">
                    {!connected ? "Connect Wallet" : "Buy"}
                </Text>
            </Button>
        </>
    );
};

export default BuyPanel;

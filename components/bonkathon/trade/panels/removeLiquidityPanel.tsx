import { VStack, HStack, Center, Divider, Input, InputRightElement, Text, InputGroup, Button } from "@chakra-ui/react";
import { PanelProps } from "./panelProps";
import Image from "next/image";

const RemoveLiquidityPanel = ({
    selected,
    base_data,
    quote_data,
    amm,
    user_base_balance,
    user_quote_balance,
    sol_amount,
    token_amount,
    lp_generated,
    order_type,
    base_output_string,
    quote_output_string,
    updateLiquidityLoading,
    connected,
    setSOLAmount,
    setTokenAmount,
    UpdateLiquidity,
    handleConnectWallet,
}: PanelProps) => {
    return (
        <>
            <VStack align="start" w="100%">
                <HStack w="100%" justify="space-between">
                    <Text m={0} color={"white"} fontFamily="ReemKufiRegular" fontSize={"medium"} opacity={0.5}>
                        Remove:
                    </Text>
                </HStack>

                <InputGroup size="md">
                    <Input
                        color="white"
                        size="lg"
                        borderColor="rgba(134, 142, 150, 0.5)"
                        value={token_amount}
                        onChange={(e) => {
                            setTokenAmount(
                                !isNaN(parseFloat(e.target.value)) || e.target.value === "" ? parseFloat(e.target.value) : token_amount,
                            );
                        }}
                        type="number"
                        min="0"
                    />
                    <InputRightElement h="100%" w={50}>
                        <Text m={0} color={"white"} fontFamily="ReemKufiRegular" fontSize={"medium"} opacity={0.5}>
                            LP
                        </Text>
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
                        value={quote_output_string === "NaN" ? "0" : quote_output_string}
                        disabled
                    />
                    <InputRightElement h="100%" w={50}>
                        <Image src={quote_data.icon} width={30} height={30} alt="SOL Icon" style={{ borderRadius: "100%" }} />
                    </InputRightElement>
                </InputGroup>
            </VStack>

            <>
                <VStack align="start" w="100%">
                    <Text m={0} color={"white"} fontFamily="ReemKufiRegular" fontSize={"medium"} opacity={0.5}>
                        And:
                    </Text>

                    <InputGroup size="md">
                        <Input
                            readOnly={true}
                            color="white"
                            size="lg"
                            borderColor="rgba(134, 142, 150, 0.5)"
                            value={base_output_string}
                            disabled
                        />
                        <InputRightElement h="100%" w={50}>
                            <Image src={base_data.icon} width={30} height={30} alt="" style={{ borderRadius: "100%" }} />
                        </InputRightElement>
                    </InputGroup>
                </VStack>
            </>

            <Button
                mt={2}
                size="lg"
                w="100%"
                px={4}
                py={2}
                bg={"#FF6E6E"}
                isLoading={updateLiquidityLoading}
                onClick={() => {
                    !connected ? handleConnectWallet() : UpdateLiquidity(amm, token_amount, 1);
                }}
            >
                <Text m={"0 auto"} fontSize="large" fontWeight="semibold">
                    {connected ? "Connect Wallet" : "Remove Liquidity"}
                </Text>
            </Button>
        </>
    );
};

export default RemoveLiquidityPanel;

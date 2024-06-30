import { HStack, VStack, Text } from "@chakra-ui/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Dispatch, SetStateAction } from "react";
import { FaChartLine } from "react-icons/fa";
import { IoMdSwap } from "react-icons/io";
import { LuPlusSquare } from "react-icons/lu";
import { PiHouseBold } from "react-icons/pi";
import { Screen } from "../blog/apps/shorts/state";

interface FooterProps {
    setScreen?: Dispatch<SetStateAction<number>>;
    setMobilePageContent?: any;
    setLeftPanel?: any;
    isTradePage: boolean;
}

const Footer = ({ setScreen, setMobilePageContent, setLeftPanel, isTradePage }: FooterProps) => {
    const router = useRouter();
    return (
        <HStack
            bg="url(/images/footer_fill.jpeg)"
            bgSize="cover"
            boxShadow="0px 3px 13px 13px rgba(0, 0, 0, 0.55)"
            position="fixed"
            bottom={0}
            h={16}
            w="100%"
            gap={2}
            justify={!isTradePage ? "space-evenly" : "space-around"}
        >
            <VStack
                style={{ textDecoration: "none", width: "110px" }}
                onClick={() => {
                    router.push("/bonkathon2024");
                    setScreen(Screen.table);
                }}
            >
                <PiHouseBold size={28} color={"#683309"} />
                <Text mb={0} mt={-2} color={"#683309"} fontSize="medium" fontFamily="ReemKufiRegular" fontWeight="bold">
                    Home
                </Text>
            </VStack>

            <VStack
                w="120px"
                onClick={() => {
                    router.push("/bonkathon2024/create");
                }}
            >
                <LuPlusSquare size={28} color={"#683309"} />
                <Text mb={0} mt={-2} color={"#683309"} fontSize="medium" fontFamily="ReemKufiRegular" fontWeight="bold">
                    Create AMM
                </Text>
            </VStack>

            {isTradePage && (
                <VStack
                    spacing={0.5}
                    w="120px"
                    onClick={() => {
                        setMobilePageContent("Chart");
                    }}
                >
                    <FaChartLine size={24} color={"#683309"} />
                    <Text mb={0} color={"#683309"} fontSize="medium" fontFamily="ReemKufiRegular" fontWeight="bold">
                        Chart
                    </Text>
                </VStack>
            )}
            {isTradePage && (
                <VStack
                    w="130px"
                    onClick={() => {
                        setMobilePageContent("Trade");
                        setLeftPanel("Trade");
                    }}
                >
                    <IoMdSwap size={28} color={"#683309"} />
                    <Text mb={0} mt={-2} color={"#683309"} fontSize="medium" fontFamily="ReemKufiRegular" fontWeight="bold">
                        Buy/Sell
                    </Text>
                </VStack>
            )}
        </HStack>
    );
};

export default Footer;

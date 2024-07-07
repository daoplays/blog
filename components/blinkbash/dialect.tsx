import { HStack, Text } from "@chakra-ui/react";
import { Montserrat } from "next/font/google";
import Link from "next/link";

const montserrat = Montserrat({
    weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
    subsets: ["latin"],
    display: "swap",
    fallback: ["Arial", "sans-serif"],
    variable: "--font-montserrat",
});

const DialectCTA = () => {
    return (
        <HStack className={montserrat.className} bg="white" rounded="md" px={2} py={1} position="fixed" bottom={4} right={4}>
            <Link href="https://www.dialect.to/" target="_blank">
                <Text m={0} fontWeight={600} fontSize="xs">
                    Powered By Dialect Blinks
                </Text>
            </Link>
        </HStack>
    );
};

export default DialectCTA;

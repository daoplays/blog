import React, { PropsWithChildren } from "react";
import { Button, HStack, Menu, MenuButton, MenuItem, MenuList, Text, VStack } from "@chakra-ui/react";
import { useWallet } from "@solana/wallet-adapter-react";
import { FaSignOutAlt } from "react-icons/fa";
import UseWalletConnection from "../components/blog/apps/commonHooks/useWallet";
import trimAddress from "../components/blog/apps/utils/trimAddress";
import Image from "next/image";
require("@solana/wallet-adapter-react-ui/styles.css");
import { Montserrat } from "next/font/google";
import "react-datepicker/dist/react-datepicker.css";
import useResponsive from "../components/blog/apps/commonHooks/useResponsive";
import { Tooltip } from "@chakra-ui/react";
import useAppRoot from "../components/context/useAppRoot";
import Link from "next/link";
import Navigation from "../components/blinkbash/Navigation";

const montserrat = Montserrat({
    weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
    subsets: ["latin"],
    display: "swap",
    fallback: ["Arial", "sans-serif"],
    variable: "--font-montserrat",
});

const Layout = ({ children }: PropsWithChildren) => {
    const { lg, xl } = useResponsive();
    const wallet = useWallet();
    const { handleConnectWallet, handleDisconnectWallet } = UseWalletConnection();
    const isConnected = wallet.publicKey !== null;
    const { userBashBalance, twitter } = useAppRoot();

    return (
        <VStack
            zIndex={999}
            className={montserrat.className}
            position="relative"
            justify="center"
            overflowY="auto"
            minHeight="100vh"
            background="linear-gradient(180deg, #5DBBFF 0%, #0076CC 100%)"
        >
            <Navigation />

            {children}
        </VStack>
    );
};

export default Layout;

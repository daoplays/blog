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

const montserrat = Montserrat({
    weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
    subsets: ["latin"],
    display: "swap",
    fallback: ["Arial", "sans-serif"],
    variable: "--font-montserrat",
});

const Layout = ({ children }: PropsWithChildren) => {
    const { xl } = useResponsive();
    const wallet = useWallet();
    const { handleConnectWallet, handleDisconnectWallet } = UseWalletConnection();
    const isConnected = wallet.publicKey !== null;
    const { userBashBalance, twitter } = useAppRoot();

    return (
        <VStack
            className={montserrat.className}
            position="relative"
            justify="center"
            style={{
                height: "100vh",
                width: "100vw",
                background: "linear-gradient(180deg, #5DBBFF 0%, #0076CC 100%)",
            }}
        >
            <HStack h={20} px={5} position="fixed" top={0} w="full" alignItems="center" justify="space-between">
                <Link href="/">
                    <Text m={0} color="white" fontSize="5xl" className="font-face-wc">
                        Blink<span style={{ color: "#FFDD56" }}>Bash!</span>
                    </Text>
                </Link>

                <HStack
                    gap={6}
                    alignItems="center"
                    style={{
                        position: "absolute",
                        marginLeft: "auto",
                        marginRight: "auto",
                        left: 0,
                        right: 0,
                        width: "fit-content",
                    }}
                >
                    <Link href="/shop">
                        <Text m={0} color="white" fontSize="2xl" className="font-face-wc">
                            Shop
                        </Text>
                    </Link>
                    <Link href="/leaderboard">
                        <Text m={0} color="white" fontSize="2xl" className="font-face-wc">
                            Leaderboard
                        </Text>
                    </Link>
                </HStack>

                <HStack gap={4} alignItems="center">
                    {isConnected && (
                        <HStack>
                            <Image height={30} width={30} src="/images/logo.png" alt="BASH" style={{ background: "transparent" }} />
                            <Text m={0} fontSize={"2xl"} color="white" fontWeight="semibold">
                                {userBashBalance / 10}
                            </Text>
                        </HStack>
                    )}
                    <Button
                        shadow="md"
                        colorScheme="yellow"
                        color="#877714"
                        rounded="lg"
                        onClick={isConnected ? handleDisconnectWallet : handleConnectWallet}
                    >
                        {isConnected ? (
                            <HStack align="center" spacing={2}>
                                <FaSignOutAlt size={18} />
                                <Text m={0}>{trimAddress(wallet.publicKey.toString())}</Text>
                            </HStack>
                        ) : (
                            "Connect Wallet"
                        )}
                    </Button>
                    {twitter && isConnected && (
                        <Menu>
                            <MenuButton>
                                <Image
                                    src={twitter.profile_image_url!}
                                    alt="User Avatar"
                                    width={45}
                                    height={45}
                                    style={{ borderRadius: "50%", cursor: "pointer" }}
                                />
                            </MenuButton>
                            <MenuList>
                                <MenuItem color="red">Disconnect Twitter</MenuItem>
                            </MenuList>
                        </Menu>
                    )}
                </HStack>
            </HStack>

            {children}

            <Image
                src="/images/builder.png"
                alt="Builder Character"
                width={xl ? 250 : 350}
                height={xl ? 250 : 350}
                style={{ position: "absolute", bottom: 0, left: 0 }}
            />
        </VStack>
    );
};

export default Layout;

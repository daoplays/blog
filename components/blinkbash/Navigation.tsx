import React, { PropsWithChildren, useCallback } from "react";
import { Button, HStack, Menu, MenuButton, MenuItem, MenuList, Text, VStack } from "@chakra-ui/react";
import { useWallet } from "@solana/wallet-adapter-react";
import { FaSignOutAlt } from "react-icons/fa";
import Image from "next/image";
require("@solana/wallet-adapter-react-ui/styles.css");
import "react-datepicker/dist/react-datepicker.css";
import Link from "next/link";
import { trimAddress } from "../state/utils";
import useAppRoot from "../context/useAppRoot";
import UseWalletConnection from "../blog/apps/commonHooks/useWallet";
import bs58 from "bs58";
import useResponsive from "../../hooks/useResponsive";
import { RxHamburgerMenu } from "react-icons/rx";
import { useRouter } from "next/navigation";
import { FaSquareXTwitter, FaXTwitter } from "react-icons/fa6";
import { BsDiscord } from "react-icons/bs";

const Navigation = () => {
    const router = useRouter();
    const wallet = useWallet();
    const { handleConnectWallet, handleDisconnectWallet } = UseWalletConnection();
    const isConnected = wallet.publicKey !== null;
    const { userBashBalance, twitter, setTwitter } = useAppRoot();

    const { sm, md, xl } = useResponsive();

    const unlinkTwitter = useCallback(async () => {
        console.log("unlinking twitter");
        try {
            const message = "Sign to unlink Twitter account from BlinkBash";
            const encodedMessage = new TextEncoder().encode(message);

            // 2. Sign the message
            const signature = await wallet.signMessage(encodedMessage);
            const encodedSignature = bs58.encode(signature);

            let body = JSON.stringify({
                publicKey: wallet.publicKey.toString(),
                signature: encodedSignature,
                message: message,
            });
            const response = await fetch("/.netlify/functions/unlinkTwitter", {
                method: "POST",
                body: body,
                headers: {
                    "Content-Type": "application/json",
                },
            });

            console.log(response);
            setTwitter(null);
        } catch (error) {
            console.log("Error fetching user info:", error);
        }
    }, [wallet, setTwitter]);

    return (
        <HStack
            h={20}
            px={5}
            position="fixed"
            top={0}
            w="full"
            alignItems="center"
            justify={"space-between"}
            background="linear-gradient(180deg, #5DBBFF 25%, #0076CC 200%)"
            zIndex={99}
        >
            <Link href="/" hidden={md}>
                <Text m={0} color="white" className="font-face-wc" fontSize={sm ? "2xl" : "5xl"}>
                    Blink<span style={{ color: "#FFDD56" }}>Bash!</span>
                </Text>
            </Link>

            {md && (
                <Menu>
                    <MenuButton>
                        <RxHamburgerMenu size={35} />
                    </MenuButton>
                    <MenuList>
                        <MenuItem
                            fontWeight={500}
                            onClick={() => {
                                router.push("/");
                            }}
                        >
                            Play
                        </MenuItem>
                        <MenuItem
                            fontWeight={500}
                            onClick={() => {
                                router.push("/shop");
                            }}
                        >
                            Shop
                        </MenuItem>
                        <MenuItem
                            fontWeight={500}
                            onClick={() => {
                                router.push("/leaderboard");
                            }}
                        >
                            Leaderboard
                        </MenuItem>
                        <MenuItem fontWeight={500}>
                            <Link href="https://x.com/Blink_Bash" target="_blank">
                                Twitter
                            </Link>
                        </MenuItem>
                        <MenuItem fontWeight={500}>
                            <Link href="https://discord.gg/QHzfCRb68t" target="_blank">
                                Discord
                            </Link>
                        </MenuItem>
                    </MenuList>
                </Menu>
            )}

            <HStack
                hidden={md}
                gap={10}
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
                <Link href="/">
                    <Text m={0} color="white" fontSize="2xl" className="font-face-wc">
                        Play
                    </Text>
                </Link>
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
                <VStack _hover={{ opacity: "85%" }} hidden={md}>
                    <Link href="https://x.com/Blink_Bash" target="_blank">
                        <FaXTwitter size={28} color="white" style={{ cursor: "pointer" }} />
                    </Link>
                </VStack>
                <VStack _hover={{ opacity: "85%" }} hidden={md}>
                    <Link href="https://discord.gg/QHzfCRb68t" target="_blank">
                        <BsDiscord size={30} color="white" style={{ cursor: "pointer" }} />
                    </Link>
                </VStack>
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
                    _active={{ bg: "#FFE376" }}
                    _hover={{ opacity: "90%" }}
                    bg="#FFE376"
                    color="#BA6502"
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
                            <MenuItem
                                color="red"
                                fontWeight={500}
                                onClick={() => {
                                    unlinkTwitter();
                                }}
                            >
                                Disconnect Twitter
                            </MenuItem>
                        </MenuList>
                    </Menu>
                )}
            </HStack>
        </HStack>
    );
};

export default Navigation;

import { Divider, HStack, Text, TabIndicator, TabList, TabPanel, TabPanels, Tabs, VStack, Button } from "@chakra-ui/react";
import React, { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import "react-datepicker/dist/react-datepicker.css";
import Layout from "./layout";
import { FaPlus } from "react-icons/fa6";
require("@solana/wallet-adapter-react-ui/styles.css");

export default function Shop() {
    const wallet = useWallet();
    const isConnected = wallet.publicKey !== null;
    const [selected, setSelected] = useState("Tokens");

    return (
        <Layout>
            <HStack spacing={8} mx={5}>
                <VStack w="700px" border="1px solid white" p={4} rounded="xl" shadow="xl">
                    <HStack justifyContent="space-between" w="full">
                        <HStack spacing={3}>
                            {["Tokens", "NFTs"].map((name, i) => {
                                const isActive = selected === name;

                                const baseStyle = {
                                    display: "flex",
                                    alignItems: "center",
                                    cursor: "pointer",
                                };

                                const activeStyle = {
                                    color: isActive ? "#FFDD56" : "white",
                                    borderBottom: isActive ? "2px solid #FFDD56" : "",
                                    opacity: isActive ? 1 : 0.5,
                                };

                                return (
                                    <HStack
                                        key={i}
                                        style={{
                                            ...baseStyle,
                                            ...activeStyle,
                                        }}
                                        onClick={() => {
                                            setSelected(name);
                                        }}
                                        px={4}
                                        py={2}
                                        mt={-2}
                                        w={"fit-content"}
                                        justify="center"
                                    >
                                        <Text m={"0 auto"} fontSize="lg" fontWeight="bold">
                                            {name}
                                        </Text>
                                    </HStack>
                                );
                            })}
                        </HStack>

                        <Button shadow="md" colorScheme="yellow" color="#877714" rounded="lg">
                            <HStack align="center" spacing={2}>
                                <FaPlus size={18} />
                                <Text m={0}>{selected === "Tokens" ? "Add Token" : "Add NFT"}</Text>
                            </HStack>
                        </Button>
                    </HStack>
                </VStack>
            </HStack>
        </Layout>
    );
}

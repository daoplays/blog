import {
    Table,
    Thead,
    Tbody,
    Tfoot,
    Tr,
    Th,
    Td,
    TableCaption,
    TableContainer,
    useDisclosure,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Input,
} from "@chakra-ui/react";
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
    const { isOpen, onOpen, onClose } = useDisclosure();

    const [tokenName, setTokenName] = React.useState("");
    const handleChangeTokenName = (event) => setTokenName(event.target.value);

    const [tokenAddress, setTokenAddress] = React.useState("");
    const handleChangeTokenAddress = (event) => setTokenAddress(event.target.value);

    const [tokenQuantity, setTokenQuantity] = React.useState("");
    const handleChangeTokenQuantity = (event) => setTokenQuantity(event.target.value);

    const [tokenPrice, setTokenPrice] = React.useState("");
    const handleChangeTokenPrice = (event) => setTokenPrice(event.target.value);

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

                        <Button
                            shadow="md"
                            colorScheme="yellow"
                            color="#877714"
                            rounded="lg"
                            onClick={onOpen}
                            isDisabled={selected !== "Tokens"}
                        >
                            <HStack align="center" spacing={2}>
                                <FaPlus size={18} />
                                <Text m={0}>{selected === "Tokens" ? "Add Token" : "Add NFT"}</Text>
                            </HStack>
                        </Button>
                    </HStack>

                    {selected === "Tokens" && (
                        <TableContainer w="full" maxH={500} mt={3} overflowY="auto">
                            <Table size="sm" colorScheme="teal" style={{ color: "white", fontWeight: 600 }}>
                                <Thead>
                                    <Tr>
                                        <Th>Name</Th>
                                        <Th>Address</Th>
                                        <Th isNumeric>Qty</Th>
                                        <Th isNumeric>Price</Th>
                                        <Th isNumeric>Trade</Th>
                                    </Tr>
                                </Thead>
                                <Tbody>
                                    <Tr>
                                        <Td>$BAGS</Td>
                                        <Td>8wbK...Vjd3</Td>
                                        <Td isNumeric>250</Td>
                                        <Td isNumeric>500 $BASH</Td>
                                        <Td isNumeric>
                                            <Button shadow="md" colorScheme="yellow" color="#877714" rounded="lg" size="sm" mr={-1}>
                                                Buy
                                            </Button>
                                        </Td>
                                    </Tr>
                                </Tbody>
                            </Table>
                        </TableContainer>
                    )}

                    {selected !== "Tokens" && (
                        <Text mt={4} color="white" fontWeight={600} opacity={"50%"}>
                            Coming Soon
                        </Text>
                    )}
                </VStack>
            </HStack>

            <Modal isOpen={isOpen} onClose={onClose} isCentered>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader py={4} color="#877714">
                        Add a Token
                    </ModalHeader>
                    <ModalCloseButton />
                    <ModalBody display="flex" flexDirection="column" gap={3} pb={4}>
                        <VStack gap={1} align="start">
                            <Text fontSize="sm" mb={0}>
                                Token Name
                            </Text>
                            <Input
                                rounded="md"
                                value={tokenName}
                                onChange={handleChangeTokenName}
                                placeholder="Enter your Token Name"
                                size="sm"
                                disabled
                            />
                        </VStack>

                        <VStack gap={1} align="start">
                            <Text fontSize="sm" mb={0}>
                                Token Name
                            </Text>
                            <Input
                                rounded="md"
                                value={tokenAddress}
                                onChange={handleChangeTokenAddress}
                                placeholder="Enter your Token Address"
                                size="sm"
                            />
                        </VStack>

                        <VStack gap={1} align="start">
                            <Text fontSize="sm" mb={0}>
                                Quantity
                            </Text>
                            <Input
                                rounded="md"
                                value={tokenQuantity}
                                onChange={handleChangeTokenQuantity}
                                placeholder="Enter Quantity"
                                size="sm"
                            />
                        </VStack>

                        <VStack gap={1} align="start">
                            <Text fontSize="sm" mb={0}>
                                Price
                            </Text>
                            <Input
                                rounded="md"
                                value={tokenPrice}
                                onChange={handleChangeTokenPrice}
                                placeholder="Enter Enter Price"
                                size="sm"
                            />
                        </VStack>
                    </ModalBody>

                    <ModalFooter p={4}>
                        <Button variant="ghost" onClick={onClose}>
                            Close
                        </Button>

                        <Button shadow="md" colorScheme="yellow" color="#877714" rounded="lg">
                            Add
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </Layout>
    );
}

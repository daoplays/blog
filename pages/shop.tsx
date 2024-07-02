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
    Select,
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

    const [token, setToken] = useState("");
    const handleChangeToken = (event) => setToken(event.target.value);

    const [tokenAddress, setTokenAddress] = useState("");
    const handleChangeTokenAddress = (event) => setTokenAddress(event.target.value);

    const [tokenQuantity, setTokenQuantity] = useState("");
    const handleChangeTokenQuantity = (event) => setTokenQuantity(event.target.value);

    const [tokenPrice, setTokenPrice] = useState("");
    const handleChangeTokenPrice = (event) => setTokenPrice(event.target.value);

    const [nftContractAddress, setNftContractAddress] = useState("");
    const handleChangeNftContractAddress = (event) => setNftContractAddress(event.target.value);

    const [nftTokenId, setNftTokenId] = useState("");
    const handleChangeNftTokenId = (event) => setNftTokenId(event.target.value);

    const [nftPrice, setNftPrice] = useState("");
    const handleChangeNftPrice = (event) => setNftPrice(event.target.value);

    return (
        <Layout>
            <HStack bg="#0ab7f2" spacing={8} mx={5} rounded="xl">
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
                            _active={{ bg: "#FFE376" }}
                            _hover={{ opacity: "90%" }}
                            bg="#FFE376"
                            color="#BA6502"
                            rounded="lg"
                            onClick={onOpen}
                        >
                            <HStack align="center" spacing={2}>
                                <FaPlus size={18} />
                                <Text m={0}>{selected === "Tokens" ? "List Token" : "List NFT"}</Text>
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
                                            <Button
                                                shadow="md"
                                                _active={{ bg: "#FFE376" }}
                                                _hover={{ opacity: "90%" }}
                                                bg="#FFE376"
                                                color="#BA6502"
                                                rounded="lg"
                                                size="sm"
                                                mr={-1}
                                            >
                                                Buy
                                            </Button>
                                        </Td>
                                    </Tr>
                                </Tbody>
                            </Table>
                        </TableContainer>
                    )}

                    {selected !== "Tokens" && (
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
                                        <Td>Joy #1124</Td>
                                        <Td>8wbK...Vjd3</Td>
                                        <Td isNumeric>1</Td>
                                        <Td isNumeric>1500 $BASH</Td>
                                        <Td isNumeric>
                                            <Button
                                                shadow="md"
                                                _active={{ bg: "#FFE376" }}
                                                _hover={{ opacity: "90%" }}
                                                bg="#FFE376"
                                                color="#BA6502"
                                                rounded="lg"
                                                size="sm"
                                                mr={-1}
                                            >
                                                Buy
                                            </Button>
                                        </Td>
                                    </Tr>
                                </Tbody>
                            </Table>
                        </TableContainer>
                    )}
                </VStack>
            </HStack>

            <Modal isOpen={isOpen} onClose={onClose} isCentered>
                <ModalOverlay />
                <ModalContent borderRadius={12}>
                    <ModalHeader py={4} color="#BA6502">
                        {selected === "Tokens" ? "List a Token" : "List an NFT"}
                    </ModalHeader>
                    <ModalCloseButton />
                    <ModalBody display="flex" flexDirection="column" gap={3} pb={4}>
                        {selected === "Tokens" ? (
                            <>
                                <VStack gap={1} align="start">
                                    <Text fontSize="sm" mb={0}>
                                        Token
                                    </Text>
                                    <Select rounded="md" value={token} onChange={handleChangeToken} placeholder="Select a Token" size="sm">
                                        <option value="option1">Option 1</option>
                                        <option value="option2">Option 2</option>
                                        <option value="option3">Option 3</option>
                                    </Select>
                                </VStack>

                                <VStack gap={1} align="start">
                                    <HStack w="full" justify="space-between">
                                        <Text fontSize="sm" mb={0}>
                                            Quantity
                                        </Text>
                                        <Text opacity="50%" fontSize="sm" mb={0}>
                                            Your Balance: 0
                                        </Text>
                                    </HStack>
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
                            </>
                        ) : (
                            <>
                                <VStack gap={1} align="start">
                                    <Text fontSize="sm" mb={0}>
                                        NFT
                                    </Text>
                                    <Select rounded="md" value={token} onChange={handleChangeToken} placeholder="Select your NFT" size="sm">
                                        <option value="option1">Option 1</option>
                                        <option value="option2">Option 2</option>
                                        <option value="option3">Option 3</option>
                                    </Select>
                                </VStack>

                                <VStack gap={1} align="start">
                                    <HStack w="full" justify="space-between">
                                        <Text fontSize="sm" mb={0}>
                                            Quantity
                                        </Text>
                                        <Text opacity="50%" fontSize="sm" mb={0}>
                                            Your NFTs: 0
                                        </Text>
                                    </HStack>
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
                            </>
                        )}
                    </ModalBody>

                    <ModalFooter p={4}>
                        <Button rounded="lg" variant="ghost" onClick={onClose} mr={1}>
                            Close
                        </Button>

                        <Button
                            shadow="md"
                            _active={{ bg: "#FFE376" }}
                            _hover={{ opacity: "90%" }}
                            bg="#FFE376"
                            color="#BA6502"
                            rounded="lg"
                        >
                            Submit Listing
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </Layout>
    );
}

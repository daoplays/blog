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
    Tooltip,
    Link,
} from "@chakra-ui/react";
import Image from "next/image";
import { Divider, HStack, Text, TabIndicator, TabList, TabPanel, TabPanels, Tabs, VStack, Button } from "@chakra-ui/react";
import React, { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import "react-datepicker/dist/react-datepicker.css";
import { FaPlus } from "react-icons/fa6";
import useListemItem from "../hooks/useListItem";
import useBuyItem from "../hooks/useBuyItem";

import { PublicKey } from "@solana/web3.js";
import useAppRoot from "../components/context/useAppRoot";
import { ListingData } from "../components/state/state";
import { getSolscanLink } from "../components/state/utils";
import { trimAddress } from "../components/state/utils";
import { MdOutlineContentCopy } from "react-icons/md";
import { bignum_to_num } from "../components/blog/apps/common";
import useResponsive from "../components/blog/apps/commonHooks/useResponsive";
import DialectCTA from "../components/blinkbash/dialect";
require("@solana/wallet-adapter-react-ui/styles.css");

export default function Shop() {
    const { lg, md, sm } = useResponsive();
    const wallet = useWallet();
    const isConnected = wallet.publicKey !== null;
    const [selected, setSelected] = useState("Tokens");
    const { isOpen, onOpen, onClose } = useDisclosure();
    const { listingList, tokenList, nftList, userWLBalance } = useAppRoot();
    const { ListItem } = useListemItem();
    const { BuyItem } = useBuyItem();

    const [tokenAddress, setTokenAddress] = useState("");
    const handleChangeTokenAddress = (event) => setTokenAddress(event.target.value);

    const [tokenQuantity, setTokenQuantity] = useState("");
    const handleChangeTokenQuantity = (event) => setTokenQuantity(event.target.value);

    const [tokenPrice, setTokenPrice] = useState("");
    const handleChangeTokenPrice = (event) => setTokenPrice(event.target.value);

    const [nftContractAddress, setNftContractAddress] = useState("");
    const handleChangeNftContractAddress = (event) => setNftContractAddress(event.target.value);

    const [nftPrice, setNftPrice] = useState("");
    const handleChangeNftPrice = (event) => setNftPrice(event.target.value);

    const handleSubmitListing = (e) => {
        if (selected === "Tokens") {
            ListItem(1, new PublicKey(tokenAddress), parseInt(tokenQuantity), parseInt(tokenPrice));
        } else {
            ListItem(2, new PublicKey(nftContractAddress), 1, parseInt(nftPrice));
        }
    };

    const handleBuyItem = (e, listing: ListingData) => {
        if (selected === "Tokens") {
            BuyItem(1, listing.item_address, 1);
        } else {
            BuyItem(2, listing.item_address, 1);
        }
    };

    const NFTRow = ({ item }: { item: ListingData }) => {
        if (nftList === null || (item.item_type !== 2 && item.item_type !== 3) || bignum_to_num(item.quantity) === 0) {
            return <></>;
        }

        let address = item.item_address.toString();
        let mint = item.item_type === 2 ? nftList.get(address) : tokenList.get(address);
        if (mint === undefined) {
            return <></>;
        }
        let price = bignum_to_num(item.price);

        return (
            <Tr>
                <Td>
                    <Image
                        alt="Launch icon"
                        src={mint.icon}
                        width={45}
                        height={45}
                        style={{ borderRadius: "8px", backgroundSize: "cover" }}
                    />
                </Td>
                <Td>{mint.name}</Td>
                <Td>
                    <HStack spacing={3}>
                        <Text m={0}>{trimAddress(address)}</Text>

                        <Tooltip label="Copy Contract Address" hasArrow fontSize="large" offset={[0, 10]}>
                            <div
                                style={{ cursor: "pointer" }}
                                onClick={(e) => {
                                    e.preventDefault();
                                    navigator.clipboard.writeText(address);
                                }}
                            >
                                <MdOutlineContentCopy color="white" size={20} />
                            </div>
                        </Tooltip>

                        <Tooltip label="View in explorer" hasArrow fontSize="large" offset={[0, 10]}>
                            <Link href={getSolscanLink(item.item_address, "Token")} target="_blank" onClick={(e) => e.stopPropagation()}>
                                <Image src="/images/solscan.png" width={20} height={20} alt="Solscan icon" />
                            </Link>
                        </Tooltip>
                    </HStack>
                </Td>
                <Td isNumeric>{price / 10}</Td>
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
                        onClick={(e) => handleBuyItem(e, item)}
                    >
                        Buy
                    </Button>
                </Td>
            </Tr>
        );
    };

    const TokenRow = ({ item }: { item: ListingData }) => {
        if (tokenList === null || item.item_type !== 1 || bignum_to_num(item.quantity) === 0) {
            return <></>;
        }
        let address = item.item_address.toString();
        let mint = tokenList.get(address);
        if (mint === undefined) {
            return <></>;
        }
        let price = bignum_to_num(item.price);
        let quantity = bignum_to_num(item.quantity) / Math.pow(10, mint.mint.decimals);

        return (
            <Tr>
                <Td>
                    <Image
                        alt="Launch icon"
                        src={mint.icon}
                        width={45}
                        height={45}
                        style={{ borderRadius: "8px", backgroundSize: "cover" }}
                    />
                </Td>
                <Td>{mint.symbol}</Td>
                <Td>
                    <HStack spacing={2}>
                        <Text m={0}>{trimAddress(address)}</Text>

                        <Tooltip label="Copy Contract Address" hasArrow fontSize="large" offset={[0, 10]}>
                            <div
                                style={{ cursor: "pointer" }}
                                onClick={(e) => {
                                    e.preventDefault();
                                    navigator.clipboard.writeText(address);
                                }}
                            >
                                <MdOutlineContentCopy color="white" size={20} />
                            </div>
                        </Tooltip>

                        <Tooltip label="View in explorer" hasArrow fontSize="large" offset={[0, 10]}>
                            <Link href={getSolscanLink(item.item_address, "Token")} target="_blank" onClick={(e) => e.stopPropagation()}>
                                <Image
                                    src="/images/solscan.png"
                                    style={{ minWidth: "20px", minHeight: "20px" }}
                                    width={20}
                                    height={20}
                                    alt="Solscan icon"
                                />
                            </Link>
                        </Tooltip>
                    </HStack>
                </Td>
                <Td isNumeric>{quantity}</Td>
                <Td isNumeric>{price / 10}</Td>
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
                        onClick={(e) => handleBuyItem(e, item)}
                    >
                        Buy
                    </Button>
                </Td>
            </Tr>
        );
    };


    return (
        <VStack
            position="relative"
            justify="center"
            overflowY="auto"
            minHeight="100vh"
            background="linear-gradient(180deg, #5DBBFF 0%, #0076CC 100%)"
        >
            <HStack w={sm ? "100%" : "700px"} bg="#0ab7f2" spacing={8} mx={5} rounded="xl">
                <VStack w={sm ? "100%" : "700px"} border="1px solid white" p={4} rounded="xl" shadow="xl">
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
                                        <Th>Icon</Th>
                                        <Th>Name</Th>
                                        <Th>Address</Th>
                                        <Th isNumeric>Qty</Th>
                                        <Th isNumeric>Price</Th>
                                        <Th isNumeric>Trade</Th>
                                    </Tr>
                                </Thead>
                                <Tbody>
                                    {Array.from(listingList).map(([key, item], i) => (
                                        <TokenRow key={key} item={item} />
                                    ))}
                                </Tbody>
                            </Table>
                        </TableContainer>
                    )}

                    {selected !== "Tokens" && (
                        <TableContainer w="full" maxH={500} mt={3} overflowY="auto">
                            <Table size="sm" colorScheme="teal" style={{ color: "white", fontWeight: 600 }}>
                                <Thead>
                                    <Tr>
                                        <Th>Icon</Th>
                                        <Th>Name</Th>
                                        <Th>Address</Th>
                                        <Th isNumeric>Price</Th>
                                        <Th isNumeric>Trade</Th>
                                    </Tr>
                                </Thead>
                                <Tbody>
                                    {Array.from(listingList).map(([key, item], i) => (
                                        <NFTRow key={key} item={item} />
                                    ))}
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
                        <HStack>
                            <Text m="0">{selected === "Tokens" ? "List a Token" : "List an NFT"}</Text>
                            <Image
                                alt="Launch icon"
                                src="/images/bash_wlist.png"
                                width={30}
                                height={30}
                                style={{ borderRadius: "8px", backgroundSize: "cover" }}
                            />
                            <Text m="0">{userWLBalance}</Text>
                        </HStack>
                    </ModalHeader>
                    <ModalCloseButton />
                    <ModalBody display="flex" flexDirection="column" gap={3} pb={4}>
                        {selected === "Tokens" ? (
                            <>
                                <VStack gap={1} align="start">
                                    <Text fontSize="sm" mb={0}>
                                        Token
                                    </Text>
                                    <Input
                                        rounded="md"
                                        value={tokenAddress}
                                        onChange={handleChangeTokenAddress}
                                        placeholder="Enter Address"
                                        size="sm"
                                    />
                                </VStack>

                                <VStack gap={1} align="start">
                                    <HStack w="full" justify="space-between">
                                        <Text fontSize="sm" mb={0}>
                                            Quantity To List
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
                                        Price Per Token
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
                                    <Input
                                        rounded="md"
                                        value={nftContractAddress}
                                        onChange={handleChangeNftContractAddress}
                                        placeholder="Enter Address"
                                        size="sm"
                                    />
                                </VStack>

                                <VStack gap={1} align="start">
                                    <Text fontSize="sm" mb={0}>
                                        Price
                                    </Text>
                                    <Input
                                        rounded="md"
                                        value={nftPrice}
                                        onChange={handleChangeNftPrice}
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
                            onClick={(e) => handleSubmitListing(e)}
                        >
                            Submit Listing
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            <Image
                src="/images/shop-man.png"
                alt="Shop Man Character"
                width={300}
                height={300}
                style={{ position: "absolute", bottom: -0, left: 50 }}
                hidden={lg}
            />
        </VStack>
    );
}

import React, { useRef, useCallback, useEffect, useState, useMemo, Dispatch } from "react";
import { SetStateAction } from "react";
import { WalletProvider, useWallet } from "@solana/wallet-adapter-react";
import { WalletModalProvider, useWalletModal } from "@solana/wallet-adapter-react-ui";

import { Box, HStack, Text, Center, VStack, Divider, Input, Link } from "@chakra-ui/react";
import useResponsive from "./hooks/useResponsive";
import useCreateCollection from "./hooks/useCreateCollection";
import { PublicKey } from "@solana/web3.js";
import styles from "../../../../styles/Core.module.css";
import useCreateNFT from "./hooks/useCreateNFT";
import useTransferNFT from "./hooks/useTransferNFT";

require("@solana/wallet-adapter-react-ui/styles.css");

function SetCollectionOptions({ setCollection }: { setCollection: Dispatch<SetStateAction<PublicKey>> }) {
    const { sm, md, lg } = useResponsive();

    const [collection_name, setCollectionName] = useState<string>("");
    const [collection_uri, setCollectionURI] = useState<string>("");
    const { CreateCollection, isLoading: isCollectionLoading } = useCreateCollection(collection_name, collection_uri, setCollection);

    return (
        <Center borderColor="black" borderWidth="1px" width="100%">
            <VStack w="100%" style={{ paddingBottom: md ? 35 : "75px" }}>
                <Text align="start" className="font-face-kg" color={"white"} fontSize="x-large">
                    Collection Info:
                </Text>
                <form style={{ width: lg ? "100%" : "1200px" }}>
                    <VStack px={lg ? 4 : 12} spacing={25}>
                        <HStack w="100%" spacing={lg ? 10 : 12} style={{ flexDirection: lg ? "column" : "row" }}>
                            <VStack spacing={8} flexGrow={1} align="start" width="100%">
                                <HStack spacing={0} className={styles.eachField}>
                                    <div
                                        className={`${styles.textLabel} font-face-kg`}
                                        style={{ color: "black", minWidth: lg ? "100px" : "132px" }}
                                    >
                                        Name:
                                    </div>

                                    <div className={styles.textLabelInput}>
                                        <Input
                                            placeholder="Enter Collection Name"
                                            size={lg ? "md" : "lg"}
                                            maxLength={25}
                                            required
                                            className={styles.inputBox}
                                            type="text"
                                            value={collection_name}
                                            onChange={(e) => setCollectionName(e.target.value)}
                                        />
                                    </div>
                                </HStack>
                            </VStack>
                        </HStack>

                        <HStack w="100%" spacing={lg ? 10 : 12} style={{ flexDirection: lg ? "column" : "row" }}>
                            <VStack spacing={8} flexGrow={1} align="start" width="100%">
                                <HStack spacing={0} className={styles.eachField}>
                                    <div
                                        className={`${styles.textLabel} font-face-kg`}
                                        style={{ color: "black", minWidth: lg ? "100px" : "132px" }}
                                    >
                                        URI:
                                    </div>

                                    <div className={styles.textLabelInput}>
                                        <Input
                                            placeholder="Enter Collection URI"
                                            size={lg ? "md" : "lg"}
                                            required
                                            className={styles.inputBox}
                                            type="text"
                                            value={collection_uri}
                                            onChange={(e) => setCollectionURI(e.target.value)}
                                        />
                                    </div>
                                </HStack>
                            </VStack>
                        </HStack>

                        <HStack mt={md ? 0 : 30}>
                            <button
                                type="button"
                                onClick={(e) => {
                                    CreateCollection();
                                }}
                                className={`${styles.nextBtn}`}
                                style={{
                                    borderColor: "black",
                                    borderWidth: "1px",
                                    cursor: isCollectionLoading ? "not-allowed" : "pointer",
                                }}
                            >
                                {isCollectionLoading ? "Please Wait" : "Create Collection"}
                            </button>
                        </HStack>
                    </VStack>
                </form>
            </VStack>
        </Center>
    );
}

function SetTokenOptions({
    collection,
    token,
    setToken,
}: {
    collection: PublicKey;
    token: PublicKey;
    setToken: Dispatch<SetStateAction<PublicKey>>;
}) {
    const { sm, md, lg } = useResponsive();

    const [token_name, setTokenName] = useState<string>("");
    const [token_uri, setTokenURI] = useState<string>("");
    const [destination, setDestination] = useState<string>("");

    const { CreateNFT, isLoading: isNFTLoading } = useCreateNFT(token_name, token_uri, collection, setToken);
    const { TransferNFT, isLoading: isTransferLoading } = useTransferNFT(collection, token, destination, setToken);

    return (
        <Center borderColor="black" borderWidth="1px" width="100%">
            <VStack w="100%" style={{ paddingBottom: md ? 35 : "75px" }}>
                <HStack>
                    <Text align="start" className="font-face-kg" color={"black"} fontSize="x-large" m="0" p="0">
                        View your Collection
                    </Text>
                    <Link
                        className="font-face-kg"
                        color={"black"}
                        fontSize="x-large"
                        m="0"
                        p="0"
                        style={{ textDecoration: "underline" }}
                        href={"https://core.metaplex.com/explorer/collection/" + collection.toString() + "?env=devnet"}
                        target="_blank"
                    >
                        here
                    </Link>
                </HStack>
                <Divider color="black" />
                <Text align="start" className="font-face-kg" color={"black"} fontSize="x-large">
                    Token Info:
                </Text>
                <form style={{ width: lg ? "100%" : "1200px" }}>
                    <VStack px={lg ? 4 : 12} spacing={25}>
                        <HStack w="100%" spacing={lg ? 10 : 12} style={{ flexDirection: lg ? "column" : "row" }}>
                            <VStack spacing={8} flexGrow={1} align="start" width="100%">
                                <HStack spacing={0} className={styles.eachField}>
                                    <div
                                        className={`${styles.textLabel} font-face-kg`}
                                        style={{ color: "black", minWidth: lg ? "100px" : "132px" }}
                                    >
                                        Name:
                                    </div>

                                    <div className={styles.textLabelInput}>
                                        <Input
                                            placeholder="Enter NFT Name"
                                            size={lg ? "md" : "lg"}
                                            maxLength={25}
                                            required
                                            className={styles.inputBox}
                                            type="text"
                                            value={token_name}
                                            onChange={(e) => setTokenName(e.target.value)}
                                        />
                                    </div>
                                </HStack>
                            </VStack>
                        </HStack>

                        <HStack w="100%" spacing={lg ? 10 : 12} style={{ flexDirection: lg ? "column" : "row" }}>
                            <VStack spacing={8} flexGrow={1} align="start" width="100%">
                                <HStack spacing={0} className={styles.eachField}>
                                    <div
                                        className={`${styles.textLabel} font-face-kg`}
                                        style={{ color: "black", minWidth: lg ? "100px" : "132px" }}
                                    >
                                        URI:
                                    </div>

                                    <div className={styles.textLabelInput}>
                                        <Input
                                            placeholder="Enter NFT URI"
                                            size={lg ? "md" : "lg"}
                                            required
                                            className={styles.inputBox}
                                            type="text"
                                            value={token_uri}
                                            onChange={(e) => setTokenURI(e.target.value)}
                                        />
                                    </div>
                                </HStack>
                            </VStack>
                        </HStack>

                        <HStack mt={md ? 0 : 30}>
                            <button
                                type="button"
                                onClick={(e) => {
                                    CreateNFT();
                                }}
                                disabled={isNFTLoading || isTransferLoading}
                                className={`${styles.nextBtn}`}
                                style={{
                                    borderColor: "black",
                                    borderWidth: "1px",
                                    cursor: isNFTLoading ? "not-allowed" : "pointer",
                                }}
                            >
                                {isNFTLoading ? "Please Wait" : "Create Token"}
                            </button>
                        </HStack>

                        {token !== null && (
                            <>
                                <HStack w="100%" spacing={lg ? 10 : 12} style={{ flexDirection: lg ? "column" : "row" }}>
                                    <VStack spacing={8} flexGrow={1} align="start" width="100%">
                                        <Divider color="black" />

                                        <HStack>
                                            <Text align="start" className="font-face-kg" color={"black"} fontSize="x-large" m="0" p="0">
                                                View your Token
                                            </Text>
                                            <Link
                                                className="font-face-kg"
                                                color={"black"}
                                                fontSize="x-large"
                                                m="0"
                                                p="0"
                                                style={{ textDecoration: "underline" }}
                                                href={"https://core.metaplex.com/explorer/" + token.toString() + "?env=devnet"}
                                                target="_blank"
                                            >
                                                here
                                            </Link>
                                        </HStack>

                                        <HStack spacing={0} className={styles.eachField}>
                                            <div
                                                className={`${styles.textLabel} font-face-kg`}
                                                style={{
                                                    color: "black",
                                                    minWidth: lg ? "100px" : "132px",
                                                }}
                                            >
                                                Destination:
                                            </div>

                                            <div className={styles.textLabelInput}>
                                                <Input
                                                    placeholder="Enter destination address"
                                                    size={lg ? "md" : "lg"}
                                                    required
                                                    className={styles.inputBox}
                                                    type="text"
                                                    value={destination}
                                                    onChange={(e) => setDestination(e.target.value)}
                                                />
                                            </div>
                                        </HStack>
                                    </VStack>
                                </HStack>

                                <HStack mt={md ? 0 : 30}>
                                    <button
                                        type="button"
                                        disabled={isNFTLoading || isTransferLoading || token === null}
                                        onClick={(e) => {
                                            TransferNFT();
                                        }}
                                        className={`${styles.nextBtn}`}
                                        style={{
                                            borderColor: "black",
                                            borderWidth: "1px",
                                            cursor: isTransferLoading || token === null ? "not-allowed" : "pointer",
                                        }}
                                    >
                                        {"Transfer"}
                                    </button>
                                </HStack>
                            </>
                        )}
                    </VStack>
                </form>
            </VStack>
        </Center>
    );
}

function App() {
    const wallet = useWallet();
    const [collection, setCollection] = useState<PublicKey | null>(null);
    const [token, setToken] = useState<PublicKey | null>(null);

    function ConnectWalletButton() {
        const { setVisible } = useWalletModal();

        const handleConnectWallet = useCallback(async () => {
            setVisible(true);
        }, [setVisible]);

        return (
            <>
                <Box mb="1rem" as="button" onClick={handleConnectWallet}>
                    <div className="font-face-sfpb">
                        <Text
                            borderColor="black"
                            borderWidth="1px"
                            width="160px"
                            height="25px"
                            fontSize={"16px"}
                            textAlign="center"
                            color="black"
                            mb="0"
                        >
                            CONNECT WALLET
                        </Text>
                    </div>
                </Box>
            </>
        );
    }

    const DisconnectWallet = useCallback(async () => {
        console.log("call wallet disconnect");
        await wallet.disconnect();
    }, [wallet]);

    function DisconnectWalletButton() {
        return (
            <>
                <Box mb="1rem" as="button" onClick={() => DisconnectWallet()}>
                    <div className="font-face-sfpb">
                        <Text
                            borderColor="black"
                            borderWidth="1px"
                            width="200px"
                            height="25px"
                            fontSize={"16px"}
                            textAlign="center"
                            color="black"
                            mb="0"
                        >
                            DISCONNECT WALLET
                        </Text>
                    </div>
                </Box>
            </>
        );
    }

    return (
        <>
            {wallet.publicKey && <DisconnectWalletButton />}
            {!wallet.publicKey && <ConnectWalletButton />}

            {wallet.publicKey && collection === null && <SetCollectionOptions setCollection={setCollection} />}
            {wallet.publicKey && collection !== null && <SetTokenOptions token={token} collection={collection} setToken={setToken} />}
        </>
    );
}

export function CoreApp() {
    const wallets = useMemo(() => [], []);

    return (
        <WalletProvider wallets={wallets} autoConnect>
            <WalletModalProvider>
                <App />
            </WalletModalProvider>
        </WalletProvider>
    );
}

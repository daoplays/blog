import React, { useRef, useCallback, useEffect, useState, useMemo } from "react";
import { SetStateAction } from "react";
import { ConnectionProvider, WalletProvider, useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletModalProvider, useWalletModal } from "@solana/wallet-adapter-react-ui";

import { Box, HStack, Text, Center, VStack, NumberInput, NumberInputField, Divider, Image, Input, Flex } from "@chakra-ui/react";
import useResponsive from "./hooks/useResponsive";
import useCreateCollection from "./hooks/useCreateCollection";
import { PublicKey } from "@solana/web3.js";
import styles from "../../../../styles/Core.module.css";
function App() {
    const { connection } = useConnection();
    const wallet = useWallet();
    const { sm, md, lg } = useResponsive();

    const { CreateCollection, isLoading: isCollectionLoading } = useCreateCollection();

    const [collection, setCollection] = useState<PublicKey | null>(null);
    const [collection_name, setCollectionName] = useState<string>("");
    const [collection_uri, setCollectionURI] = useState<string>("");


    const handleNameChange = (e) => {
        setCollectionName(e.target.value);
    };

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

    function SetTokenOptions() {
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
                                        <div className={`${styles.textLabel} font-face-kg`} style={{ minWidth: lg ? "100px" : "132px" }}>
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
                                                onChange={handleNameChange}
                                            />
                                        </div>
                                    </HStack>
    
                                </VStack>
                            </HStack>
    
                            <HStack w="100%" spacing={lg ? 10 : 12} style={{ flexDirection: lg ? "column" : "row" }}>
                                
                                <VStack spacing={8} flexGrow={1} align="start" width="100%">
    
                                    <HStack spacing={0} className={styles.eachField}>
                                        <div className={`${styles.textLabel} font-face-kg`} style={{ minWidth: lg ? "100px" : "132px" }}>
                                            URI:
                                        </div>
    
                                        <div className={styles.textLabelInput}>
                                            <Input
                                                placeholder="Enter Collection URI"
                                                size={lg ? "md" : "lg"}
                                                maxLength={25}
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
                                    style={{ cursor: isCollectionLoading ? "not-allowed" : "pointer" }}
                                >
                                    {isCollectionLoading ? "Please Wait" : "Create"}
                                </button>
                            </HStack>
                        </VStack>
                    </form>
                </VStack>
            </Center>
        );
    }

    return (
        <>
            {wallet.publicKey && <DisconnectWalletButton />}
            {!wallet.publicKey && <ConnectWalletButton />}

            {wallet.publicKey && <SetTokenOptions />}
        </>
    );
}

    

export function CoreApp() {
    const network = "devnet";
    const wallets = useMemo(() => [], []);

    return (
            <WalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>
                    <App />
                </WalletModalProvider>
            </WalletProvider>
    );
}
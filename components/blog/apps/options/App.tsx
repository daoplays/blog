import React, { useRef, useCallback, useEffect, useState, useMemo, Dispatch } from "react";
import { SetStateAction } from "react";
import { WalletProvider, useWallet } from "@solana/wallet-adapter-react";
import { WalletModalProvider, useWalletModal } from "@solana/wallet-adapter-react-ui";
import Head from "next/head";

import { Box, HStack, Text, Center, VStack, Divider, Input, Link, Flex, Button, Stack } from "@chakra-ui/react";
import {
    getAssociatedTokenAddressSync,
    TOKEN_PROGRAM_ID,
    TOKEN_2022_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
    getMint,
    getTransferHook,
    resolveExtraAccountMeta,
    ExtraAccountMetaAccountDataLayout,
    unpackMint,
} from "@solana/spl-token";
import useResponsive from "./hooks/useResponsive";
import useCreateCollection from "./hooks/useCreateCollection";
import { PublicKey, Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";
import styles from "../../../../styles/Core.module.css";
import HybridInfo from "./tokenInfo";
import OptionsTable from "./table";
import { OptionData, default_option_data, PROGRAM, Asset } from "./state";
import { DEV_RPC_NODE, DEV_WSS_NODE } from "../common";
import { Mint } from "@solana/spl-token";
import { CallPut } from "./CallPut";
import { deserializeAssetV1, Key, getAssetV1GpaBuilder, updateAuthority, AssetV1 } from "@metaplex-foundation/mpl-core";
import type { RpcAccount, PublicKey as umiKey } from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { publicKey } from "@metaplex-foundation/umi";

require("@solana/wallet-adapter-react-ui/styles.css");

export const checkOptionsCollection = async (
    base_mint: Mint,
    quote_mint: Mint,
    setCollectionAssets: Dispatch<SetStateAction<AssetV1[]>>,
    setCollection: Dispatch<SetStateAction<PublicKey>>,
) => {
    if (base_mint === null || quote_mint === null) return;

    const umi = createUmi(DEV_RPC_NODE, "confirmed");

    let seed_keys: PublicKey[] = [];
    if (base_mint.address.toString() < quote_mint.address.toString()) {
        seed_keys.push(base_mint.address);
        seed_keys.push(quote_mint.address);
    } else {
        seed_keys.push(quote_mint.address);
        seed_keys.push(base_mint.address);
    }

    let collection_account = PublicKey.findProgramAddressSync(
        [seed_keys[0].toBytes(), seed_keys[1].toBytes(), Buffer.from("Collection")],
        PROGRAM,
    )[0];

    let collection_umiKey = publicKey(collection_account.toString());

    const assets = await getAssetV1GpaBuilder(umi)
        .whereField("key", Key.AssetV1)
        .whereField("updateAuthority", updateAuthority("Collection", [collection_umiKey]))
        .getDeserialized();

    console.log("check collection key", seed_keys[0].toString(), seed_keys[1].toString(), collection_account.toString());

    console.log("options", assets, collection_account.toString());

    setCollectionAssets(assets);
    setCollection(collection_account);
};

function App() {
    const wallet = useWallet();
    const [token, setToken] = useState<Mint | null>(null);
    const [selected, setSelected] = useState("Create");
    const { sm, lg } = useResponsive();
    const option_data = useRef<OptionData>(default_option_data);
    const [collection_assets, setCollectionAssets] = useState<AssetV1[]>([]);
    const [collection, setCollection] = useState<PublicKey | null>(null);
    const [solBalance, setSOLBalance] = useState<number>(0);
    const [tokenBalance, setTokenBalance] = useState<number>(0);
    const [is_token_2022, setTokenOwner] = useState<boolean>(false);
    const [quote_mint, setQuoteMint] = useState<Mint | null>(null);

    const check_collection = useRef<boolean>(true);

    const checkCollection = useCallback(async () => {
        if (token === null) return;

        const connection = new Connection(DEV_RPC_NODE, {
            wsEndpoint: DEV_WSS_NODE,
        });

        let user_token_account = getAssociatedTokenAddressSync(
            token.address, // mint
            wallet.publicKey, // owner
            true, // allow owner off curve
            is_token_2022 ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID,
        );

        let user_balance = await connection.getBalance(wallet.publicKey, "confirmed");
        let token_balance = 0;
        try {
            let response = await connection.getTokenAccountBalance(user_token_account, "confirmed");
            token_balance = parseFloat(response.value.amount) / Math.pow(10, response.value.decimals);
        } catch (error) {
            console.log(error);
        }

        let wsol_key = new PublicKey("So11111111111111111111111111111111111111112");
        let result = await connection.getAccountInfo(wsol_key, "confirmed");
        let wsol_mint = unpackMint(wsol_key, result, TOKEN_PROGRAM_ID);

        console.log("user balance", user_balance / LAMPORTS_PER_SOL, token_balance);

        setSOLBalance(user_balance / LAMPORTS_PER_SOL);
        setTokenBalance(token_balance);
        setQuoteMint(wsol_mint);

        await checkOptionsCollection(token, quote_mint, setCollectionAssets, setCollection);
    }, [wallet, token, quote_mint, is_token_2022]);

    useEffect(() => {
        if (token === null) return;

        if (!check_collection.current) return;

        checkCollection();
    }, [token, checkCollection]);

    function ConnectWalletButton() {
        const { setVisible } = useWalletModal();

        const handleConnectWallet = useCallback(async () => {
            setVisible(true);
        }, [setVisible]);

        return (
            <>
                <Box mt="10px" mb="1rem" as="button" onClick={handleConnectWallet}>
                    <div className="font-face-sfpb">
                        <Text
                            borderColor="white"
                            borderWidth="1px"
                            width="160px"
                            height="25px"
                            fontSize={"16px"}
                            textAlign="center"
                            color="white"
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
                <Box mt="10px" mb="1rem" as="button" onClick={() => DisconnectWallet()}>
                    <div className="font-face-sfpb">
                        <Text
                            borderColor="white"
                            borderWidth="1px"
                            width="200px"
                            height="25px"
                            fontSize={"16px"}
                            textAlign="center"
                            color="white"
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
            <Center
                style={{
                    background: "linear-gradient(180deg, #292929 0%, #0B0B0B 100%)",
                }}
                width="100%"
                mt="10px"
                mb="50px"
            >
                <VStack w="100%">
                    {wallet.publicKey && <DisconnectWalletButton />}
                    {!wallet.publicKey && <ConnectWalletButton />}

                    <HybridInfo option_data={option_data} setMint={setToken} setTokenOwner={setTokenOwner} />

                    <Flex
                        px={4}
                        py={18}
                        gap={4}
                        alignItems="center"
                        justifyContent={!sm ? "space-between" : "end"}
                        style={{
                            position: "relative",
                            flexDirection: sm ? "column" : "row",
                        }}
                        w={"100"}
                    >
                        <HStack spacing={3} zIndex={99}>
                            {["Create", "Trade", "Execute", "Refund"].map((name, i) => {
                                const isActive = selected === name;

                                const baseStyle = {
                                    display: "flex",
                                    alignItems: "center",
                                    cursor: "pointer",
                                };

                                const activeStyle = {
                                    color: "white",
                                    borderBottom: isActive ? "2px solid white" : "",
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
                                        <Text m={"0 auto"} fontSize="medium" fontWeight="semibold">
                                            {name}
                                        </Text>
                                    </HStack>
                                );
                            })}
                        </HStack>
                    </Flex>

                    {selected === "Create" && token !== null && (
                        <CallPut
                            base_mint={token}
                            quote_mint={quote_mint}
                            is_2022={is_token_2022}
                            token_balance={tokenBalance}
                            sol_balance={solBalance}
                            icon={option_data.current.token_image}
                            uri={option_data.current.token_uri}
                            symbol={option_data.current.token_symbol}
                        />
                    )}

                    {selected === "Trade" && (
                        <OptionsTable
                            base_2022={is_token_2022}
                            base_mint={token}
                            quote_2022={false}
                            quote_mint={quote_mint}
                            collection={collection}
                            optionsList={collection_assets}
                            mode={0}
                        />
                    )}

                    {selected === "Execute" && (
                        <OptionsTable
                            base_2022={is_token_2022}
                            base_mint={token}
                            quote_2022={false}
                            quote_mint={quote_mint}
                            collection={collection}
                            optionsList={collection_assets}
                            mode={1}
                        />
                    )}

                    {selected === "Refund" && (
                        <OptionsTable
                            base_2022={is_token_2022}
                            base_mint={token}
                            quote_2022={false}
                            quote_mint={quote_mint}
                            collection={collection}
                            optionsList={collection_assets}
                            mode={2}
                        />
                    )}
                </VStack>
            </Center>
        </>
    );
}

export function OptionsApp() {
    const wallets = useMemo(() => [], []);

    return <App />;
}

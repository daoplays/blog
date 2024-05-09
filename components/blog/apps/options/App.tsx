import React, {
  useRef,
  useCallback,
  useEffect,
  useState,
  useMemo,
  Dispatch,
} from "react";
import { SetStateAction } from "react";
import { WalletProvider, useWallet } from "@solana/wallet-adapter-react";
import {
  WalletModalProvider,
  useWalletModal,
} from "@solana/wallet-adapter-react-ui";
import Head from "next/head";

import {
  Box,
  HStack,
  Text,
  Center,
  VStack,
  Divider,
  Input,
  Link,
  Flex,
  Button,
  Stack,
} from "@chakra-ui/react";
import useResponsive from "./hooks/useResponsive";
import useCreateCollection from "./hooks/useCreateCollection";
import { PublicKey } from "@solana/web3.js";
import styles from "../../../../styles/Core.module.css";
import HybridInfo from "./tokenInfo";
import OptionsTable from "./table";
import { DEV_RPC_NODE, OptionData, default_option_data, PROGRAM, Asset } from "./state";
import { Mint } from "@solana/spl-token";
import { CallPut } from "./CallPut";
import {deserializeAssetV1, Key, getAssetV1GpaBuilder, updateAuthority, AssetV1} from "@metaplex-foundation/mpl-core";
import type { RpcAccount, PublicKey as umiKey } from '@metaplex-foundation/umi';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { publicKey } from '@metaplex-foundation/umi';

require("@solana/wallet-adapter-react-ui/styles.css");

function App() {
  const wallet = useWallet();
  const [token, setToken] = useState<Mint | null>(null);
  const [selected, setSelected] = useState("Create");
  const { sm, lg } = useResponsive();
  const option_data = useRef<OptionData>(default_option_data);
  const [collection_assets, setCollectionAssets] = useState<AssetV1[]>([]);
  const [collection, setCollection] = useState<PublicKey | null>(null);

  const check_collection = useRef<boolean>(true);

  const checkCollection = useCallback(async () => {
    if (token === null) return;

    const umi = createUmi(DEV_RPC_NODE, "confirmed");

    let collection_account = PublicKey.findProgramAddressSync(
      [token.address.toBytes(), Buffer.from("Collection")],
      PROGRAM,
    )[0];

    let collection_umiKey = publicKey(collection_account.toString());

    const assets = await getAssetV1GpaBuilder(umi)
    .whereField('key', Key.AssetV1)
    .whereField('updateAuthority', updateAuthority('Collection', [collection_umiKey]))
    .getDeserialized()

    console.log(assets);

   
    setCollectionAssets(assets);
    setCollection(collection_account);
    
}, [token]);

  useEffect(() => {
    if (token === null) return;

    if (!check_collection.current)
      return;

    checkCollection();

  }, [token, checkCollection]);

  function ConnectWalletButton() {
    const { setVisible } = useWalletModal();

    const handleConnectWallet = useCallback(async () => {
      setVisible(true);
    }, [setVisible]);

    return (
      <>
        <Box mt="10px"  mb="1rem" as="button" onClick={handleConnectWallet}>
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
        <Box mt = "10px" mb="1rem" as="button" onClick={() => DisconnectWallet()}>
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
      <VStack  w="100%" >
      {wallet.publicKey && <DisconnectWalletButton />}
      {!wallet.publicKey && <ConnectWalletButton />}


      <HybridInfo option_data={option_data} setMint={setToken}/>

      <Flex
        px={4}
        py={18}
        gap={4}
        alignItems="center"
        justifyContent={!sm ? "space-between" : "end"}
        style={{ position: "relative", flexDirection: sm ? "column" : "row" }}
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

      {selected === "Create" &&
      token !== null && (
        <CallPut
          mint_data={token}
          base_balance={0}
          quote_balance={0}
          user_balance={0}
          icon={option_data.current.token_image}
          uri={option_data.current.token_uri}
          symbol={option_data.current.token_symbol}
        />
      )
      }

      {selected === "Trade" && <OptionsTable collection={collection} optionsList={collection_assets} mode={0} update={checkCollection} />}

      {selected === "Execute" && <OptionsTable collection={collection} optionsList={collection_assets} mode={1} update={checkCollection}/>}

      {selected === "Refund" && <OptionsTable collection={collection} optionsList={collection_assets} mode={2} update={checkCollection}/>}

      </VStack>
      </Center>
    </>
  );
}

export function OptionsApp() {
  const wallets = useMemo(() => [], []);

  return (
    <WalletProvider wallets={wallets} autoConnect>
      <WalletModalProvider>
        <App />
      </WalletModalProvider>
    </WalletProvider>
  );
}
